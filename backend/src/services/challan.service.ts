import { Op } from 'sequelize';
import { sequelize } from '../db';
import { Challan, ChallanItem, Customer, Product, StockMovement, User } from '../models';
import { AppError } from '../utils/AppError';
import { generateChallanNumber } from '../utils/generateChallanNumber';
import { emitStockUpdate, emitLowStock, emitChallanConfirmed } from '../socket/events';

interface ChallanItemInput {
  product_id: string;
  quantity: number;
}

interface ListFilters {
  status?: string;
  customer_id?: string;
  date_from?: string;
  date_to?: string;
  page: number;
  limit: number;
}

export const challanService = {
  async listChallans(filters: ListFilters) {
    const { status, customer_id, date_from, date_to, page, limit } = filters;
    const offset = (page - 1) * limit;

    const where: any = {};

    if (status) where.status = status;
    if (customer_id) where.customer_id = customer_id;

    if (date_from || date_to) {
      where.created_at = {};
      if (date_from) where.created_at[Op.gte] = new Date(date_from);
      if (date_to) where.created_at[Op.lte] = new Date(date_to + 'T23:59:59.999Z');
    }

    const { rows, count } = await Challan.findAndCountAll({
      where,
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'mobile', 'business_name'] },
        { model: User, as: 'creator', attributes: ['id', 'name'] },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    return {
      data: rows,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    };
  },

  async getChallan(id: string) {
    const challan = await Challan.findByPk(id, {
      include: [
        { model: Customer, as: 'customer' },
        { model: User, as: 'creator', attributes: ['id', 'name'] },
        { model: ChallanItem, as: 'items' },
      ],
    });

    if (!challan) {
      throw new AppError(404, 'Challan not found');
    }

    return challan;
  },

  async createChallan(customerId: string, items: ChallanItemInput[], userId: string) {
    const transaction = await sequelize.transaction();

    try {
      // Validate customer exists
      const customer = await Customer.findByPk(customerId, { transaction });
      if (!customer) {
        throw new AppError(404, 'Customer not found');
      }

      // Generate challan number
      const challanNumber = await generateChallanNumber(transaction);

      // Fetch product details for snapshots
      const productIds = items.map((item) => item.product_id);
      const products = await Product.findAll({
        where: { id: { [Op.in]: productIds } },
        transaction,
      });

      const productMap = new Map(products.map((p) => [p.id, p]));

      // Validate all products exist
      for (const item of items) {
        if (!productMap.has(item.product_id)) {
          throw new AppError(404, `Product not found: ${item.product_id}`);
        }
      }

      // Build challan items with snapshots
      let totalQuantity = 0;
      let totalAmount = 0;

      const challanItemsData = items.map((item) => {
        const product = productMap.get(item.product_id)!;
        const unitPrice = Number(product.unit_price);
        totalQuantity += item.quantity;
        totalAmount += unitPrice * item.quantity;

        return {
          product_id: item.product_id,
          product_name_snapshot: product.name,
          sku_snapshot: product.sku,
          unit_price_snapshot: unitPrice,
          quantity: item.quantity,
        };
      });

      // Create challan
      const challan = await Challan.create(
        {
          challan_number: challanNumber,
          customer_id: customerId,
          status: 'Draft',
          total_quantity: totalQuantity,
          total_amount: totalAmount,
          created_by: userId,
          confirmed_at: null,
        },
        { transaction }
      );

      // Create challan items
      await ChallanItem.bulkCreate(
        challanItemsData.map((item) => ({
          ...item,
          challan_id: challan.id,
        })),
        { transaction }
      );

      await transaction.commit();

      // Return full challan with items
      return this.getChallan(challan.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async updateChallan(id: string, items: ChallanItemInput[]) {
    const transaction = await sequelize.transaction();

    try {
      const challan = await Challan.findByPk(id, { transaction });

      if (!challan) {
        throw new AppError(404, 'Challan not found');
      }

      if (challan.status !== 'Draft') {
        throw new AppError(400, 'Only draft challans can be edited');
      }

      // Delete existing items
      await ChallanItem.destroy({ where: { challan_id: id }, transaction });

      // Fetch product details
      const productIds = items.map((item) => item.product_id);
      const products = await Product.findAll({
        where: { id: { [Op.in]: productIds } },
        transaction,
      });

      const productMap = new Map(products.map((p) => [p.id, p]));

      for (const item of items) {
        if (!productMap.has(item.product_id)) {
          throw new AppError(404, `Product not found: ${item.product_id}`);
        }
      }

      let totalQuantity = 0;
      let totalAmount = 0;

      const challanItemsData = items.map((item) => {
        const product = productMap.get(item.product_id)!;
        const unitPrice = Number(product.unit_price);
        totalQuantity += item.quantity;
        totalAmount += unitPrice * item.quantity;

        return {
          challan_id: id,
          product_id: item.product_id,
          product_name_snapshot: product.name,
          sku_snapshot: product.sku,
          unit_price_snapshot: unitPrice,
          quantity: item.quantity,
        };
      });

      // Create new items
      await ChallanItem.bulkCreate(challanItemsData, { transaction });

      // Update totals
      await challan.update(
        { total_quantity: totalQuantity, total_amount: totalAmount },
        { transaction }
      );

      await transaction.commit();

      return this.getChallan(id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async confirmChallan(id: string, userId: string) {
    const transaction = await sequelize.transaction();

    try {
      const challan = await Challan.findByPk(id, {
        include: [{ model: ChallanItem, as: 'items' }],
        transaction,
      });

      if (!challan) {
        throw new AppError(404, 'Challan not found');
      }

      if (challan.status !== 'Draft') {
        throw new AppError(400, 'Only draft challans can be confirmed');
      }

      const items = challan.items || [];

      // For each item: lock product, validate stock, deduct
      for (const item of items) {
        const product = await Product.findByPk(item.product_id, {
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

        if (!product) {
          throw new AppError(404, `Product not found: ${item.product_id}`);
        }

        const currentStock = Number(product.current_stock);
        const newStock = currentStock - item.quantity;

        if (newStock < 0) {
          throw new AppError(
            400,
            `Insufficient stock for "${product.name}" (SKU: ${product.sku}). Available: ${currentStock}, Requested: ${item.quantity}`
          );
        }

        // Deduct stock
        await product.update({ current_stock: newStock }, { transaction });

        // Record stock movement
        await StockMovement.create(
          {
            product_id: item.product_id,
            quantity_changed: item.quantity,
            movement_type: 'OUT',
            reason: `Sales Challan ${challan.challan_number}`,
            created_by: userId,
          },
          { transaction }
        );

        // Emit real-time events after commit (queued below)
      }

      // Update challan status
      await challan.update(
        { status: 'Confirmed', confirmed_at: new Date() },
        { transaction }
      );

      await transaction.commit();

      // Emit real-time events after successful commit
      for (const item of items) {
        const product = await Product.findByPk(item.product_id);
        if (product) {
          const productData = {
            id: product.id,
            name: product.name,
            sku: product.sku,
            current_stock: Number(product.current_stock),
            min_stock_alert: product.min_stock_alert,
          };
          emitStockUpdate(productData);
          if (Number(product.current_stock) <= product.min_stock_alert) {
            emitLowStock(productData);
          }
        }
      }

      emitChallanConfirmed({
        id: challan.id,
        challan_number: challan.challan_number,
        total_amount: challan.total_amount,
      });

      return this.getChallan(id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async cancelChallan(id: string, userId: string) {
    const transaction = await sequelize.transaction();

    try {
      const challan = await Challan.findByPk(id, {
        include: [{ model: ChallanItem, as: 'items' }],
        transaction,
      });

      if (!challan) {
        throw new AppError(404, 'Challan not found');
      }

      if (challan.status === 'Cancelled') {
        throw new AppError(400, 'Challan is already cancelled');
      }

      // If confirmed, reverse the stock deductions
      if (challan.status === 'Confirmed') {
        const items = challan.items || [];

        for (const item of items) {
          const product = await Product.findByPk(item.product_id, {
            transaction,
            lock: transaction.LOCK.UPDATE,
          });

          if (product) {
            const newStock = Number(product.current_stock) + item.quantity;
            await product.update({ current_stock: newStock }, { transaction });

            await StockMovement.create(
              {
                product_id: item.product_id,
                quantity_changed: item.quantity,
                movement_type: 'IN',
                reason: `Cancelled Sales Challan ${challan.challan_number}`,
                created_by: userId,
              },
              { transaction }
            );
          }
        }
      }

      await challan.update({ status: 'Cancelled' }, { transaction });
      await transaction.commit();

      return this.getChallan(id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async getInvoiceData(id: string) {
    const challan = await Challan.findByPk(id, {
      include: [
        { model: Customer, as: 'customer' },
        { model: User, as: 'creator', attributes: ['id', 'name'] },
        { model: ChallanItem, as: 'items' },
      ],
    });

    if (!challan) {
      throw new AppError(404, 'Challan not found');
    }

    if (challan.status !== 'Confirmed') {
      throw new AppError(400, 'Invoice can only be generated for confirmed challans');
    }

    const customer = challan.customer!;
    const creator = challan.creator!;

    return {
      challan_number: challan.challan_number,
      created_at: challan.created_at,
      confirmed_at: challan.confirmed_at,
      customer_name: customer.name,
      customer_mobile: customer.mobile,
      customer_email: customer.email,
      customer_business_name: customer.business_name,
      customer_gst_number: customer.gst_number,
      customer_address: customer.address,
      items: (challan.items || []).map((item) => ({
        product_name_snapshot: item.product_name_snapshot,
        sku_snapshot: item.sku_snapshot,
        unit_price_snapshot: Number(item.unit_price_snapshot),
        quantity: item.quantity,
      })),
      total_quantity: challan.total_quantity,
      total_amount: Number(challan.total_amount),
      created_by_name: (creator as any).name,
    };
  },
};

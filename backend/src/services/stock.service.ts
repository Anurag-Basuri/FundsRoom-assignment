import { Op } from 'sequelize';
import { sequelize } from '../db';
import { Product, StockMovement, User } from '../models';
import { AppError } from '../utils/AppError';
import { emitStockUpdate, emitLowStock } from '../socket/events';

interface ListFilters {
  product_id?: string;
  movement_type?: string;
  date_from?: string;
  date_to?: string;
  page: number;
  limit: number;
}

export const stockService = {
  async recordMovement(
    productId: string,
    quantity: number,
    movementType: 'IN' | 'OUT',
    reason: string,
    userId: string
  ) {
    const transaction = await sequelize.transaction();

    try {
      // Lock the product row to prevent race conditions
      const product = await Product.findByPk(productId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!product) {
        throw new AppError(404, 'Product not found');
      }

      const currentStock = Number(product.current_stock);
      let newStock: number;

      if (movementType === 'IN') {
        newStock = currentStock + quantity;
      } else {
        newStock = currentStock - quantity;
        if (newStock < 0) {
          throw new AppError(400, `Insufficient stock for "${product.name}". Available: ${currentStock}, Requested: ${quantity}`);
        }
      }

      // Update product stock
      await product.update({ current_stock: newStock }, { transaction });

      // Create stock movement record
      const movement = await StockMovement.create(
        {
          product_id: productId,
          quantity_changed: quantity,
          movement_type: movementType,
          reason,
          created_by: userId,
        },
        { transaction }
      );

      await transaction.commit();

      // Emit real-time events
      const productData = {
        id: product.id,
        name: product.name,
        sku: product.sku,
        current_stock: newStock,
        min_stock_alert: product.min_stock_alert,
      };

      emitStockUpdate(productData);

      if (newStock <= product.min_stock_alert) {
        emitLowStock(productData);
      }

      return movement;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async listMovements(filters: ListFilters) {
    const { product_id, movement_type, date_from, date_to, page, limit } = filters;
    const offset = (page - 1) * limit;

    const where: any = {};

    if (product_id) where.product_id = product_id;
    if (movement_type) where.movement_type = movement_type;

    if (date_from || date_to) {
      where.created_at = {};
      if (date_from) where.created_at[Op.gte] = new Date(date_from);
      if (date_to) where.created_at[Op.lte] = new Date(date_to + 'T23:59:59.999Z');
    }

    const { rows, count } = await StockMovement.findAndCountAll({
      where,
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name', 'sku'] },
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
};

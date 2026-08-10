import { Op } from 'sequelize';
import { Product } from '../models';
import { AppError } from '../utils/AppError';

interface ListFilters {
  search?: string;
  category?: string;
  low_stock?: string;
  page: number;
  limit: number;
}

export const productService = {
  async listProducts(filters: ListFilters) {
    const { search, category, low_stock, page, limit } = filters;
    const offset = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { sku: { [Op.iLike]: `%${search}%` } },
        { category: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (category) where.category = category;

    if (low_stock === 'true') {
      where.current_stock = {
        [Op.lte]: { [Op.col]: 'min_stock_alert' },
      };
    }

    const { rows, count } = await Product.findAndCountAll({
      where,
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

  async getProduct(id: string) {
    const product = await Product.findByPk(id);
    if (!product) {
      throw new AppError(404, 'Product not found');
    }
    return product;
  },

  async createProduct(data: any) {
    const existing = await Product.findOne({ where: { sku: data.sku } });
    if (existing) {
      throw new AppError(409, `Product with SKU "${data.sku}" already exists`);
    }

    const product = await Product.create(data);
    return product;
  },

  async updateProduct(id: string, data: any) {
    const product = await Product.findByPk(id);
    if (!product) {
      throw new AppError(404, 'Product not found');
    }

    if (data.sku && data.sku !== product.sku) {
      const existing = await Product.findOne({ where: { sku: data.sku } });
      if (existing) {
        throw new AppError(409, `Product with SKU "${data.sku}" already exists`);
      }
    }

    await product.update(data);
    return product;
  },

  async deleteProduct(id: string) {
    const product = await Product.findByPk(id);
    if (!product) {
      throw new AppError(404, 'Product not found');
    }

    await product.destroy();
    return { message: 'Product deleted successfully' };
  },

  async getLowStock() {
    const products = await Product.findAll({
      where: {
        current_stock: {
          [Op.lte]: { [Op.col]: 'min_stock_alert' } as any,
        },
      },
      order: [['current_stock', 'ASC']],
    });

    return products;
  },
};

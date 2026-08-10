import { Op } from 'sequelize';
import { Customer, FollowUp, User } from '../models';
import { AppError } from '../utils/AppError';

interface ListFilters {
  search?: string;
  status?: string;
  customer_type?: string;
  page: number;
  limit: number;
}

export const customerService = {
  async listCustomers(filters: ListFilters) {
    const { search, status, customer_type, page, limit } = filters;
    const offset = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { mobile: { [Op.iLike]: `%${search}%` } },
        { business_name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (status) where.status = status;
    if (customer_type) where.customer_type = customer_type;

    const { rows, count } = await Customer.findAndCountAll({
      where,
      include: [{ model: User, as: 'creator', attributes: ['id', 'name'] }],
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

  async getCustomer(id: string) {
    const customer = await Customer.findByPk(id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name'] },
        {
          model: FollowUp,
          as: 'followUps',
          include: [{ model: User, as: 'creator', attributes: ['id', 'name'] }],
          order: [['created_at', 'DESC']],
        },
      ],
    });

    if (!customer) {
      throw new AppError(404, 'Customer not found');
    }

    return customer;
  },

  async createCustomer(data: any, userId: string) {
    const customer = await Customer.create({
      ...data,
      created_by: userId,
    });

    return customer;
  },

  async updateCustomer(id: string, data: any) {
    const customer = await Customer.findByPk(id);
    if (!customer) {
      throw new AppError(404, 'Customer not found');
    }

    await customer.update(data);
    return customer;
  },

  async deleteCustomer(id: string) {
    const customer = await Customer.findByPk(id);
    if (!customer) {
      throw new AppError(404, 'Customer not found');
    }

    await customer.destroy();
    return { message: 'Customer deleted successfully' };
  },

  async addFollowUp(customerId: string, data: { note: string; follow_up_date?: string | null }, userId: string) {
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      throw new AppError(404, 'Customer not found');
    }

    const followUp = await FollowUp.create({
      customer_id: customerId,
      note: data.note,
      follow_up_date: data.follow_up_date || null,
      created_by: userId,
    });

    // Update the customer's next follow-up date
    if (data.follow_up_date) {
      await customer.update({ follow_up_date: data.follow_up_date });
    }

    return followUp;
  },

  async getFollowUps(customerId: string) {
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      throw new AppError(404, 'Customer not found');
    }

    const followUps = await FollowUp.findAll({
      where: { customer_id: customerId },
      include: [{ model: User, as: 'creator', attributes: ['id', 'name'] }],
      order: [['created_at', 'DESC']],
    });

    return followUps;
  },
};

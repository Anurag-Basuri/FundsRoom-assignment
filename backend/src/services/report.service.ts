import { Op, fn, col, literal } from 'sequelize';
import { sequelize } from '../db';
import { Customer, Product, Challan, StockMovement, FollowUp } from '../models';

export const reportService = {
  async getDashboardSummary(userRole: string, userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Common stats
    const totalCustomers = await Customer.count();
    const totalProducts = await Product.count();
    const lowStockCount = await Product.count({
      where: {
        current_stock: { [Op.lte]: col('min_stock_alert') },
      },
    });

    const challansThisWeek = await Challan.count({
      where: {
        created_at: { [Op.gte]: startOfWeek },
      },
    });

    const revenueThisMonth = await Challan.sum('total_amount', {
      where: {
        status: 'Confirmed',
        confirmed_at: { [Op.gte]: startOfMonth },
      },
    }) || 0;

    const totalChallans = await Challan.count();
    const confirmedChallans = await Challan.count({ where: { status: 'Confirmed' } });
    const draftChallans = await Challan.count({ where: { status: 'Draft' } });

    // Role-specific data
    let roleSpecific: any = {};

    if (userRole === 'Sales') {
      const myOpenLeads = await Customer.count({
        where: { created_by: userId, status: 'Lead' },
      });

      const followUpsDueToday = await FollowUp.count({
        where: {
          created_by: userId,
          follow_up_date: {
            [Op.eq]: today,
          },
        },
      });

      const myDraftChallans = await Challan.count({
        where: { created_by: userId, status: 'Draft' },
      });

      roleSpecific = { myOpenLeads, followUpsDueToday, myDraftChallans };
    }

    if (userRole === 'Warehouse') {
      const todaysMovements = await StockMovement.count({
        where: {
          created_at: { [Op.gte]: today },
        },
      });

      const lowStockProducts = await Product.findAll({
        where: {
          current_stock: { [Op.lte]: col('min_stock_alert') },
        },
        attributes: ['id', 'name', 'sku', 'current_stock', 'min_stock_alert'],
        order: [['current_stock', 'ASC']],
        limit: 10,
      });

      roleSpecific = { todaysMovements, lowStockProducts };
    }

    if (userRole === 'Accounts') {
      // Monthly revenue trend (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const monthlyRevenue = await Challan.findAll({
        where: {
          status: 'Confirmed',
          confirmed_at: { [Op.gte]: sixMonthsAgo },
        },
        attributes: [
          [fn('TO_CHAR', col('confirmed_at'), 'YYYY-MM'), 'month'],
          [fn('SUM', col('total_amount')), 'revenue'],
          [fn('COUNT', col('id')), 'count'],
        ],
        group: [fn('TO_CHAR', col('confirmed_at'), 'YYYY-MM')],
        order: [[fn('TO_CHAR', col('confirmed_at'), 'YYYY-MM'), 'ASC']],
        raw: true,
      });

      roleSpecific = { monthlyRevenue };
    }

    // Recent challans for Admin
    let recentChallans: any[] = [];
    if (userRole === 'Admin') {
      recentChallans = await Challan.findAll({
        include: [
          { model: Customer, as: 'customer', attributes: ['id', 'name'] },
        ],
        order: [['created_at', 'DESC']],
        limit: 5,
      });
    }

    return {
      summary: {
        totalCustomers,
        totalProducts,
        lowStockCount,
        challansThisWeek,
        revenueThisMonth: Number(revenueThisMonth),
        totalChallans,
        confirmedChallans,
        draftChallans,
      },
      roleSpecific,
      recentChallans,
    };
  },
};

import { axiosInstance } from './axiosInstance';

export interface DashboardSummary {
  summary: {
    totalCustomers: number;
    totalProducts: number;
    lowStockCount: number;
    challansThisWeek: number;
    revenueThisMonth: number;
    totalChallans: number;
    confirmedChallans: number;
    draftChallans: number;
  };
  roleSpecific: any;
  recentChallans: any[];
}

export const dashboardApi = {
  getSummary: async (): Promise<DashboardSummary> => {
    const { data } = await axiosInstance.get('/dashboard/summary');
    return data.data;
  },
};

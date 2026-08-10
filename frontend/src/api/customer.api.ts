import { axiosInstance } from './axiosInstance';
import { Customer, FollowUp } from '../types/customer.types';

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const customerApi = {
  list: async (params?: Record<string, string | number>): Promise<PaginatedResponse<Customer>> => {
    const { data } = await axiosInstance.get('/customers', { params });
    return { data: data.data, meta: data.meta };
  },

  getOne: async (id: string): Promise<Customer> => {
    const { data } = await axiosInstance.get(`/customers/${id}`);
    return data.data;
  },

  create: async (customer: Partial<Customer>): Promise<Customer> => {
    const { data } = await axiosInstance.post('/customers', customer);
    return data.data;
  },

  update: async (id: string, customer: Partial<Customer>): Promise<Customer> => {
    const { data } = await axiosInstance.patch(`/customers/${id}`, customer);
    return data.data;
  },

  addFollowUp: async (id: string, note: string, follow_up_date?: string): Promise<FollowUp> => {
    const { data } = await axiosInstance.post(`/customers/${id}/follow-ups`, { note, follow_up_date });
    return data.data;
  },
};

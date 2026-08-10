import { axiosInstance } from './axiosInstance';
import { StockMovement } from '../types/product.types';
import { PaginatedResponse } from './customer.api';

export const stockApi = {
  listMovements: async (params?: Record<string, string | number>): Promise<PaginatedResponse<StockMovement>> => {
    const { data } = await axiosInstance.get('/stock/movements', { params });
    return { data: data.data, meta: data.meta };
  },

  createMovement: async (movementData: { product_id: string; quantity: number; movement_type: 'IN' | 'OUT'; reason: string }): Promise<StockMovement> => {
    const { data } = await axiosInstance.post('/stock/movements', movementData);
    return data.data;
  },
};

import { axiosInstance } from './axiosInstance';
import { Product } from '../types/product.types';
import { PaginatedResponse } from './customer.api';

export const productApi = {
  list: async (params?: Record<string, string | number>): Promise<PaginatedResponse<Product>> => {
    const { data } = await axiosInstance.get('/products', { params });
    return { data: data.data, meta: data.meta };
  },

  getOne: async (id: string): Promise<Product> => {
    const { data } = await axiosInstance.get(`/products/${id}`);
    return data.data;
  },

  create: async (product: Partial<Product>): Promise<Product> => {
    const { data } = await axiosInstance.post('/products', product);
    return data.data;
  },

  update: async (id: string, product: Partial<Product>): Promise<Product> => {
    const { data } = await axiosInstance.patch(`/products/${id}`, product);
    return data.data;
  },
};

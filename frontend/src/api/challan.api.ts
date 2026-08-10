import { axiosInstance } from './axiosInstance';
import { Challan } from '../types/challan.types';
import { PaginatedResponse } from './customer.api';

export const challanApi = {
  list: async (params?: Record<string, string | number>): Promise<PaginatedResponse<Challan>> => {
    const { data } = await axiosInstance.get('/challans', { params });
    return { data: data.data, meta: data.meta };
  },

  getOne: async (id: string): Promise<Challan> => {
    const { data } = await axiosInstance.get(`/challans/${id}`);
    return data.data;
  },

  create: async (challanData: { customer_id: string; items: { product_id: string; quantity: number }[] }): Promise<Challan> => {
    const { data } = await axiosInstance.post('/challans', challanData);
    return data.data;
  },

  update: async (id: string, challanData: { items: { product_id: string; quantity: number }[] }): Promise<Challan> => {
    const { data } = await axiosInstance.patch(`/challans/${id}`, challanData);
    return data.data;
  },

  confirm: async (id: string): Promise<Challan> => {
    const { data } = await axiosInstance.patch(`/challans/${id}/confirm`);
    return data.data;
  },

  cancel: async (id: string): Promise<Challan> => {
    const { data } = await axiosInstance.patch(`/challans/${id}/cancel`);
    return data.data;
  },

  downloadInvoice: async (id: string): Promise<void> => {
    const response = await axiosInstance.get(`/challans/${id}/invoice`, {
      responseType: 'blob',
    });
    
    // Create blob link to download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `invoice-${id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
  },
};

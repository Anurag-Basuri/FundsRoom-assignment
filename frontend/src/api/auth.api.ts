import { axiosInstance } from './axiosInstance';
import { LoginCredentials, AuthResponse, UserProfile } from '../types/auth.types';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await axiosInstance.post('/auth/login', credentials);
    return data.data;
  },

  logout: async (): Promise<void> => {
    await axiosInstance.post('/auth/logout');
  },

  getProfile: async (): Promise<UserProfile> => {
    const { data } = await axiosInstance.get('/auth/me');
    return data.data;
  },
};

import axios from 'axios';
import { useAuthStore } from '../store/authStore';

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: add JWT
axiosInstance.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: handle 401 refresh and log errors
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Log the error for debugging
    console.error('[Axios Error]', error.message, error.response?.data || error);

    const originalRequest = error.config;

    // Avoid infinite loop if refresh fails
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/refresh' && originalRequest.url !== '/auth/login') {
      originalRequest._retry = true;

      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${axiosInstance.defaults.baseURL}/auth/refresh`, {
          refreshToken,
        });

        const newAccessToken = response.data.data.accessToken;
        
        // Update store
        useAuthStore.getState().setAccessToken(newAccessToken);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

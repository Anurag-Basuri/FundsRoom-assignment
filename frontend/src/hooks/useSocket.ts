import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

let socket: Socket | null = null;

export const useSocket = () => {
  const { accessToken } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (accessToken && !socket) {
      socket = io(import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000', {
        auth: {
          token: accessToken,
        },
      });

      socket.on('connect', () => {
        console.log('Socket connected');
      });

      socket.on('stock:updated', () => {
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['products-list'] });
        queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      });

      socket.on('stock:low', (data) => {
        toast.warning(`Low Stock Alert: ${data.name} (${data.sku}) is now at ${data.current_stock}!`);
      });

      socket.on('challan:confirmed', (data) => {
        queryClient.invalidateQueries({ queryKey: ['challans'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        toast.info(`Challan ${data.challan_number} has been confirmed. Stock deducted.`);
      });
    }

    return () => {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
    };
  }, [accessToken, queryClient]);

  return socket;
};

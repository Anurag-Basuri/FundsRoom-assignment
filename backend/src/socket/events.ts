export const EVENTS = {
  STOCK_UPDATED: 'stock:updated',
  STOCK_LOW: 'stock:low',
  CHALLAN_CONFIRMED: 'challan:confirmed',
  CHALLAN_CANCELLED: 'challan:cancelled',
  FOLLOWUP_DUE: 'followup:due',
} as const;

// In-memory reference to the io instance, set by socket/index.ts
import { Server } from 'socket.io';

let ioInstance: Server | null = null;

export const setIoInstance = (io: Server): void => {
  ioInstance = io;
};

export const getIo = (): Server | null => ioInstance;

export const emitToRoom = (room: string, event: string, data: unknown): void => {
  if (ioInstance) {
    ioInstance.to(room).emit(event, data);
  }
};

export const emitStockUpdate = (productData: unknown): void => {
  emitToRoom('role:Warehouse', EVENTS.STOCK_UPDATED, productData);
  emitToRoom('role:Admin', EVENTS.STOCK_UPDATED, productData);
};

export const emitLowStock = (productData: unknown): void => {
  emitToRoom('role:Warehouse', EVENTS.STOCK_LOW, productData);
  emitToRoom('role:Admin', EVENTS.STOCK_LOW, productData);
};

export const emitChallanConfirmed = (challanData: unknown): void => {
  emitToRoom('role:Accounts', EVENTS.CHALLAN_CONFIRMED, challanData);
  emitToRoom('role:Admin', EVENTS.CHALLAN_CONFIRMED, challanData);
};

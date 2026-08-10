import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import { logger } from '../utils/logger';
import { setIoInstance } from './events';
import { env } from '../config/env';

export const initSocket = (httpServer: HttpServer): Server => {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  // Authentication middleware for Socket.io
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = verifyAccessToken(token);
      (socket as any).user = decoded;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const user = (socket as any).user;
    logger.info(`Socket connected: ${user.id} (${user.role})`);

    // Join role-based room
    socket.join(`role:${user.role}`);
    // Join user-specific room
    socket.join(`user:${user.id}`);

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${user.id}`);
    });
  });

  // Store the io instance for use in services
  setIoInstance(io);

  logger.info('🔌 Socket.io initialized');
  return io;
};

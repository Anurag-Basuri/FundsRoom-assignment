import http from 'http';
import app from './app';
import { connectDB } from './db';
import { sequelize } from './db';
import { initSocket } from './socket';
import { env } from './config/env';
import { logger } from './utils/logger';

// Import models to register them with Sequelize
import './models';

const httpServer = http.createServer(app);

// Initialize Socket.io
initSocket(httpServer);

const start = async (): Promise<void> => {
  try {
    // Connect to database
    await connectDB();

    // Sync database (creates tables if they don't exist, without slow altering on every restart)
    await sequelize.sync();
    logger.info('📦 Database synchronized');

    // Start listening
    httpServer.listen(env.PORT, () => {
      logger.info(`🚀 Server running on port ${env.PORT}`);
      logger.info(`📡 Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  httpServer.close(() => {
    sequelize.close().then(() => {
      logger.info('Database connection closed');
      process.exit(0);
    });
  });
});

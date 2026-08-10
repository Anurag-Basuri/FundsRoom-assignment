import { Sequelize } from 'sequelize';
import { env } from './config/env';
import { logger } from './utils/logger';

const sequelize = env.NODE_ENV === 'test'
  ? new Sequelize('sqlite::memory:', { logging: false })
  : new Sequelize(env.DATABASE_URL, {
      dialect: 'postgres',
      logging: env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
      pool: {
        max: 10,
        min: 2,
        acquire: 30000,
        idle: 10000,
      },
      dialectOptions: env.NODE_ENV === 'production' ? {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      } : {},
    });

export const connectDB = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    logger.info('✅ Database connection established successfully');
  } catch (error) {
    logger.error('❌ Unable to connect to the database:', error);
    process.exit(1);
  }
};

export { sequelize };

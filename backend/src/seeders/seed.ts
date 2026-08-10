import bcrypt from 'bcrypt';
import { sequelize } from '../db';
import { User, Customer, Product, Counter } from '../models';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const seed = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connected for seeding');

    // Sync all models
    await sequelize.sync({ force: true });
    logger.info('Database synced (tables recreated)');

    const passwordHash = await bcrypt.hash('password123', env.BCRYPT_SALT_ROUNDS);

    // Create users (one per role)
    const [admin, sales, warehouse, accounts] = await Promise.all([
      User.create({
        name: 'Admin User',
        email: 'admin@fundsroom.com',
        password_hash: passwordHash,
        role: 'Admin',
      }),
      User.create({
        name: 'Sales User',
        email: 'sales@fundsroom.com',
        password_hash: passwordHash,
        role: 'Sales',
      }),
      User.create({
        name: 'Warehouse User',
        email: 'warehouse@fundsroom.com',
        password_hash: passwordHash,
        role: 'Warehouse',
      }),
      User.create({
        name: 'Accounts User',
        email: 'accounts@fundsroom.com',
        password_hash: passwordHash,
        role: 'Accounts',
      }),
    ]);

    logger.info('✅ Users seeded');

    // Create sample customers
    const customers = await Customer.bulkCreate([
      {
        name: 'Rajesh Kumar',
        mobile: '9876543210',
        email: 'rajesh@example.com',
        business_name: 'Kumar Traders',
        gst_number: '29ABCDE1234F1Z5',
        customer_type: 'Wholesale',
        address: '123 MG Road, Bangalore',
        status: 'Active',
        created_by: sales.id,
      },
      {
        name: 'Priya Sharma',
        mobile: '9876543211',
        email: 'priya@example.com',
        business_name: 'Sharma Distributors',
        gst_number: '07FGHIJ5678K2L3',
        customer_type: 'Distributor',
        address: '456 Connaught Place, Delhi',
        status: 'Active',
        created_by: sales.id,
      },
      {
        name: 'Amit Patel',
        mobile: '9876543212',
        email: 'amit@example.com',
        customer_type: 'Retail',
        address: '789 SG Highway, Ahmedabad',
        status: 'Lead',
        notes: 'Interested in bulk purchase of electronics',
        follow_up_date: new Date(Date.now() + 86400000), // tomorrow
        created_by: sales.id,
      },
      {
        name: 'Sunita Verma',
        mobile: '9876543213',
        business_name: 'Verma & Sons',
        customer_type: 'Wholesale',
        address: '321 Civil Lines, Jaipur',
        status: 'Lead',
        created_by: admin.id,
      },
      {
        name: 'Vikram Singh',
        mobile: '9876543214',
        email: 'vikram@example.com',
        business_name: 'Singh Enterprises',
        gst_number: '06KLMNO9012P3Q4',
        customer_type: 'Distributor',
        address: '654 Sector 17, Chandigarh',
        status: 'Inactive',
        created_by: sales.id,
      },
    ]);

    logger.info('✅ Customers seeded');

    // Create sample products
    const products = await Product.bulkCreate([
      {
        name: 'Wireless Bluetooth Headphones',
        sku: 'ELEC-WBH-001',
        category: 'Electronics',
        unit_price: 1499.99,
        current_stock: 150,
        min_stock_alert: 20,
        location: 'Warehouse A - Shelf 1',
      },
      {
        name: 'USB-C Charging Cable (1m)',
        sku: 'ELEC-UCC-002',
        category: 'Electronics',
        unit_price: 299.00,
        current_stock: 500,
        min_stock_alert: 50,
        location: 'Warehouse A - Shelf 2',
      },
      {
        name: 'Office Chair - Ergonomic',
        sku: 'FURN-OCE-001',
        category: 'Furniture',
        unit_price: 8999.00,
        current_stock: 25,
        min_stock_alert: 5,
        location: 'Warehouse B - Section 1',
      },
      {
        name: 'A4 Printer Paper (500 sheets)',
        sku: 'STAT-PP4-001',
        category: 'Stationery',
        unit_price: 350.00,
        current_stock: 8,
        min_stock_alert: 15,
        location: 'Warehouse A - Shelf 5',
      },
      {
        name: 'LED Desk Lamp',
        sku: 'ELEC-LDL-003',
        category: 'Electronics',
        unit_price: 1299.00,
        current_stock: 60,
        min_stock_alert: 10,
        location: 'Warehouse A - Shelf 3',
      },
      {
        name: 'Mechanical Keyboard',
        sku: 'ELEC-MKB-004',
        category: 'Electronics',
        unit_price: 3499.00,
        current_stock: 3,
        min_stock_alert: 10,
        location: 'Warehouse A - Shelf 1',
      },
      {
        name: 'Laptop Stand - Aluminum',
        sku: 'ACCS-LSA-001',
        category: 'Accessories',
        unit_price: 2499.00,
        current_stock: 40,
        min_stock_alert: 8,
        location: 'Warehouse B - Section 2',
      },
      {
        name: 'Whiteboard Marker Set (12 pack)',
        sku: 'STAT-WMS-002',
        category: 'Stationery',
        unit_price: 180.00,
        current_stock: 200,
        min_stock_alert: 30,
        location: 'Warehouse A - Shelf 5',
      },
    ]);

    logger.info('✅ Products seeded');

    // Initialize challan counter
    await Counter.create({
      year: new Date().getFullYear(),
      last_value: 0,
    });

    logger.info('✅ Counter initialized');
    logger.info('');
    logger.info('🎉 Database seeding complete!');
    logger.info('');
    logger.info('Login credentials (password: password123):');
    logger.info('  Admin:     admin@fundsroom.com');
    logger.info('  Sales:     sales@fundsroom.com');
    logger.info('  Warehouse: warehouse@fundsroom.com');
    logger.info('  Accounts:  accounts@fundsroom.com');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed:', error);
    process.exit(1);
  }
};

seed();

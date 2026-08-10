import request from 'supertest';
import app from '../src/app';
import { User } from '../src/models/index';

describe('Stock API', () => {
  let adminToken = '';
  let productId = '';

  beforeAll(async () => {
    const bcrypt = require('bcrypt');
    await User.create({
      name: 'Admin For Stock',
      email: 'admin_stock@test.com',
      password_hash: await bcrypt.hash('password123', 10),
      role: 'Admin'
    });
    const resAuth = await request(app).post('/api/auth/login').send({
      email: 'admin_stock@test.com',
      password: 'password123'
    });
    adminToken = resAuth.body.data.accessToken;

    const resProd = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sku: 'STK100',
        name: 'Stock Product',
        unit_price: 100,
        current_stock: 50,
        min_stock_alert: 10
      });
    productId = resProd.body.data.id;
  });

  it('should record a Stock IN movement and update product stock', async () => {
    const res = await request(app)
      .post('/api/stock/movements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        product_id: productId,
        movement_type: 'IN',
        quantity: 20,
        reason: 'New batch received'
      });
    
    expect(res.status).toBe(201);
    expect(res.body.data.quantity_changed).toBe(20);

    // Verify product stock was updated
    const resProd = await request(app)
      .get(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(resProd.body.data.current_stock).toBe(70);
  });

  it('should record a Stock OUT movement and update product stock', async () => {
    const res = await request(app)
      .post('/api/stock/movements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        product_id: productId,
        movement_type: 'OUT',
        quantity: 10,
        reason: 'Damaged goods'
      });
    
    expect(res.status).toBe(201);
    expect(res.body.data.quantity_changed).toBe(10);

    // Verify product stock was updated
    const resProd = await request(app)
      .get(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(resProd.body.data.current_stock).toBe(60);
  });

  it('should fail Stock OUT if quantity exceeds current stock', async () => {
    const res = await request(app)
      .post('/api/stock/movements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        product_id: productId,
        movement_type: 'OUT',
        quantity: 1000,
        reason: 'Trying to take too much'
      });
    
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Insufficient stock');
  });

  it('should list stock movements', async () => {
    const res = await request(app)
      .get('/api/stock/movements')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});

import request from 'supertest';
import app from '../src/app';
import { User } from '../src/models/index';

describe('Products API', () => {
  let adminToken = '';
  let productId = '';

  beforeAll(async () => {
    const bcrypt = require('bcrypt');
    await User.create({
      name: 'Admin For Products',
      email: 'admin_products@test.com',
      password_hash: await bcrypt.hash('password123', 10),
      role: 'Admin'
    });
    const resAuth = await request(app).post('/api/auth/login').send({
      email: 'admin_products@test.com',
      password: 'password123'
    });
    adminToken = resAuth.body.data.accessToken;
  });

  it('should create a new product', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sku: 'SKU12345',
        name: 'Test Product',
        unit_price: 100,
        current_stock: 50,
        min_stock_alert: 10
      });
    
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Test Product');
    productId = res.body.data.id;
  });

  it('should not create product with duplicate sku', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sku: 'SKU12345',
        name: 'Duplicate Product',
        unit_price: 150,
        current_stock: 5,
        min_stock_alert: 10
      });
    
    expect(res.status).toBe(409);
  });

  it('should list products', async () => {
    const res = await request(app)
      .get('/api/products')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('should get a product by id', async () => {
    const res = await request(app)
      .get(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(productId);
  });

  it('should update a product', async () => {
    const res = await request(app)
      .patch(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Updated Product' });
    
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Updated Product');
  });

  it('should delete a product', async () => {
    const res = await request(app)
      .delete(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
  });
});

import request from 'supertest';
import app from '../src/app';
import { User, Customer } from '../src/models/index';

describe('Customers API', () => {
  let adminToken = '';
  let customerId = '';

  beforeAll(async () => {
    // Register an admin to get token
    const bcrypt = require('bcrypt');
    await User.create({
      name: 'Admin For Customers',
      email: 'admin_customers@test.com',
      password_hash: await bcrypt.hash('password123', 10),
      role: 'Admin'
    });
    const resAuth = await request(app).post('/api/auth/login').send({
      email: 'admin_customers@test.com',
      password: 'password123'
    });
    adminToken = resAuth.body.data.accessToken;
  });

  it('should create a new customer', async () => {
    const res = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'John Doe',
        mobile: '9876543210',
        customer_type: 'Retail',
        status: 'Active',
        address: '123 Main St'
      });
    
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('John Doe');
    customerId = res.body.data.id;
  });

  it('should list customers', async () => {
    const res = await request(app)
      .get('/api/customers')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('should get a customer by id', async () => {
    const res = await request(app)
      .get(`/api/customers/${customerId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(customerId);
  });

  it('should update a customer', async () => {
    const res = await request(app)
      .patch(`/api/customers/${customerId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Jane Doe' });
    
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Jane Doe');
  });

  it('should delete a customer', async () => {
    const res = await request(app)
      .delete(`/api/customers/${customerId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
  });
});

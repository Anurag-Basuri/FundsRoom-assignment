import request from 'supertest';
import app from '../src/app';
import { User } from '../src/models/index';

describe('Challans API', () => {
  let adminToken = '';
  let customerId = '';
  let productId = '';
  let challanId = '';

  beforeAll(async () => {
    const bcrypt = require('bcrypt');
    await User.create({
      name: 'Admin For Challans',
      email: 'admin_challans@test.com',
      password_hash: await bcrypt.hash('password123', 10),
      role: 'Admin'
    });
    const resAuth = await request(app).post('/api/auth/login').send({
      email: 'admin_challans@test.com',
      password: 'password123'
    });
    adminToken = resAuth.body.data.accessToken;

    const resCust = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Challan Customer',
        mobile: '1231231234',
        customer_type: 'Retail',
        status: 'Active',
        address: 'Challan St'
      });
    customerId = resCust.body.data.id;

    const resProd = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sku: 'CHAL100',
        name: 'Challan Product',
        unit_price: 200,
        current_stock: 50,
        min_stock_alert: 10
      });
    productId = resProd.body.data.id;
  });

  it('should create a draft challan', async () => {
    const res = await request(app)
      .post('/api/challans')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        customer_id: customerId,
        items: [
          {
            product_id: productId,
            quantity: 5
          }
        ]
      });
    
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('Draft');
    expect(res.body.data.total_amount).toBe(1000); // 5 * 200
    challanId = res.body.data.id;
  });

  it('should list challans', async () => {
    const res = await request(app)
      .get('/api/challans')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('should get challan by id', async () => {
    const res = await request(app)
      .get(`/api/challans/${challanId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(challanId);
    expect(res.body.data.items.length).toBe(1);
  });

  it('should fail to confirm challan if stock is insufficient', async () => {
    // Create a new challan with quantity > stock
    const resDraft = await request(app)
      .post('/api/challans')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        customer_id: customerId,
        items: [{ product_id: productId, quantity: 100 }]
      });
    
    const resConfirm = await request(app)
      .patch(`/api/challans/${resDraft.body.data.id}/confirm`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(resConfirm.status).toBe(400);
    expect(resConfirm.body.message).toContain('Insufficient stock');
  });

  it('should confirm challan and deduct stock', async () => {
    const res = await request(app)
      .patch(`/api/challans/${challanId}/confirm`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('Confirmed');

    // Verify stock is deducted
    const resProd = await request(app)
      .get(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(resProd.body.data.current_stock).toBe(45); // 50 - 5
  });

  it('should generate PDF invoice for confirmed challan', async () => {
    const res = await request(app)
      .get(`/api/challans/${challanId}/invoice`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
    expect(res.header['content-type']).toBe('application/pdf');
  });
});

import request from 'supertest';
import app from '../src/app';
import { User } from '../src/models/index';
import bcrypt from 'bcrypt';

describe('Auth API', () => {
  const testUser = {
    name: 'Test Admin',
    email: 'admin_test@test.com',
    password: 'password123',
    role: 'Admin'
  };

  let accessToken = '';

  beforeAll(async () => {
    // Clear users before auth tests
    await User.destroy({ where: {}, force: true });
    
    // Create an initial admin to test login
    await User.create({
      name: testUser.name,
      email: testUser.email,
      password_hash: await bcrypt.hash(testUser.password, 10),
      role: testUser.role as any
    });
  });

  it('should login successfully', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });
    
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    accessToken = res.body.data.accessToken;
  });

  it('should fail login with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'wrongpassword'
      });
    
    expect(res.status).toBe(401);
  });

  it('should get current user profile', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(testUser.email);
  });

  it('should fail to get profile without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('should allow admin to create a new user', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'New User',
        email: 'newuser@test.com',
        password: 'password123',
        role: 'Sales'
      });
    
    expect(res.status).toBe(201);
    expect(res.body.data.email).toBe('newuser@test.com');
  });

  it('should not allow creating user with existing email', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'New User',
        email: testUser.email, // already exists
        password: 'password123',
        role: 'Sales'
      });
    
    expect(res.status).toBe(409); // Conflict
  });
});

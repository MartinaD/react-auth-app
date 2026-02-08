import { describe, it, expect, beforeAll, afterEach, afterAll } from '@jest/globals';
import request from 'supertest';
import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase, dbRun, dbGet, closeDatabase, dbAll } from '../../database.js';
import authRoutes from '../../routes/auth.js';

dotenv.config();

describe('Auth Integration Tests', () => {
  let app: Express;

  beforeAll(async () => {
    // Set test database path with unique name to avoid conflicts
    const testDbDir = '/tmp';
    process.env.DATABASE_DIR = testDbDir;
    process.env.JWT_SECRET = 'test-secret-key';
    process.env.NODE_ENV = 'test';
    
    // Initialize database
    await initDatabase();
    
    // Create Express app for testing
    app = express();
    app.use(cors());
    app.use(express.json());
    app.use('/api/auth', authRoutes);
  });

  afterEach(async () => {
    // Clean up test data after each test
    try {
     await dbRun('DELETE FROM users');
    } catch (error) {
      // Ignore errors if table doesn't exist
    }
  });

  afterAll(async () => {
    // Close database connection after all tests
    try {
      await closeDatabase();
    } catch (error) {
      // Ignore errors during cleanup
      console.warn('Error closing database:', error);
    }
  });

  describe('Complete Authentication Flow', () => {
    it('should complete full registration and login flow', async () => {
      const userData = {
        name: 'Integration Test User',
        email: 'integration@example.com',
        password: 'password123'
      };

      // Step 1: Register user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body).toHaveProperty('token');
      expect(registerResponse.body.user.email).toBe(userData.email);
      const registerToken = registerResponse.body.token;

      // Verify user was saved to database
      const savedUser = await dbGet('SELECT * FROM users WHERE email = ?', [userData.email]);
      expect(savedUser).toBeDefined();
      expect(savedUser?.email).toBe(userData.email);

      // Step 2: Login with registered credentials
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('token');
      expect(loginResponse.body.user.email).toBe(userData.email);
      const loginToken = loginResponse.body.token;

      // Tokens should be different but both valid
      expect(registerToken).toBeDefined();
      expect(loginToken).toBeDefined();
      expect(typeof registerToken).toBe('string');
      expect(typeof loginToken).toBe('string');
    });

    it('should handle multiple user registrations', async () => {
      const users = [
        { name: 'User 1', email: 'user1@example.com', password: 'password123' },
        { name: 'User 2', email: 'user2@example.com', password: 'password456' },
        { name: 'User 3', email: 'user3@example.com', password: 'password789' }
      ];

      await Promise.all([
        request(app)
          .post('/api/auth/register')
          .send(users[0])
          .expect(201),
          request(app)
          .post('/api/auth/register')
          .send(users[1])
          .expect(201),
          request(app)
          .post('/api/auth/register')
          .send(users[2])
          .expect(201)
      ])

      // Verify all users were inserted
      const allUsers = await dbAll('SELECT * FROM users');
      expect(allUsers.length).toBe(users.length);

      // Verify all users can login - test each user individually
      for (const user of users) {
        // Double-check user exists before login
        const userExists = await dbGet('SELECT * FROM users WHERE email = ?', [user.email]);
        expect(userExists).toBeDefined();

        const loginResponse = await request(app)
          .post('/api/auth/login')
          .send({
            email: user.email,
            password: user.password
          })
          .expect(200);

        expect(loginResponse.body.user.email).toBe(user.email);
        expect(loginResponse.body.user.name).toBe(user.name);
        expect(loginResponse.body).toHaveProperty('token');
      }
    });

    it('should prevent duplicate email registration', async () => {
      const userData = {
        name: 'Test User',
        email: 'duplicate@example.com',
        password: 'password123'
      };

      // First registration should succeed
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Second registration with same email should fail
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toContain('already exists');
    });
  });
});



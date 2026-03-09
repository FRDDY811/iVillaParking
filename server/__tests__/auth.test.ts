import request from 'supertest'
import app from '../src/app'
import prisma from '../src/config/database'
import { hashPassword } from '../src/utils/password'

beforeAll(async () => {
  const password = await hashPassword('admin123')
  await prisma.user.upsert({
    where: { email: 'test-admin@test.com' },
    update: {},
    create: {
      email: 'test-admin@test.com',
      password,
      firstName: 'Test',
      lastName: 'Admin',
      apartment: 'ADMIN',
      role: 'ADMIN',
      status: 'ACTIVE'
    }
  })
})

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { contains: 'test' } } })
  await prisma.$disconnect()
})

describe('Auth Endpoints', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user with PENDING status', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'test-new@test.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        apartment: '1A'
      })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.status).toBe('PENDING')
      expect(res.body.data.role).toBe('RESIDENT')
    })

    it('should reject when the email already exists', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'test-admin@test.com',
        password: 'password123',
        firstName: 'Dup',
        lastName: 'User',
        apartment: '2A'
      })

      expect(res.status).toBe(409)
    })

    it('should validate the input', async () => {
      const res = await request(app).post('/api/auth/register').send({ email: 'invalid' })

      expect(res.status).toBe(400)
    })

    it('should allow re-registration for a previously rejected email', async () => {
      const email = 'test-rejected@test.com'
      const apartment = '99Z'

      await request(app).post('/api/auth/register').send({
        email,
        password: 'password123',
        firstName: 'Rejected',
        lastName: 'User',
        apartment
      })

      await prisma.user.update({
        where: { email },
        data: { status: 'REJECTED' }
      })

      const res = await request(app).post('/api/auth/register').send({
        email,
        password: 'newpassword123',
        firstName: 'Reregistered',
        lastName: 'User',
        apartment
      })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.status).toBe('PENDING')
      expect(res.body.data.firstName).toBe('Reregistered')
    })

    it('should allow re-registration for a previously rejected apartment', async () => {
      const email = 'test-rejected-apt@test.com'
      const apartment = '88Y'

      await request(app).post('/api/auth/register').send({
        email,
        password: 'password123',
        firstName: 'Rejected',
        lastName: 'AptUser',
        apartment
      })

      await prisma.user.update({
        where: { email },
        data: { status: 'REJECTED' }
      })

      const res = await request(app).post('/api/auth/register').send({
        email: 'test-new-apt@test.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'AptUser',
        apartment
      })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.apartment).toBe(apartment)
    })

    it('should still reject duplicate email if the user is not rejected', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'test-admin@test.com',
        password: 'password123',
        firstName: 'Dup',
        lastName: 'User',
        apartment: '77X'
      })

      expect(res.status).toBe(409)
    })
  })

  describe('POST /api/auth/login', () => {
    it('should login active user and return token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test-admin@test.com', password: 'admin123' })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.accessToken).toBeDefined()
      expect(res.body.data.user.email).toBe('test-admin@test.com')
    })

    it('should reject when a wrong password is added', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test-admin@test.com', password: 'wrong' })

      expect(res.status).toBe(401)
    })

    it('should reject  when the user is pending', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test-new@test.com', password: 'password123' })

      expect(res.status).toBe(403)
    })
  })

  describe('GET /api/auth/me', () => {
    it('should return a current user with a valid token', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test-admin@test.com', password: 'admin123' })

      const token = loginRes.body.data.accessToken

      const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.data.email).toBe('test-admin@test.com')
    })

    it('should reject without token', async () => {
      const res = await request(app).get('/api/auth/me')
      expect(res.status).toBe(401)
    })
  })
})

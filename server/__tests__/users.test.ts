import request from 'supertest'
import app from '../src/app'
import prisma from '../src/config/database'
import { hashPassword } from '../src/utils/password'

let adminToken: string
let residentToken: string
let pendingUserId: string

beforeAll(async () => {
  const password = await hashPassword('password123')

  await prisma.user.upsert({
    where: { email: 'users-admin@test.com' },
    update: {},
    create: {
      email: 'users-admin@test.com',
      password,
      firstName: 'Users',
      lastName: 'Admin',
      apartment: 'ADMIN',
      role: 'ADMIN',
      status: 'ACTIVE'
    }
  })

  await prisma.user.upsert({
    where: { email: 'users-resident@test.com' },
    update: {},
    create: {
      email: 'users-resident@test.com',
      password,
      firstName: 'Users',
      lastName: 'Resident',
      apartment: '6B',
      role: 'RESIDENT',
      status: 'ACTIVE'
    }
  })

  const pendingUser = await prisma.user.upsert({
    where: { email: 'users-pending@test.com' },
    update: {},
    create: {
      email: 'users-pending@test.com',
      password,
      firstName: 'Pending',
      lastName: 'User',
      apartment: '7C',
      role: 'RESIDENT',
      status: 'PENDING'
    }
  })
  pendingUserId = pendingUser.id

  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'users-admin@test.com', password: 'password123' })
  adminToken = adminLogin.body.data.accessToken

  const residentLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'users-resident@test.com', password: 'password123' })
  residentToken = residentLogin.body.data.accessToken
})

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { contains: 'users-' } } })
  await prisma.$disconnect()
})

describe('User Endpoints', () => {
  it('should list the users in an admin account', async () => {
    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${adminToken}`)

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  it('should reject to the user list for a resident', async () => {
    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${residentToken}`)

    expect(res.status).toBe(403)
  })

  it('should get the pending users', async () => {
    const res = await request(app)
      .get('/api/users/pending')
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.status).toBe(200)
    const pendingEmails = res.body.data.map((user: { email: string }) => user.email)
    expect(pendingEmails).toContain('users-pending@test.com')
  })

  it('should approve a pending user', async () => {
    const res = await request(app)
      .patch(`/api/users/${pendingUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'ACTIVE' })

    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('ACTIVE')
  })

  it('should get the user by ID', async () => {
    const res = await request(app)
      .get(`/api/users/${pendingUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.status).toBe(200)
    expect(res.body.data.id).toBe(pendingUserId)
  })

  it('should reject a user', async () => {
    const res = await request(app)
      .patch(`/api/users/${pendingUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'REJECTED' })

    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('REJECTED')
  })

  it('should delete a user', async () => {
    const res = await request(app)
      .delete(`/api/users/${pendingUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.status).toBe(200)
  })
})

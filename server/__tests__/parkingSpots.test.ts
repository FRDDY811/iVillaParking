import request from 'supertest'
import app from '../src/app'
import prisma from '../src/config/database'
import { hashPassword } from '../src/utils/password'

let adminToken: string
let residentToken: string

beforeAll(async () => {
  const password = await hashPassword('password123')

  await prisma.user.upsert({
    where: { email: 'parking-admin@test.com' },
    update: {},
    create: {
      email: 'parking-admin@test.com',
      password,
      firstName: 'Parking',
      lastName: 'Admin',
      apartment: 'ADMIN',
      role: 'ADMIN',
      status: 'ACTIVE'
    }
  })

  await prisma.user.upsert({
    where: { email: 'parking-resident@test.com' },
    update: {},
    create: {
      email: 'parking-resident@test.com',
      password,
      firstName: 'Parking',
      lastName: 'Resident',
      apartment: '8D',
      role: 'RESIDENT',
      status: 'ACTIVE'
    }
  })

  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'parking-admin@test.com', password: 'password123' })
  adminToken = adminLogin.body.data.accessToken

  const residentLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'parking-resident@test.com', password: 'password123' })
  residentToken = residentLogin.body.data.accessToken
})

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { contains: 'parking-' } } })
  await prisma.$disconnect()
})

describe('Parking Spots Endpoints', () => {
  it('should get the parking config', async () => {
    const res = await request(app)
      .get('/api/parking-spots/config')
      .set('Authorization', `Bearer ${residentToken}`)

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  it('should get all the configs for admin', async () => {
    const res = await request(app)
      .get('/api/parking-spots/config/all')
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  it('should create a parking config for admin', async () => {
    const res = await request(app)
      .post('/api/parking-spots/config')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        vehicleType: 'CAR',
        totalSpots: 20
      })

    expect(res.status).toBe(201)
    expect(res.body.data.vehicleType).toBe('CAR')
    expect(res.body.data.totalSpots).toBe(20)
  })

  it('should reject a creating config for non-admin ', async () => {
    const res = await request(app)
      .post('/api/parking-spots/config')
      .set('Authorization', `Bearer ${residentToken}`)
      .send({
        vehicleType: 'MOTORCYCLE',
        totalSpots: 10
      })

    expect(res.status).toBe(403)
  })

  it('should get the current assignments', async () => {
    const res = await request(app)
      .get('/api/parking-spots/assignments')
      .set('Authorization', `Bearer ${residentToken}`)

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  it('should get the assignment history', async () => {
    const res = await request(app)
      .get('/api/parking-spots/history')
      .set('Authorization', `Bearer ${residentToken}`)

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data)).toBe(true)
  })
})

import request from 'supertest'
import app from '../src/app'
import prisma from '../src/config/database'
import { hashPassword } from '../src/utils/password'

let adminToken: string
let residentToken: string
let residentId: string
let vehicleId: string

beforeAll(async () => {
  const password = await hashPassword('password123')

  await prisma.user.upsert({
    where: { email: 'vehicle-admin@test.com' },
    update: {},
    create: {
      email: 'vehicle-admin@test.com',
      password,
      firstName: 'Vehicle',
      lastName: 'Admin',
      apartment: 'ADMIN',
      role: 'ADMIN',
      status: 'ACTIVE'
    }
  })

  const resident = await prisma.user.upsert({
    where: { email: 'vehicle-resident@test.com' },
    update: {},
    create: {
      email: 'vehicle-resident@test.com',
      password,
      firstName: 'Vehicle',
      lastName: 'Resident',
      apartment: '5A',
      role: 'RESIDENT',
      status: 'ACTIVE'
    }
  })
  residentId = resident.id

  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'vehicle-admin@test.com', password: 'password123' })
  adminToken = adminLogin.body.data.accessToken

  const residentLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'vehicle-resident@test.com', password: 'password123' })
  residentToken = residentLogin.body.data.accessToken
})

afterAll(async () => {
  await prisma.vehicle.deleteMany({ where: { userId: residentId } })
  await prisma.user.deleteMany({ where: { email: { contains: 'vehicle-' } } })
  await prisma.$disconnect()
})

describe('Vehicle Endpoints', () => {
  it('should create a vehicle', async () => {
    const res = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${residentToken}`)
      .send({
        licensePlate: 'VEH-TEST-001',
        type: 'CAR',
        make: 'Honda',
        model: 'Civic',
        color: 'White'
      })

    expect(res.status).toBe(201)
    expect(res.body.data.licensePlate).toBe('VEH-TEST-001')
    vehicleId = res.body.data.id
  })

  it('should reject a duplicate license plate', async () => {
    const res = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${residentToken}`)
      .send({
        licensePlate: 'VEH-TEST-001',
        type: 'CAR',
        make: 'Toyota',
        model: 'Corolla',
        color: 'Blue'
      })

    expect(res.status).toBe(409)
  })

  it('should show the own vehicles', async () => {
    const res = await request(app)
      .get('/api/vehicles')
      .set('Authorization', `Bearer ${residentToken}`)

    expect(res.status).toBe(200)
    expect(res.body.data.length).toBeGreaterThanOrEqual(1)
  })

  it('should get a vehicle by ID', async () => {
    const res = await request(app)
      .get(`/api/vehicles/${vehicleId}`)
      .set('Authorization', `Bearer ${residentToken}`)

    expect(res.status).toBe(200)
    expect(res.body.data.id).toBe(vehicleId)
  })

  it('should update a vehicle', async () => {
    const res = await request(app)
      .put(`/api/vehicles/${vehicleId}`)
      .set('Authorization', `Bearer ${residentToken}`)
      .send({ color: 'Red' })

    expect(res.status).toBe(200)
    expect(res.body.data.color).toBe('Red')
  })

  it('should reject an unauthenticated request', async () => {
    const res = await request(app).get('/api/vehicles')
    expect(res.status).toBe(401)
  })

  it('should allow to an admin to list all vehicles', async () => {
    const res = await request(app).get('/api/vehicles').set('Authorization', `Bearer ${adminToken}`)

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  it('should search the vehicles by plate', async () => {
    const res = await request(app)
      .get('/api/vehicles/search?q=VEH-TEST')
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.status).toBe(200)
    expect(res.body.data.length).toBeGreaterThanOrEqual(1)
  })

  it('should delete a vehicle', async () => {
    const res = await request(app)
      .delete(`/api/vehicles/${vehicleId}`)
      .set('Authorization', `Bearer ${residentToken}`)

    expect(res.status).toBe(200)
  })
})

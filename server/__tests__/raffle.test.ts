import request from 'supertest'
import app from '../src/app'
import prisma from '../src/config/database'
import { hashPassword } from '../src/utils/password'

let adminToken: string
let residentToken: string
let residentId: string
let vehicleId: string
let cycleId: string

beforeAll(async () => {
  const password = await hashPassword('password123')
  await prisma.user.upsert({
    where: { email: 'raffle-admin@test.com' },
    update: {},
    create: {
      email: 'raffle-admin@test.com',
      password,
      firstName: 'Raffle',
      lastName: 'Admin',
      apartment: 'ADMIN',
      role: 'ADMIN',
      status: 'ACTIVE'
    }
  })

  const resident = await prisma.user.upsert({
    where: { email: 'raffle-resident@test.com' },
    update: {},
    create: {
      email: 'raffle-resident@test.com',
      password,
      firstName: 'Raffle',
      lastName: 'Resident',
      apartment: '10B',
      role: 'RESIDENT',
      status: 'ACTIVE'
    }
  })
  residentId = resident.id

  const vehicle = await prisma.vehicle.create({
    data: {
      licensePlate: 'TEST-RAFFLE-001',
      type: 'CAR',
      make: 'Test',
      model: 'Car',
      color: 'Blue',
      userId: resident.id
    }
  })
  vehicleId = vehicle.id

  const configCount = await prisma.parkingSpotConfig.count()
  if (configCount === 0) {
    await prisma.parkingSpotConfig.createMany({
      data: [
        { vehicleType: 'CAR', totalSpots: 10 },
        { vehicleType: 'MOTORCYCLE', totalSpots: 5 },
        { vehicleType: 'BICYCLE', totalSpots: 3 }
      ]
    })
  }

  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'raffle-admin@test.com', password: 'password123' })
  adminToken = adminLogin.body.data.accessToken

  const residentLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'raffle-resident@test.com', password: 'password123' })
  residentToken = residentLogin.body.data.accessToken
})

afterAll(async () => {
  await prisma.parkingAssignment.deleteMany({ where: { raffleCycleId: cycleId } })
  await prisma.raffleRegistration.deleteMany({ where: { raffleCycleId: cycleId } })
  if (cycleId) await prisma.raffleCycle.deleteMany({ where: { id: cycleId } })
  await prisma.vehicle.deleteMany({ where: { licensePlate: 'TEST-RAFFLE-001' } })
  await prisma.user.deleteMany({ where: { email: { contains: 'raffle' } } })
  await prisma.$disconnect()
})

describe('Raffle Endpoints', () => {
  it('should create a raffle cycle for admin', async () => {
    const res = await request(app)
      .post('/api/raffle/cycles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Test Q1 2026',
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-03-31T00:00:00.000Z'
      })

    expect(res.status).toBe(201)
    expect(res.body.data.name).toBe('Test Q1 2026')
    expect(res.body.data.status).toBe('PENDING')
    cycleId = res.body.data.id
  })

  it('should not allow resident to create cycle', async () => {
    const res = await request(app)
      .post('/api/raffle/cycles')
      .set('Authorization', `Bearer ${residentToken}`)
      .send({
        name: 'Unauthorized',
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-03-31T00:00:00.000Z'
      })

    expect(res.status).toBe(403)
  })

  it('should open the cycle', async () => {
    const res = await request(app)
      .patch(`/api/raffle/cycles/${cycleId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'OPEN' })

    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('OPEN')
  })

  it('should register for a raffle', async () => {
    const res = await request(app)
      .post(`/api/raffle/cycles/${cycleId}/register`)
      .set('Authorization', `Bearer ${residentToken}`)
      .send({ vehicleId })

    expect(res.status).toBe(201)
  })

  it('should not allow a duplicate registration', async () => {
    const res = await request(app)
      .post(`/api/raffle/cycles/${cycleId}/register`)
      .set('Authorization', `Bearer ${residentToken}`)
      .send({ vehicleId })

    expect(res.status).toBe(409)
  })

  it('should close the cycle', async () => {
    const res = await request(app)
      .patch(`/api/raffle/cycles/${cycleId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'CLOSED' })

    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('CLOSED')
  })

  it('should execute the raffle', async () => {
    const res = await request(app)
      .post(`/api/raffle/cycles/${cycleId}/execute`)
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('COMPLETED')
    expect(res.body.data.parkingAssignments.length).toBeGreaterThan(0)
  })

  it('should return results with tier 1 for first-time resident', async () => {
    const res = await request(app)
      .get(`/api/raffle/cycles/${cycleId}/results`)
      .set('Authorization', `Bearer ${residentToken}`)

    expect(res.status).toBe(200)
    const assignment = res.body.data.find((item: { userId: string }) => item.userId === residentId)
    expect(assignment).toBeDefined()
    expect(assignment.tier).toBe(1)
  })

  it('should list the cycles', async () => {
    const res = await request(app)
      .get('/api/raffle/cycles')
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.status).toBe(200)
    expect(res.body.data.length).toBeGreaterThan(0)
  })
})

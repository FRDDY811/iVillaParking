import prisma from '../config/database'
import { AppError } from '../middleware/errorHandler'
import { USER_SELECT, USER_SELECT_BRIEF, normalizePlate } from '../utils/prismaSelects'

interface UpdateVehicleData {
  licensePlate?: string
  type?: string
  make?: string
  model?: string
  color?: string
}

/**
 * Vehicle CRUD with ownership enforcement.
 * Residents can only modify their own vehicles; admins bypass ownership checks.
 * License plates are normalized to uppercase and must be globally unique.
 *
 * @todo (scalability): Audit logging — record vehicle registration/deletion for compliance.
 */
export class VehicleService {
  async getAll(userId?: string) {
    const where = userId ? { userId } : {}
    return prisma.vehicle.findMany({
      where,
      include: {
        user: { select: USER_SELECT }
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  async getById(id: string) {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        user: { select: USER_SELECT }
      }
    })

    if (!vehicle) {
      throw new AppError('Vehicle not found', 404)
    }

    return vehicle
  }

  async create(
    userId: string,
    data: { licensePlate: string; type: string; make: string; model: string; color: string }
  ) {
    data.licensePlate = normalizePlate(data.licensePlate)
    const existing = await prisma.vehicle.findUnique({
      where: { licensePlate: data.licensePlate }
    })
    if (existing) {
      throw new AppError('License plate already registered', 409)
    }

    return prisma.vehicle.create({
      data: { ...data, userId },
      include: { user: { select: USER_SELECT_BRIEF } }
    })
  }

  async update(id: string, userId: string, data: UpdateVehicleData, isAdmin: boolean) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id } })
    if (!vehicle) {
      throw new AppError('Vehicle not found', 404)
    }

    if (!isAdmin && vehicle.userId !== userId) {
      throw new AppError('Not authorized to update this vehicle', 403)
    }

    if (data.licensePlate) {
      data.licensePlate = normalizePlate(data.licensePlate)
      const existing = await prisma.vehicle.findFirst({
        where: { licensePlate: data.licensePlate, id: { not: id } }
      })
      if (existing) {
        throw new AppError('License plate already registered', 409)
      }
    }

    return prisma.vehicle.update({
      where: { id },
      data,
      include: { user: { select: USER_SELECT_BRIEF } }
    })
  }

  async delete(id: string, userId: string, isAdmin: boolean) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id } })
    if (!vehicle) {
      throw new AppError('Vehicle not found', 404)
    }

    if (!isAdmin && vehicle.userId !== userId) {
      throw new AppError('Not authorized to delete this vehicle', 403)
    }

    await prisma.vehicle.delete({ where: { id } })
  }

  async searchByPlate(query: string) {
    query = normalizePlate(query)
    return prisma.vehicle.findMany({
      where: { licensePlate: { contains: query } },
      include: {
        user: { select: USER_SELECT }
      }
    })
  }
}

export const vehicleService = new VehicleService()

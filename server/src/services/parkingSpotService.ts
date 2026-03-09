import prisma from '../config/database'
import { cache, CACHE_KEYS, invalidateCache } from '../config/cache'
import { USER_SELECT, USER_SELECT_BRIEF } from '../utils/prismaSelects'

/**
 * Manages parking spot capacity configuration and assignment queries.
 * Configurations are versioned: each new config supersedes older ones via effectiveFrom date.
 * Results are cached in-memory (NodeCache) for 5 minutes.
 *
 * @todo (scalability): Advanced caching — replace NodeCache with Redis for multi-instance deployments.
 * @todo (scalability):  Pagination — getAssignmentHistory returns all records; add cursor-based pagination for scale.
 */
export class ParkingSpotService {
  async getConfig() {
    const cached = cache.get(CACHE_KEYS.PARKING_CONFIG)
    if (cached) return cached

    const configs = await prisma.parkingSpotConfig.findMany({
      orderBy: { effectiveFrom: 'desc' }
    })

    const latestByType = new Map<string, (typeof configs)[0]>()
    for (const config of configs) {
      if (!latestByType.has(config.vehicleType)) {
        latestByType.set(config.vehicleType, config)
      }
    }

    const result = Array.from(latestByType.values())
    cache.set(CACHE_KEYS.PARKING_CONFIG, result)
    return result
  }

  async getAllConfigs() {
    return prisma.parkingSpotConfig.findMany({
      orderBy: [{ vehicleType: 'asc' }, { effectiveFrom: 'desc' }]
    })
  }

  async createConfig(data: { vehicleType: string; totalSpots: number; effectiveFrom?: string }) {
    const config = await prisma.parkingSpotConfig.create({
      data: {
        vehicleType: data.vehicleType,
        totalSpots: data.totalSpots,
        effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : new Date()
      }
    })

    invalidateCache(CACHE_KEYS.PARKING_CONFIG)
    return config
  }

  async getCurrentAssignments() {
    const cached = cache.get(CACHE_KEYS.CURRENT_ASSIGNMENTS)
    if (cached) return cached

    const latestCycle = await prisma.raffleCycle.findFirst({
      where: { status: 'COMPLETED' },
      orderBy: { executedAt: 'desc' }
    })

    if (!latestCycle) return []

    const assignments = await prisma.parkingAssignment.findMany({
      where: { raffleCycleId: latestCycle.id },
      include: {
        user: { select: USER_SELECT },
        vehicle: true,
        raffleCycle: { select: { id: true, name: true, startDate: true, endDate: true } }
      },
      orderBy: [{ vehicleType: 'asc' }, { spotNumber: 'asc' }]
    })

    cache.set(CACHE_KEYS.CURRENT_ASSIGNMENTS, assignments)
    return assignments
  }

  async getAssignmentHistory(userId?: string) {
    const where = userId ? { userId } : {}
    return prisma.parkingAssignment.findMany({
      where,
      include: {
        user: { select: USER_SELECT_BRIEF },
        vehicle: true,
        raffleCycle: { select: { id: true, name: true, startDate: true, endDate: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
  }
}

export const parkingSpotService = new ParkingSpotService()

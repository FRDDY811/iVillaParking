import prisma from '../config/database'
import { AppError } from '../middleware/errorHandler'
import { invalidateCache, CACHE_KEYS } from '../config/cache'
import logger from '../utils/logger'
import { USER_SELECT, USER_SELECT_BRIEF } from '../utils/prismaSelects'
import { RAFFLE_STATUS_TRANSITIONS } from '@ivillaparking/shared'

/**
 * Unbiased in-place shuffle using the Fisher-Yates algorithm (O(n)).
 * Each permutation has equal probability, ensuring fairness in the raffle.
 *
 * @todo (scalability): Replace Math.random() with crypto.getRandomValues() for cryptographically fair shuffle.
 */
function fisherYatesShuffle<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Manages the complete raffle lifecycle: cycle CRUD, resident registration,
 * and parking spot allocation via a tiered fairness algorithm.
 *
 * Cycle state machine: PENDING -> OPEN -> CLOSED -> EXECUTING -> COMPLETED
 * - PENDING: created but not yet accepting registrations.
 * - OPEN: residents can register/unregister vehicles.
 * - CLOSED: registrations locked, ready for execution.
 * - EXECUTING: transient state during raffle algorithm (prevents double-execute).
 * - COMPLETED: spots assigned, results available.
 *
 * @todo (scalability): Audit logging —  record who triggered each status transition and execution.
 * @todo (scalability): Email notifications — notify winners and non-winners after execution.
 * @todo (scalability): WebSocket — broadcast raffle results in real-time to connected clients.
 */
export class RaffleService {
  async getCycles(params?: { status?: string }) {
    const where = params?.status ? { status: params.status } : {}
    return prisma.raffleCycle.findMany({
      where,
      include: { _count: { select: { registrations: true, parkingAssignments: true } } },
      orderBy: { createdAt: 'desc' }
    })
  }

  async getCycleById(id: string) {
    const cycle = await prisma.raffleCycle.findUnique({
      where: { id },
      include: {
        registrations: {
          include: {
            user: { select: USER_SELECT },
            vehicle: true
          }
        },
        parkingAssignments: {
          include: {
            user: { select: USER_SELECT },
            vehicle: true
          },
          orderBy: [{ vehicleType: 'asc' }, { tier: 'asc' }, { spotNumber: 'asc' }]
        },
        _count: { select: { registrations: true, parkingAssignments: true } }
      }
    })

    if (!cycle) {
      throw new AppError('Raffle cycle not found', 404)
    }

    return cycle
  }

  async createCycle(data: { name: string; startDate: string; endDate: string }) {
    return prisma.raffleCycle.create({
      data: {
        name: data.name,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate)
      }
    })
  }

  async updateCycle(id: string, data: { status?: string; name?: string }) {
    const cycle = await prisma.raffleCycle.findUnique({ where: { id } })
    if (!cycle) {
      throw new AppError('Raffle cycle not found', 404)
    }

    if (data.status) {
      if (!RAFFLE_STATUS_TRANSITIONS[cycle.status]?.includes(data.status)) {
        throw new AppError(`Cannot transition from ${cycle.status} to ${data.status}`, 400)
      }
    }

    return prisma.raffleCycle.update({
      where: { id },
      data
    })
  }

  async register(userId: string, vehicleId: string, cycleId: string) {
    const cycle = await prisma.raffleCycle.findUnique({ where: { id: cycleId } })
    if (!cycle) {
      throw new AppError('Raffle cycle not found', 404)
    }

    if (cycle.status !== 'OPEN') {
      throw new AppError('Raffle cycle is not open for registration', 400)
    }

    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } })
    if (!vehicle) {
      throw new AppError('Vehicle not found', 404)
    }

    if (vehicle.userId !== userId) {
      throw new AppError('Vehicle does not belong to you', 403)
    }

    const existing = await prisma.raffleRegistration.findUnique({
      where: { userId_vehicleId_raffleCycleId: { userId, vehicleId, raffleCycleId: cycleId } }
    })

    if (existing) {
      throw new AppError('Already registered for this cycle with this vehicle', 409)
    }

    return prisma.raffleRegistration.create({
      data: { userId, vehicleId, raffleCycleId: cycleId },
      include: {
        user: { select: USER_SELECT_BRIEF },
        vehicle: true
      }
    })
  }

  async unregister(userId: string, vehicleId: string, cycleId: string) {
    const cycle = await prisma.raffleCycle.findUnique({ where: { id: cycleId } })
    if (!cycle || cycle.status !== 'OPEN') {
      throw new AppError('Cannot unregister: cycle is not open', 400)
    }

    const registration = await prisma.raffleRegistration.findUnique({
      where: { userId_vehicleId_raffleCycleId: { userId, vehicleId, raffleCycleId: cycleId } }
    })

    if (!registration) {
      throw new AppError('Registration not found', 404)
    }

    await prisma.raffleRegistration.delete({ where: { id: registration.id } })
  }

  /**
   * Builds tiering data: which users were ever assigned and which were assigned last cycle.
   */
  private async buildTieringData(cycleId: string) {
    const allPreviousAssignments = await prisma.parkingAssignment.findMany({
      where: { raffleCycleId: { not: cycleId } }
    })

    const lastCycle = await prisma.raffleCycle.findFirst({
      where: { status: 'COMPLETED', id: { not: cycleId } },
      orderBy: { executedAt: 'desc' }
    })

    const lastCycleAssignedUserIds = new Set<string>()
    if (lastCycle) {
      const lastAssignments = await prisma.parkingAssignment.findMany({
        where: { raffleCycleId: lastCycle.id }
      })
      for (const assignment of lastAssignments) {
        lastCycleAssignedUserIds.add(assignment.userId)
      }
    }

    const everAssignedUserIds = new Set(allPreviousAssignments.map(assignment => assignment.userId))
    return { everAssignedUserIds, lastCycleAssignedUserIds }
  }

  /**
   * Assigns spots for a single vehicle type using the 3-tier fairness algorithm.
   */
  private assignSpotsForType<T extends { userId: string; vehicleId: string }>(
    registrations: T[],
    totalSpots: number,
    cycleId: string,
    vehicleType: string,
    assignedUserIds: Set<string>,
    everAssigned: Set<string>,
    lastCycleAssigned: Set<string>
  ) {
    const tier1: T[] = []
    const tier2: T[] = []
    const tier3: T[] = []

    for (const reg of registrations) {
      if (!everAssigned.has(reg.userId)) {
        tier1.push(reg)
      } else if (!lastCycleAssigned.has(reg.userId)) {
        tier2.push(reg)
      } else {
        tier3.push(reg)
      }
    }

    const shuffledTier1 = fisherYatesShuffle(tier1)
    const shuffledTier2 = fisherYatesShuffle(tier2)
    const shuffledTier3 = fisherYatesShuffle(tier3)

    const tier1Set = new Set(shuffledTier1)
    const tier2Set = new Set(shuffledTier2)

    const assignments: {
      userId: string
      vehicleId: string
      raffleCycleId: string
      spotNumber: number
      vehicleType: string
      tier: number
    }[] = []

    let spotNumber = 1
    const orderedRegistrations = [...shuffledTier1, ...shuffledTier2, ...shuffledTier3]

    for (const reg of orderedRegistrations) {
      if (spotNumber > totalSpots) break
      if (assignedUserIds.has(reg.userId)) continue

      const tier = tier1Set.has(reg) ? 1 : tier2Set.has(reg) ? 2 : 3
      assignments.push({
        userId: reg.userId,
        vehicleId: reg.vehicleId,
        raffleCycleId: cycleId,
        spotNumber,
        vehicleType,
        tier
      })

      assignedUserIds.add(reg.userId)
      spotNumber++
    }

    return {
      assignments,
      tierCounts: [shuffledTier1.length, shuffledTier2.length, shuffledTier3.length] as const
    }
  }

  /**
   * Executes the raffle algorithm for a CLOSED cycle.
   *
   * 3-tier fairness system (per vehicle type):
   *   Tier 1: residents who have NEVER been assigned a spot (highest priority)
   *   Tier 2: residents assigned before but NOT in the last cycle
   *   Tier 3: residents assigned in the last cycle (lowest priority)
   *
   * Each tier is shuffled independently (Fisher-Yates), then concatenated.
   * One spot maximum per resident across all vehicle types.
   *
   * Uses optimistic locking (CLOSED -> EXECUTING) to prevent concurrent execution.
   * Rolls back to CLOSED on failure.
   */
  async execute(cycleId: string) {
    const claimed = await prisma.raffleCycle.updateMany({
      where: { id: cycleId, status: 'CLOSED' },
      data: { status: 'EXECUTING' }
    })

    if (claimed.count === 0) {
      const cycle = await prisma.raffleCycle.findUnique({ where: { id: cycleId } })
      if (!cycle) throw new AppError('Raffle cycle not found', 404)
      if (cycle.status === 'COMPLETED' || cycle.status === 'EXECUTING') {
        throw new AppError('Raffle cycle has already been executed', 400)
      }
      throw new AppError('Raffle cycle must be CLOSED before execution', 400)
    }

    try {
      const cycle = await prisma.raffleCycle.findUnique({
        where: { id: cycleId },
        include: { registrations: { include: { vehicle: true, user: true } } }
      })

      if (!cycle) {
        throw new AppError('Raffle cycle not found', 404)
      }

      const configs = await prisma.parkingSpotConfig.findMany({
        orderBy: { effectiveFrom: 'desc' }
      })
      const spotsByType = new Map<string, number>()
      for (const config of configs) {
        if (!spotsByType.has(config.vehicleType)) {
          spotsByType.set(config.vehicleType, config.totalSpots)
        }
      }

      const { everAssignedUserIds, lastCycleAssignedUserIds } = await this.buildTieringData(cycleId)

      const registrationsByType = new Map<string, typeof cycle.registrations>()
      for (const reg of cycle.registrations) {
        const type = reg.vehicle.type
        if (!registrationsByType.has(type)) registrationsByType.set(type, [])
        registrationsByType.get(type)!.push(reg)
      }

      const allAssignments: {
        userId: string
        vehicleId: string
        raffleCycleId: string
        spotNumber: number
        vehicleType: string
        tier: number
      }[] = []
      const assignedUserIds = new Set<string>()

      for (const [vehicleType, registrations] of registrationsByType) {
        const totalSpots = spotsByType.get(vehicleType) || 0
        if (totalSpots === 0) continue

        const { assignments, tierCounts } = this.assignSpotsForType(
          registrations,
          totalSpots,
          cycleId,
          vehicleType,
          assignedUserIds,
          everAssignedUserIds,
          lastCycleAssignedUserIds
        )
        allAssignments.push(...assignments)

        logger.info(
          `Raffle ${cycle.name}: ${vehicleType} - ${assignments.length}/${totalSpots} spots assigned ` +
            `(T1: ${tierCounts[0]}, T2: ${tierCounts[1]}, T3: ${tierCounts[2]})`
        )
      }

      await prisma.$transaction([
        prisma.parkingAssignment.createMany({ data: allAssignments }),
        prisma.raffleCycle.update({
          where: { id: cycleId },
          data: { status: 'COMPLETED', executedAt: new Date() }
        })
      ])

      invalidateCache(CACHE_KEYS.CURRENT_ASSIGNMENTS)
      invalidateCache(CACHE_KEYS.DASHBOARD_STATS)

      return this.getCycleById(cycleId)
    } catch (error) {
      await prisma.raffleCycle.update({
        where: { id: cycleId },
        data: { status: 'CLOSED' }
      })
      throw error
    }
  }

  async getResults(cycleId: string) {
    return prisma.parkingAssignment.findMany({
      where: { raffleCycleId: cycleId },
      include: {
        user: { select: USER_SELECT },
        vehicle: true
      },
      orderBy: [{ vehicleType: 'asc' }, { tier: 'asc' }, { spotNumber: 'asc' }]
    })
  }

  async getUserRegistrations(userId: string, cycleId?: string) {
    const where: { userId: string; raffleCycleId?: string } = { userId }
    if (cycleId) where.raffleCycleId = cycleId

    return prisma.raffleRegistration.findMany({
      where,
      include: {
        vehicle: true,
        raffleCycle: true
      },
      orderBy: { createdAt: 'desc' }
    })
  }
}

export const raffleService = new RaffleService()

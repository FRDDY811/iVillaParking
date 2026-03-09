import prisma from '../config/database'
import { USER_SELECT_BRIEF, normalizePlate } from '../utils/prismaSelects'
import { PAGINATION } from '@ivillaparking/shared'

/**
 * Simulated gate camera detection system.
 * Looks up license plates against registered vehicles and determines authorization
 * status: AUTHORIZED (has active parking assignment), DETECTED (registered but no
 * current assignment), or UNKNOWN (not in system).
 *
 * @todo (scalability): Pagination, getDetections is capped at 50; in a future a proper pagination for history can be added.
 */
export class CameraService {
  async detect(licensePlate: string) {
    licensePlate = normalizePlate(licensePlate)
    const vehicle = await prisma.vehicle.findUnique({
      where: { licensePlate },
      include: {
        user: { select: USER_SELECT_BRIEF },
        parkingAssignments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { raffleCycle: { select: { id: true, name: true, endDate: true } } }
        }
      }
    })

    let status = 'UNKNOWN'
    if (vehicle) {
      const currentAssignment = vehicle.parkingAssignments[0]
      if (
        currentAssignment?.raffleCycle &&
        new Date(currentAssignment.raffleCycle.endDate) > new Date()
      ) {
        status = 'AUTHORIZED'
      } else {
        status = 'DETECTED'
      }
    }

    const detection = await prisma.cameraDetection.create({
      data: {
        licensePlate,
        vehicleId: vehicle?.id || null,
        status
      },
      include: {
        vehicle: {
          include: {
            user: { select: USER_SELECT_BRIEF }
          }
        }
      }
    })

    return detection
  }

  async getDetections(params?: { limit?: number; status?: string }) {
    const { limit = PAGINATION.DETECTIONS_LIMIT, status } = params || {}
    const where = status ? { status } : {}

    return prisma.cameraDetection.findMany({
      where,
      include: {
        vehicle: {
          include: {
            user: { select: USER_SELECT_BRIEF }
          }
        }
      },
      orderBy: { detectedAt: 'desc' },
      take: limit
    })
  }
}

export const cameraService = new CameraService()

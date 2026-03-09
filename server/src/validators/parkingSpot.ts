import { z } from 'zod'
import { VEHICLE_TYPES } from '@ivillaparking/shared'

export const createParkingConfigSchema = z.object({
  vehicleType: z.enum(VEHICLE_TYPES as [string, ...string[]]),
  totalSpots: z.number().int().min(0, 'Total spots must be non-negative'),
  effectiveFrom: z.string().datetime().optional()
})

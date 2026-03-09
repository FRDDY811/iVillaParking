import { z } from 'zod'
import { FIELD_LIMITS } from '@ivillaparking/shared'

export const createVehicleSchema = z.object({
  licensePlate: z.string().min(1, 'License plate is required').max(FIELD_LIMITS.LICENSE_PLATE_MAX),
  type: z.enum(['CAR', 'MOTORCYCLE', 'BICYCLE']),
  make: z.string().min(1, 'Make is required').max(FIELD_LIMITS.VEHICLE_MAKE_MAX),
  model: z.string().min(1, 'Model is required').max(FIELD_LIMITS.VEHICLE_MODEL_MAX),
  color: z.string().min(1, 'Color is required').max(FIELD_LIMITS.VEHICLE_COLOR_MAX)
})

export const updateVehicleSchema = createVehicleSchema.partial()

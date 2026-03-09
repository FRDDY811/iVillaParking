import { z } from 'zod'
import { FIELD_LIMITS } from '@ivillaparking/shared'

export const createRaffleCycleSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(FIELD_LIMITS.CYCLE_NAME_MAX),
    startDate: z.string().datetime(),
    endDate: z.string().datetime()
  })
  .refine(data => new Date(data.startDate) < new Date(data.endDate), {
    message: 'Start date must be before end date',
    path: ['endDate']
  })

export const updateRaffleCycleSchema = z.object({
  status: z.enum(['PENDING', 'OPEN', 'CLOSED', 'COMPLETED']).optional(),
  name: z.string().min(1).max(FIELD_LIMITS.CYCLE_NAME_MAX).optional()
})

export const raffleRegistrationSchema = z.object({
  vehicleId: z.string().uuid('Invalid vehicle ID')
})

import { z } from 'zod'
import { FIELD_LIMITS } from '@ivillaparking/shared'

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(FIELD_LIMITS.FIRST_NAME_MAX).optional(),
  lastName: z.string().min(1).max(FIELD_LIMITS.LAST_NAME_MAX).optional(),
  apartment: z.string().min(1).max(FIELD_LIMITS.APARTMENT_MAX).optional(),
  status: z.enum(['ACTIVE', 'REJECTED']).optional(),
  role: z.enum(['ADMIN', 'RESIDENT']).optional()
})

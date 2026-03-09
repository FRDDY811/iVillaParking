import { z } from 'zod'
import { FIELD_LIMITS } from '@ivillaparking/shared'

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(FIELD_LIMITS.PASSWORD_MIN, `Password must be at least ${FIELD_LIMITS.PASSWORD_MIN} characters`),
  firstName: z.string().min(1, 'First name is required').max(FIELD_LIMITS.FIRST_NAME_MAX),
  lastName: z.string().min(1, 'Last name is required').max(FIELD_LIMITS.LAST_NAME_MAX),
  apartment: z.string().min(1, 'Apartment is required').max(FIELD_LIMITS.APARTMENT_MAX)
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
})

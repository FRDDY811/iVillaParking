/** Reusable Prisma select objects and shared utilities for services. */

export function normalizePlate(plate: string): string {
  return plate.toUpperCase().trim()
}

export const USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  apartment: true,
  email: true
} as const

export const USER_SELECT_BRIEF = {
  id: true,
  firstName: true,
  lastName: true,
  apartment: true
} as const

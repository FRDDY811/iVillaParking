export const API_BASE_URL = '/api'

/** Polling intervals (ms) for RTK Query subscriptions */
export const POLLING_INTERVAL_FAST = 15_000 // 15 s – camera detections
export const POLLING_INTERVAL_NORMAL = 30_000 // 30 s – pending approvals

export const VEHICLE_TYPE_LABELS: Record<string, string> = {
  CAR: 'Car',
  MOTORCYCLE: 'Motorcycle',
  BICYCLE: 'Bicycle'
}

export const VEHICLE_TYPE_OPTIONS = Object.entries(VEHICLE_TYPE_LABELS).map(([value, label]) => ({
  value,
  label
}))

export const USER_STATUS_COLORS: Record<string, string> = {
  PENDING: 'orange',
  ACTIVE: 'green',
  REJECTED: 'red'
}

export const RAFFLE_STATUS_COLORS: Record<string, string> = {
  PENDING: 'default',
  OPEN: 'processing',
  CLOSED: 'warning',
  COMPLETED: 'success'
}

export const TIER_LABELS: Record<number, string> = {
  1: 'Never assigned (highest priority)',
  2: 'Not assigned last cycle',
  3: 'Had spot last cycle (lowest priority)'
}

export const TIER_COLORS: Record<number, string> = {
  1: 'green',
  2: 'blue',
  3: 'default'
}

export function getTierColor(tier: number): string {
  return TIER_COLORS[tier] ?? 'default'
}

import { FIELD_LIMITS, PAGINATION } from '@ivillaparking/shared'

export const { DEFAULT_PAGE_SIZE, DETECTIONS_LIMIT } = PAGINATION
export const {
  LICENSE_PLATE_MAX: MAX_LICENSE_PLATE_LENGTH,
  VEHICLE_MAKE_MAX: MAX_VEHICLE_MAKE_LENGTH,
  VEHICLE_MODEL_MAX: MAX_VEHICLE_MODEL_LENGTH,
  VEHICLE_COLOR_MAX: MAX_VEHICLE_COLOR_LENGTH,
  APARTMENT_MAX: MAX_APARTMENT_LENGTH,
  CYCLE_NAME_MAX: MAX_CYCLE_NAME_LENGTH,
  PASSWORD_MIN: MIN_PASSWORD_LENGTH
} = FIELD_LIMITS

export const DETECTION_STATUS_COLORS: Record<string, string> = {
  AUTHORIZED: 'green',
  DETECTED: 'blue',
  UNKNOWN: 'red'
}

/**
 * Form value types for Ant Design forms.
 * Separated from domain interfaces because form libraries introduce
 * UI-specific types (e.g., Dayjs for date ranges) that shouldn't
 * leak into shared domain types.
 */
import type { Dayjs } from 'dayjs'
import { VehicleType, RaffleCycleStatus, UserStatus } from '@ivillaparking/shared'

export interface VehicleFormValues {
  licensePlate: string
  type: VehicleType
  make: string
  model: string
  color: string
}

export interface CycleFormValues {
  name: string
  dates: [Dayjs, Dayjs]
}

export interface CreateCycleRequest {
  name: string
  startDate: string
  endDate: string
}

export interface UpdateCycleRequest {
  status?: RaffleCycleStatus
}

export interface UpdateUserRequest {
  status?: UserStatus
}

export interface ParkingConfigFormValues {
  vehicleType: VehicleType
  totalSpots: number
}

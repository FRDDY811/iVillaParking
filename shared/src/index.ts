/**
 * @ivillaparking/shared — domain types shared between client and server.
 *
 * All enums, entity interfaces, and API response wrappers live here, so both
 * workspaces import from a single source of truth.
 * Changes here propagate and compile errors to all consumers, preventing type drift.
 */
export enum UserRole {
  ADMIN = 'ADMIN',
  RESIDENT = 'RESIDENT'
}

export enum UserStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  REJECTED = 'REJECTED'
}

export enum VehicleType {
  CAR = 'CAR',
  MOTORCYCLE = 'MOTORCYCLE',
  BICYCLE = 'BICYCLE'
}

export const VEHICLE_TYPES = Object.values(VehicleType)

export enum RaffleCycleStatus {
  PENDING = 'PENDING',
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  COMPLETED = 'COMPLETED'
}

export enum CameraDetectionStatus {
  DETECTED = 'DETECTED',
  AUTHORIZED = 'AUTHORIZED',
  UNKNOWN = 'UNKNOWN'
}

export const RAFFLE_STATUS_TRANSITIONS: Record<string, string[]> = {
  [RaffleCycleStatus.PENDING]: [RaffleCycleStatus.OPEN],
  [RaffleCycleStatus.OPEN]: [RaffleCycleStatus.CLOSED],
  [RaffleCycleStatus.CLOSED]: [RaffleCycleStatus.COMPLETED],
  EXECUTING: [],
  [RaffleCycleStatus.COMPLETED]: []
}

/** Validation constraints shared between client forms and server validators */
export const FIELD_LIMITS = {
  LICENSE_PLATE_MAX: 15,
  VEHICLE_MAKE_MAX: 50,
  VEHICLE_MODEL_MAX: 50,
  VEHICLE_COLOR_MAX: 30,
  APARTMENT_MAX: 10,
  CYCLE_NAME_MAX: 100,
  FIRST_NAME_MAX: 50,
  LAST_NAME_MAX: 50,
  PASSWORD_MIN: 6
} as const

/** Pagination defaults */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  DETECTIONS_LIMIT: 50,
  MAX_PAGE_SIZE: 100
} as const

export interface IUser {
  id: string
  email: string
  firstName: string
  lastName: string
  apartment: string
  role: UserRole
  status: UserStatus
  createdAt: string
  updatedAt: string
}

export interface IVehicle {
  id: string
  licensePlate: string
  type: VehicleType
  make: string
  model: string
  color: string
  userId: string
  user?: IUser
  createdAt: string
  updatedAt: string
}

export interface IParkingSpotConfig {
  id: string
  vehicleType: VehicleType
  totalSpots: number
  effectiveFrom: string
  createdAt: string
}

export interface IRaffleCycle {
  id: string
  name: string
  startDate: string
  endDate: string
  status: RaffleCycleStatus
  executedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface IRaffleRegistration {
  id: string
  userId: string
  vehicleId: string
  raffleCycleId: string
  user?: IUser
  vehicle?: IVehicle
  createdAt: string
}

export interface IParkingAssignment {
  id: string
  userId: string
  vehicleId: string
  raffleCycleId: string
  spotNumber: number
  vehicleType: VehicleType
  tier: number
  user?: IUser
  vehicle?: IVehicle
  raffleCycle?: IRaffleCycle
  createdAt: string
}

export interface ICameraDetection {
  id: string
  licensePlate: string
  vehicleId: string | null
  detectedAt: string
  status: CameraDetectionStatus
  vehicle?: IVehicle
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  apartment: string
}

export interface TokenResponse {
  accessToken: string
  user: IUser
}

export interface ImportResult {
  imported: number
  skipped: number
}

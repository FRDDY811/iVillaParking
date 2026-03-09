/**
 * Re-exports shared types and defines client-specific type extensions
 * (intersection types for API responses with joined relations).
 */
export type {
  IUser,
  IVehicle,
  IParkingSpotConfig,
  IRaffleCycle,
  IRaffleRegistration,
  IParkingAssignment,
  ICameraDetection,
  ApiResponse,
  PaginatedResponse,
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  ImportResult
} from '@ivillaparking/shared'

export {
  UserRole,
  UserStatus,
  VehicleType,
  RaffleCycleStatus,
  CameraDetectionStatus
} from '@ivillaparking/shared'

// Centralized intersection types for API responses with nested relations
export type RaffleRegistrationWithCycle = import('@ivillaparking/shared').IRaffleRegistration & {
  raffleCycle?: import('@ivillaparking/shared').IRaffleCycle
}
export type RaffleRegistrationWithVehicle = import('@ivillaparking/shared').IRaffleRegistration & {
  vehicle?: import('@ivillaparking/shared').IVehicle
}
export type ParkingAssignmentWithCycle = import('@ivillaparking/shared').IParkingAssignment & {
  raffleCycle?: import('@ivillaparking/shared').IRaffleCycle
}
export type CycleWithCount = import('@ivillaparking/shared').IRaffleCycle & {
  _count?: { registrations?: number; parkingAssignments?: number }
}

/** Extract `.data` from an API response, throwing if absent (server contract violation). */
export function requireData<T>(response: { data?: T }): T {
  if (response.data === undefined || response.data === null) {
    throw new Error('Server returned empty data for a required response')
  }
  return response.data
}

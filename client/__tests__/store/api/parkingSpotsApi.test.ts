import { configureStore } from '@reduxjs/toolkit'
import { type FetchArgs } from '@reduxjs/toolkit/query/react'
import { VehicleType } from '@ivillaparking/shared'
import authReducer from '../../../src/store/authSlice'
import uiReducer from '../../../src/store/uiSlice'

let nextResponse: { data?: unknown } = {}

const { mockBaseQuery, testBaseApi } = vi.hoisted(() => {
  const { createApi } = require('@reduxjs/toolkit/query/react')
  const mockBaseQuery = vi.fn()
  const testBaseApi = createApi({
    reducerPath: 'api',
    baseQuery: mockBaseQuery,
    tagTypes: [
      'Users',
      'Vehicles',
      'ParkingConfig',
      'Assignments',
      'Cycles',
      'Registrations',
      'Results',
      'Detections'
    ],
    keepUnusedDataFor: 0,
    endpoints: () => ({})
  })
  return { mockBaseQuery, testBaseApi }
})

vi.mock('../../../src/store/api', () => ({
  __esModule: true,
  baseApi: testBaseApi
}))

import { parkingSpotsApi } from '../../../src/store/api/parkingSpotsApi'

const mockConfig = {
  id: 'config-1',
  spotNumber: 1,
  vehicleType: 'CAR',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z'
}

const mockConfig2 = { ...mockConfig, id: 'config-2', spotNumber: 2 }

const mockAssignment = {
  id: 'assign-1',
  userId: 'user-1',
  vehicleId: 'v-1',
  raffleCycleId: 'cycle-1',
  spotNumber: 1,
  vehicleType: 'CAR',
  tier: 1,
  createdAt: '2026-01-15T00:00:00.000Z'
}

const mockAssignment2 = { ...mockAssignment, id: 'assign-2', spotNumber: 2 }

function createStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      ui: uiReducer,
      [testBaseApi.reducerPath]: testBaseApi.reducer
    },
    middleware: gDM =>
      gDM({ serializableCheck: false, immutableCheck: false }).concat(testBaseApi.middleware)
  })
}

let store: ReturnType<typeof createStore>

function mockSuccess(data: unknown) {
  nextResponse = { data: { data } }
}

beforeEach(() => {
  store = createStore()
  mockBaseQuery.mockClear()
  nextResponse = {}
  mockBaseQuery.mockImplementation(async () => ({ data: nextResponse.data }))
})

afterEach(() => {
  store.dispatch(testBaseApi.util.resetApiState())
})

describe('parkingSpotsApi', () => {
  describe('getParkingConfig', () => {
    it('should fetch the parking config', async () => {
      mockSuccess([mockConfig, mockConfig2])

      const result = await store.dispatch(parkingSpotsApi.endpoints.getParkingConfig.initiate())

      expect(mockBaseQuery.mock.calls[0][0]).toBe('/parking-spots/config')
      expect(result.data).toEqual([mockConfig, mockConfig2])
    })

    it('should return a empty array when the data is null', async () => {
      mockSuccess(null)

      const result = await store.dispatch(parkingSpotsApi.endpoints.getParkingConfig.initiate())
      expect(result.data).toEqual([])
    })
  })

  describe('createParkingConfig', () => {
    it('should send a POST with the config data', async () => {
      mockSuccess(mockConfig)

      const payload = { vehicleType: VehicleType.CAR, totalSpots: 10 }
      const result = await store.dispatch(
        parkingSpotsApi.endpoints.createParkingConfig.initiate(payload)
      )

      const args = mockBaseQuery.mock.calls[0][0] as FetchArgs
      expect(args.url).toBe('/parking-spots/config')
      expect(args.method).toBe('POST')
      expect(args.body).toEqual(payload)
      expect(result.data).toEqual(mockConfig)
    })
  })

  describe('getCurrentAssignments', () => {
    it('should fetch the current assignments', async () => {
      mockSuccess([mockAssignment, mockAssignment2])

      const result = await store.dispatch(
        parkingSpotsApi.endpoints.getCurrentAssignments.initiate()
      )

      expect(mockBaseQuery.mock.calls[0][0]).toBe('/parking-spots/assignments')
      expect(result.data).toEqual([mockAssignment, mockAssignment2])
    })

    it('should return an empty array when thedata is null', async () => {
      mockSuccess(null)

      const result = await store.dispatch(
        parkingSpotsApi.endpoints.getCurrentAssignments.initiate()
      )
      expect(result.data).toEqual([])
    })
  })

  describe('getAssignmentHistory', () => {
    it('should fetch the history without userId', async () => {
      mockSuccess([mockAssignment])

      const result = await store.dispatch(parkingSpotsApi.endpoints.getAssignmentHistory.initiate())

      const args = mockBaseQuery.mock.calls[0][0] as FetchArgs
      expect(args.url).toBe('/parking-spots/history')
      expect(args.params).toBeUndefined()
      expect(result.data).toEqual([mockAssignment])
    })

    it('should pass the userId param when is provided', async () => {
      mockSuccess([mockAssignment])

      await store.dispatch(parkingSpotsApi.endpoints.getAssignmentHistory.initiate('user-1'))

      const args = mockBaseQuery.mock.calls[0][0] as FetchArgs
      expect(args.params).toEqual({ userId: 'user-1' })
    })

    it('should return an empty array when the data is null', async () => {
      mockSuccess(null)

      const result = await store.dispatch(parkingSpotsApi.endpoints.getAssignmentHistory.initiate())
      expect(result.data).toEqual([])
    })
  })
})

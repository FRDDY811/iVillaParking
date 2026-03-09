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

import { vehiclesApi } from '../../../src/store/api/vehiclesApi'

const mockVehicle = {
  id: 'v-1',
  userId: 'user-1',
  licensePlate: 'ABC-123',
  type: 'CAR',
  brand: 'Toyota',
  model: 'Corolla',
  color: 'Blue',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z'
}

const mockVehicle2 = { ...mockVehicle, id: 'v-2', licensePlate: 'XYZ-789' }

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

describe('vehiclesApi', () => {
  describe('getVehicles', () => {
    it('should fetch all the vehicles', async () => {
      mockSuccess([mockVehicle, mockVehicle2])

      const result = await store.dispatch(vehiclesApi.endpoints.getVehicles.initiate())

      expect(mockBaseQuery.mock.calls[0][0]).toBe('/vehicles')
      expect(result.data).toEqual([mockVehicle, mockVehicle2])
    })

    it('returns empty array when data is null', async () => {
      mockSuccess(null)

      const result = await store.dispatch(vehiclesApi.endpoints.getVehicles.initiate())
      expect(result.data).toEqual([])
    })
  })

  describe('createVehicle', () => {
    it('should send a POST with the vehicle data', async () => {
      mockSuccess(mockVehicle)

      const payload = {
        licensePlate: 'ABC-123',
        type: VehicleType.CAR,
        make: 'Toyota',
        model: 'Corolla',
        color: 'Blue'
      }
      const result = await store.dispatch(vehiclesApi.endpoints.createVehicle.initiate(payload))

      const args = mockBaseQuery.mock.calls[0][0] as FetchArgs
      expect(args.url).toBe('/vehicles')
      expect(args.method).toBe('POST')
      expect(args.body).toEqual(payload)
      expect(result.data).toEqual(mockVehicle)
    })
  })

  describe('updateVehicle', () => {
    it('should send a PUT with id in URL and data in the body', async () => {
      const updated = { ...mockVehicle, color: 'Red' }
      mockSuccess(updated)

      const result = await store.dispatch(
        vehiclesApi.endpoints.updateVehicle.initiate({ id: 'v-1', data: { color: 'Red' } })
      )

      const args = mockBaseQuery.mock.calls[0][0] as FetchArgs
      expect(args.url).toBe('/vehicles/v-1')
      expect(args.method).toBe('PUT')
      expect(args.body).toEqual({ color: 'Red' })
      expect(result.data?.color).toBe('Red')
    })
  })

  describe('deleteVehicle', () => {
    it('should send the DELETE to the correct URL', async () => {
      nextResponse = { data: null }

      await store.dispatch(vehiclesApi.endpoints.deleteVehicle.initiate('v-1'))

      const args = mockBaseQuery.mock.calls[0][0] as FetchArgs
      expect(args.url).toBe('/vehicles/v-1')
      expect(args.method).toBe('DELETE')
    })
  })

  describe('searchVehicles', () => {
    it('should send the search query as param', async () => {
      mockSuccess([mockVehicle])

      const result = await store.dispatch(vehiclesApi.endpoints.searchVehicles.initiate('ABC'))

      const args = mockBaseQuery.mock.calls[0][0] as FetchArgs
      expect(args.url).toBe('/vehicles/search')
      expect(args.params).toEqual({ q: 'ABC' })
      expect(result.data).toEqual([mockVehicle])
    })

    it('should return an empty array when the data is null', async () => {
      mockSuccess(null)

      const result = await store.dispatch(vehiclesApi.endpoints.searchVehicles.initiate('XYZ'))
      expect(result.data).toEqual([])
    })
  })
})

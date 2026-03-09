import { configureStore } from '@reduxjs/toolkit'
import { type FetchArgs } from '@reduxjs/toolkit/query/react'
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

import { cameraApi } from '../../../src/store/api/cameraApi'

const mockDetection = {
  id: 'det-1',
  licensePlate: 'ABC-123',
  status: 'AUTHORIZED',
  vehicleId: 'v-1',
  detectedAt: '2026-01-15T10:30:00.000Z',
  createdAt: '2026-01-15T10:30:00.000Z'
}

const mockDetection2 = {
  ...mockDetection,
  id: 'det-2',
  licensePlate: 'XYZ-789',
  status: 'UNAUTHORIZED'
}

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

describe('cameraApi', () => {
  describe('detect', () => {
    it('sends POST with licensePlate in body', async () => {
      mockSuccess(mockDetection)

      const result = await store.dispatch(cameraApi.endpoints.detect.initiate('ABC-123'))

      const args = mockBaseQuery.mock.calls[0][0] as FetchArgs
      expect(args.url).toBe('/camera/detect')
      expect(args.method).toBe('POST')
      expect(args.body).toEqual({ licensePlate: 'ABC-123' })
      expect(result.data).toEqual(mockDetection)
    })
  })

  describe('getDetections', () => {
    it('should fetch the detections without params', async () => {
      mockSuccess([mockDetection, mockDetection2])

      const result = await store.dispatch(cameraApi.endpoints.getDetections.initiate())

      const args = mockBaseQuery.mock.calls[0][0] as FetchArgs
      expect(args.url).toBe('/camera/detections')
      expect(args.params).toBeUndefined()
      expect(result.data).toEqual([mockDetection, mockDetection2])
    })

    it('should pass the limit and status params', async () => {
      mockSuccess([mockDetection])

      await store.dispatch(
        cameraApi.endpoints.getDetections.initiate({ limit: 10, status: 'AUTHORIZED' })
      )

      const args = mockBaseQuery.mock.calls[0][0] as FetchArgs
      expect(args.params).toEqual({ limit: 10, status: 'AUTHORIZED' })
    })

    it('should return an empty array when the data is null', async () => {
      mockSuccess(null)

      const result = await store.dispatch(cameraApi.endpoints.getDetections.initiate())
      expect(result.data).toEqual([])
    })
  })
})

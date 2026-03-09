import { configureStore } from '@reduxjs/toolkit'
import { type FetchArgs } from '@reduxjs/toolkit/query/react'
import { RaffleCycleStatus } from '@ivillaparking/shared'
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

import { raffleApi } from '../../../src/store/api/raffleApi'

const mockCycle = {
  id: 'cycle-1',
  name: 'Q1 2026',
  startDate: '2026-01-01T00:00:00.000Z',
  endDate: '2026-03-31T00:00:00.000Z',
  status: 'OPEN',
  executedAt: null,
  createdAt: '2025-12-01T00:00:00.000Z',
  updatedAt: '2025-12-01T00:00:00.000Z'
}

const mockCycle2 = { ...mockCycle, id: 'cycle-2', name: 'Q2 2026' }

const mockRegistration = {
  id: 'reg-1',
  userId: 'user-1',
  vehicleId: 'vehicle-1',
  raffleCycleId: 'cycle-1',
  createdAt: '2026-01-05T00:00:00.000Z'
}

const mockAssignment = {
  id: 'assign-1',
  userId: 'user-1',
  vehicleId: 'vehicle-1',
  raffleCycleId: 'cycle-1',
  spotNumber: 12,
  vehicleType: 'CAR',
  tier: 1
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

describe('raffleApi', () => {
  describe('getCycles', () => {
    it('should build a query without params when no status is given', async () => {
      mockSuccess([mockCycle, mockCycle2])

      const result = await store.dispatch(raffleApi.endpoints.getCycles.initiate())

      expect(result.data).toEqual([mockCycle, mockCycle2])
      const args = mockBaseQuery.mock.calls[0][0] as FetchArgs
      expect(args.url).toBe('/raffle/cycles')
      expect(args.params).toBeUndefined()
    })

    it('should pass the status param when is provided', async () => {
      mockSuccess([mockCycle])

      await store.dispatch(raffleApi.endpoints.getCycles.initiate('OPEN'))

      const args = mockBaseQuery.mock.calls[0][0] as FetchArgs
      expect(args.params).toEqual({ status: 'OPEN' })
    })

    it('should return an empty array when the data is null', async () => {
      mockSuccess(null)

      const result = await store.dispatch(raffleApi.endpoints.getCycles.initiate())
      expect(result.data).toEqual([])
    })
  })

  describe('getCycleById', () => {
    it('should fetch a single cycle by id', async () => {
      mockSuccess(mockCycle)

      const result = await store.dispatch(raffleApi.endpoints.getCycleById.initiate('cycle-1'))

      expect(mockBaseQuery.mock.calls[0][0]).toBe('/raffle/cycles/cycle-1')
      expect(result.data).toEqual(mockCycle)
    })
  })

  describe('createCycle', () => {
    it('should send a POST with the cycle payload', async () => {
      mockSuccess(mockCycle)

      const payload = { name: 'Q1 2026', startDate: '2026-01-01', endDate: '2026-03-31' }
      const result = await store.dispatch(raffleApi.endpoints.createCycle.initiate(payload))

      const args = mockBaseQuery.mock.calls[0][0] as FetchArgs
      expect(args.url).toBe('/raffle/cycles')
      expect(args.method).toBe('POST')
      expect(args.body).toEqual(payload)
      expect(result.data).toEqual(mockCycle)
    })
  })

  describe('updateCycle', () => {
    it('should send a PATCH with id in the URL and data in the body', async () => {
      mockSuccess({ ...mockCycle, status: 'CLOSED' })

      const result = await store.dispatch(
        raffleApi.endpoints.updateCycle.initiate({
          id: 'cycle-1',
          data: { status: RaffleCycleStatus.CLOSED }
        })
      )

      const args = mockBaseQuery.mock.calls[0][0] as FetchArgs
      expect(args.url).toBe('/raffle/cycles/cycle-1')
      expect(args.method).toBe('PATCH')
      expect(args.body).toEqual({ status: 'CLOSED' })
      expect(result.data?.status).toBe('CLOSED')
    })
  })

  describe('registerForRaffle', () => {
    it('should send a POST with the vehicleId in the body', async () => {
      mockSuccess(mockRegistration)

      const result = await store.dispatch(
        raffleApi.endpoints.registerForRaffle.initiate({
          cycleId: 'cycle-1',
          vehicleId: 'vehicle-1'
        })
      )

      const args = mockBaseQuery.mock.calls[0][0] as FetchArgs
      expect(args.url).toBe('/raffle/cycles/cycle-1/register')
      expect(args.method).toBe('POST')
      expect(args.body).toEqual({ vehicleId: 'vehicle-1' })
      expect(result.data).toEqual(mockRegistration)
    })
  })

  describe('unregisterFromRaffle', () => {
    it('should send the DELETE to the correct URL', async () => {
      nextResponse = { data: undefined }

      await store.dispatch(
        raffleApi.endpoints.unregisterFromRaffle.initiate({
          cycleId: 'cycle-1',
          vehicleId: 'vehicle-1'
        })
      )

      const args = mockBaseQuery.mock.calls[0][0] as FetchArgs
      expect(args.url).toBe('/raffle/cycles/cycle-1/register/vehicle-1')
      expect(args.method).toBe('DELETE')
    })
  })

  describe('executeRaffle', () => {
    it('should send a POST to execute the endpoint', async () => {
      const executed = {
        ...mockCycle,
        status: 'COMPLETED',
        executedAt: '2026-02-01T00:00:00.000Z'
      }
      mockSuccess(executed)

      const result = await store.dispatch(raffleApi.endpoints.executeRaffle.initiate('cycle-1'))

      const args = mockBaseQuery.mock.calls[0][0] as FetchArgs
      expect(args.url).toBe('/raffle/cycles/cycle-1/execute')
      expect(args.method).toBe('POST')
      expect(result.data?.status).toBe('COMPLETED')
    })
  })

  describe('getResults', () => {
    it('should fetch the results for a cycle', async () => {
      mockSuccess([mockAssignment])

      const result = await store.dispatch(raffleApi.endpoints.getResults.initiate('cycle-1'))

      expect(mockBaseQuery.mock.calls[0][0]).toBe('/raffle/cycles/cycle-1/results')
      expect(result.data).toEqual([mockAssignment])
    })

    it('should return an empty array when the data is null', async () => {
      mockSuccess(null)

      const result = await store.dispatch(raffleApi.endpoints.getResults.initiate('cycle-1'))
      expect(result.data).toEqual([])
    })
  })

  describe('getUserRegistrations', () => {
    it('should fetche the registrations without filter', async () => {
      mockSuccess([mockRegistration])

      const result = await store.dispatch(raffleApi.endpoints.getUserRegistrations.initiate())

      const args = mockBaseQuery.mock.calls[0][0] as FetchArgs
      expect(args.url).toBe('/raffle/registrations')
      expect(args.params).toBeUndefined()
      expect(result.data).toEqual([mockRegistration])
    })

    it('should pass a cycleId param when is provided', async () => {
      mockSuccess([mockRegistration])

      await store.dispatch(raffleApi.endpoints.getUserRegistrations.initiate('cycle-1'))

      const args = mockBaseQuery.mock.calls[0][0] as FetchArgs
      expect(args.params).toEqual({ cycleId: 'cycle-1' })
    })

    it('should return an empty array when the data is null', async () => {
      mockSuccess(null)

      const result = await store.dispatch(raffleApi.endpoints.getUserRegistrations.initiate())
      expect(result.data).toEqual([])
    })
  })
})

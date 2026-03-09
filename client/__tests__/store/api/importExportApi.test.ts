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

import { importExportApi } from '../../../src/store/api/importExportApi'

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

describe('importExportApi', () => {
  describe('importResidents', () => {
    it('should send a POST with FormData containing the file', async () => {
      mockSuccess({ imported: 5, skipped: 1 })

      const file = new File(['csv-content'], 'residents.csv', { type: 'text/csv' })
      const result = await store.dispatch(importExportApi.endpoints.importResidents.initiate(file))

      const args = mockBaseQuery.mock.calls[0][0] as FetchArgs
      expect(args.url).toBe('/import-export/residents')
      expect(args.method).toBe('POST')
      expect(args.body).toBeInstanceOf(FormData)
      expect((args.body as FormData).get('file')).toBe(file)
      expect(result.data).toEqual({ imported: 5, skipped: 1 })
    })
  })

  describe('importParkingConfig', () => {
    it('should send a POST with FormData containing the file', async () => {
      mockSuccess({ imported: 10, skipped: 0 })

      const file = new File(['csv-content'], 'parking.csv', { type: 'text/csv' })
      const result = await store.dispatch(
        importExportApi.endpoints.importParkingConfig.initiate(file)
      )

      const args = mockBaseQuery.mock.calls[0][0] as FetchArgs
      expect(args.url).toBe('/import-export/parking-config')
      expect(args.method).toBe('POST')
      expect(args.body).toBeInstanceOf(FormData)
      expect((args.body as FormData).get('file')).toBe(file)
      expect(result.data).toEqual({ imported: 10, skipped: 0 })
    })
  })
})

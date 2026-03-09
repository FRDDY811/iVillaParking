import { configureStore } from '@reduxjs/toolkit'
import { type FetchArgs } from '@reduxjs/toolkit/query/react'
import { UserStatus } from '@ivillaparking/shared'
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

import { usersApi } from '../../../src/store/api/usersApi'

const mockUser = {
  id: 'user-1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@test.com',
  role: 'RESIDENT',
  status: 'ACTIVE',
  apartment: '4B',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z'
}

const mockUser2 = { ...mockUser, id: 'user-2', firstName: 'Jane', email: 'jane@test.com' }

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

function mockPaginatedSuccess(data: unknown[], total: number, page: number, totalPages: number) {
  nextResponse = { data: { data, total, page, totalPages } }
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

describe('usersApi', () => {
  describe('getUsers', () => {
    it('should fetch the users without params', async () => {
      mockPaginatedSuccess([mockUser, mockUser2], 2, 1, 1)

      const result = await store.dispatch(usersApi.endpoints.getUsers.initiate())

      const args = mockBaseQuery.mock.calls[0][0] as FetchArgs
      expect(args.url).toBe('/users')
      expect(args.params).toBeUndefined()
      expect(result.data).toEqual({
        data: [mockUser, mockUser2],
        total: 2,
        page: 1,
        totalPages: 1
      })
    })

    it('should pass the pagination and filter params', async () => {
      mockPaginatedSuccess([mockUser], 1, 2, 3)

      await store.dispatch(
        usersApi.endpoints.getUsers.initiate({
          page: 2,
          limit: 10,
          search: 'john',
          status: UserStatus.ACTIVE
        })
      )

      const args = mockBaseQuery.mock.calls[0][0] as FetchArgs
      expect(args.params).toEqual({ page: 2, limit: 10, search: 'john', status: 'ACTIVE' })
    })

    it('should return an empty array when the data is null', async () => {
      mockPaginatedSuccess(null as unknown as unknown[], 0, 1, 0)

      const result = await store.dispatch(usersApi.endpoints.getUsers.initiate())
      expect(result.data?.data).toEqual([])
    })
  })

  describe('getPendingUsers', () => {
    it('should fetch the pending users', async () => {
      const pending = { ...mockUser, status: 'PENDING' }
      mockSuccess([pending])

      const result = await store.dispatch(usersApi.endpoints.getPendingUsers.initiate())

      expect(mockBaseQuery.mock.calls[0][0]).toBe('/users/pending')
      expect(result.data).toEqual([pending])
    })

    it('should return an empty array when the data is null', async () => {
      mockSuccess(null)

      const result = await store.dispatch(usersApi.endpoints.getPendingUsers.initiate())
      expect(result.data).toEqual([])
    })
  })

  describe('updateUser', () => {
    it('should send a PATCH with id in URL and data in the body', async () => {
      const updated = { ...mockUser, status: 'ACTIVE' }
      mockSuccess(updated)

      const result = await store.dispatch(
        usersApi.endpoints.updateUser.initiate({
          id: 'user-1',
          data: { status: UserStatus.ACTIVE }
        })
      )

      const args = mockBaseQuery.mock.calls[0][0] as FetchArgs
      expect(args.url).toBe('/users/user-1')
      expect(args.method).toBe('PATCH')
      expect(args.body).toEqual({ status: 'ACTIVE' })
      expect(result.data?.status).toBe('ACTIVE')
    })
  })

  describe('deleteUser', () => {
    it('should send DELETE to the correct URL', async () => {
      nextResponse = { data: null }

      await store.dispatch(usersApi.endpoints.deleteUser.initiate('user-1'))

      const args = mockBaseQuery.mock.calls[0][0] as FetchArgs
      expect(args.url).toBe('/users/user-1')
      expect(args.method).toBe('DELETE')
    })
  })
})

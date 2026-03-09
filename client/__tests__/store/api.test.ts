import type { Mock } from 'vitest'

const mockRawBaseQuery = vi.fn()
const mockGetAccessToken = vi.fn().mockReturnValue(null)
const mockSetAccessToken = vi.fn()

let capturedPrepareHeaders: ((headers: Headers) => Headers) | undefined

vi.mock('@reduxjs/toolkit/query/react', async () => {
  const actual = await vi.importActual('@reduxjs/toolkit/query/react')
  return {
    ...actual,
    fetchBaseQuery: (opts: { prepareHeaders?: (headers: Headers) => Headers }) => {
      capturedPrepareHeaders = opts?.prepareHeaders
      return mockRawBaseQuery
    },
    retry: Object.assign((fn: unknown) => fn, { fail: vi.fn() })
  }
})

vi.mock('../../src/api/axios', () => ({
  getAccessToken: () => mockGetAccessToken(),
  setAccessToken: (token: string | null) => mockSetAccessToken(token)
}))

const mockLogoutDispatch = vi.fn()
vi.mock('../../src/store/authSlice', () => ({
  logout: () => mockLogoutDispatch
}))

import { configureStore } from '@reduxjs/toolkit'
import { retry } from '@reduxjs/toolkit/query/react'

let baseApi: typeof import('../../src/store/api').baseApi

beforeAll(async () => {
  const mod = await import('../../src/store/api')
  baseApi = mod.baseApi
})

function createStore() {
  return configureStore({
    reducer: { [baseApi.reducerPath]: baseApi.reducer },
    middleware: gDM =>
      gDM({ serializableCheck: false, immutableCheck: false }).concat(baseApi.middleware)
  })
}

function getTestEndpoint() {
  const extended = baseApi.injectEndpoints({
    endpoints: builder => ({
      testQuery: builder.query<unknown, void>({
        query: () => '/test'
      })
    }),
    overrideExisting: true
  })
  return extended.endpoints.testQuery
}

let store: ReturnType<typeof createStore>

beforeEach(() => {
  store = createStore()
  mockRawBaseQuery.mockReset()
  mockGetAccessToken.mockReturnValue(null)
  mockSetAccessToken.mockClear()
  mockLogoutDispatch.mockClear()
})

afterEach(() => {
  store.dispatch(baseApi.util.resetApiState())
})

describe('api.ts baseQueryWithReauth', () => {
  describe('prepareHeaders', () => {
    function createMockHeaders() {
      const store = new Map<string, string>()
      return {
        set: (key: string, value: string) => store.set(key, value),
        get: (key: string) => store.get(key) ?? null,
        _store: store
      } as unknown as Headers
    }

    it('should set the Authorization header when token exists', () => {
      expect(capturedPrepareHeaders).toBeDefined()
      mockGetAccessToken.mockReturnValue('my-token')
      const headers = createMockHeaders()
      capturedPrepareHeaders!(headers)
      expect(headers.get('Authorization')).toBe('Bearer my-token')
    })

    it('should not set the Authorization header when there is not token', () => {
      mockGetAccessToken.mockReturnValue(null)
      const headers = createMockHeaders()
      capturedPrepareHeaders!(headers)
      expect(headers.get('Authorization')).toBeNull()
    })
  })

  describe('successful request', () => {
    it('should return data when is successful', async () => {
      mockRawBaseQuery.mockResolvedValue({ data: { result: 'ok' } })
      const ep = getTestEndpoint()

      const result = await store.dispatch(ep.initiate())

      expect(result.data).toEqual({ result: 'ok' })
      expect(mockRawBaseQuery).toHaveBeenCalledTimes(1)
    })
  })

  describe('401 reauth flow', () => {
    it('should refresh the token and retries on 401', async () => {
      mockRawBaseQuery
        .mockResolvedValueOnce({ error: { status: 401 } })
        .mockResolvedValueOnce({ data: { data: { accessToken: 'new-token' } } })
        .mockResolvedValueOnce({ data: { result: 'retried' } })

      const ep = getTestEndpoint()
      const result = await store.dispatch(ep.initiate())

      expect(mockSetAccessToken).toHaveBeenCalledWith('new-token')
      expect(mockRawBaseQuery).toHaveBeenCalledTimes(3)
      expect(result.data).toEqual({ result: 'retried' })
    })

    it('should skip the reauth for the /auth/refresh endpoint', async () => {
      mockRawBaseQuery.mockResolvedValue({ error: { status: 401 } })

      const extended = baseApi.injectEndpoints({
        endpoints: builder => ({
          refreshTestStr: builder.query<unknown, void>({
            query: () => '/auth/refresh'
          })
        }),
        overrideExisting: true
      })

      const result = await store.dispatch(extended.endpoints.refreshTestStr.initiate())

      expect(result.error).toBeDefined()
      expect(mockRawBaseQuery).toHaveBeenCalledTimes(1)
    })

    it('should skip the reauth for /auth/refresh endpoint', async () => {
      mockRawBaseQuery.mockResolvedValue({ error: { status: 401 } })

      const extended = baseApi.injectEndpoints({
        endpoints: builder => ({
          refreshTestObj: builder.query<unknown, void>({
            query: () => ({ url: '/auth/refresh', method: 'POST' })
          })
        }),
        overrideExisting: true
      })

      const result = await store.dispatch(extended.endpoints.refreshTestObj.initiate())

      expect(result.error).toBeDefined()
      expect(mockRawBaseQuery).toHaveBeenCalledTimes(1)
    })

    it('should dispatch the logout when the refresh fails', async () => {
      mockRawBaseQuery
        .mockResolvedValueOnce({ error: { status: 401 } })
        .mockResolvedValueOnce({ error: { status: 401, data: 'Refresh failed' } })

      const ep = getTestEndpoint()
      await store.dispatch(ep.initiate())

      expect(mockLogoutDispatch).toHaveBeenCalled()
    })
  })

  describe('4xx retry bail', () => {
    it('should call the retry.fail for 4xx errors', async () => {
      const error = { status: 403, data: 'Forbidden' }
      mockRawBaseQuery.mockResolvedValue({ error })

      const ep = getTestEndpoint()
      await store.dispatch(ep.initiate())

      expect(retry.fail as unknown as Mock).toHaveBeenCalledWith(error)
    })

    it('should call the retry.fail for 400 error', async () => {
      const error = { status: 400, data: 'Bad request' }
      mockRawBaseQuery.mockResolvedValue({ error })

      const ep = getTestEndpoint()
      await store.dispatch(ep.initiate())

      expect(retry.fail as unknown as Mock).toHaveBeenCalledWith(error)
    })

    it('should not call the retry.fail for 5xx errors', async () => {
      mockRawBaseQuery.mockResolvedValue({ error: { status: 500, data: 'Server error' } })
      ;(retry.fail as unknown as Mock).mockClear()

      const ep = getTestEndpoint()
      await store.dispatch(ep.initiate())

      expect(retry.fail as unknown as Mock).not.toHaveBeenCalled()
    })

    it('should not call the retry.fail for non-numeric status', async () => {
      mockRawBaseQuery.mockResolvedValue({ error: { status: 'FETCH_ERROR', data: 'Network' } })
      ;(retry.fail as unknown as Mock).mockClear()

      const ep = getTestEndpoint()
      await store.dispatch(ep.initiate())

      expect(retry.fail as unknown as Mock).not.toHaveBeenCalled()
    })
  })
})

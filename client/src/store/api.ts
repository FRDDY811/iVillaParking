/**
 * RTK Query base API configuration with automatic token refresh and retry.
 *
 * Request flow: rawBaseQuery -> baseQueryWithReauth (401 -> refresh -> retry) -> retry wrapper (5xx/network -> exponential backoff, max 3 attempts)
 *
 * Re-auth uses a single-flight promise to prevent concurrent refresh requests
 * from multiple parallel queries hitting 401 simultaneously.
 * Client errors (4xx) bail out of retry immediately.
 */
import {
  createApi,
  fetchBaseQuery,
  retry,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError
} from '@reduxjs/toolkit/query/react'
import { getAccessToken, setAccessToken } from '../api/axios'
import { API_BASE_URL } from '../utils/constants'
import { logout } from './authSlice'

interface RefreshTokenResponse {
  data?: { accessToken?: string }
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  credentials: 'include',
  timeout: 30000,
  prepareHeaders: headers => {
    const token = getAccessToken()
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
    return headers
  }
})

let refreshPromise: Promise<string> | null = null

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  let result = await rawBaseQuery(args, api, extraOptions)

  if (result.error?.status === 401) {
    // Skip re-auth for the refresh endpoint itself
    const url = typeof args === 'string' ? args : args.url
    if (url?.includes('/auth/refresh')) {
      return result
    }

    try {
      if (!refreshPromise) {
        refreshPromise = (async () => {
          const refreshResult = await rawBaseQuery(
            { url: '/auth/refresh', method: 'POST' },
            api,
            extraOptions
          )
          if (refreshResult.error) {
            throw refreshResult.error
          }
          const token = (refreshResult.data as RefreshTokenResponse)?.data?.accessToken
          if (!token) throw new Error('Invalid refresh response')
          setAccessToken(token)
          return token
        })().finally(() => {
          refreshPromise = null
        })
      }

      await refreshPromise
      // Retry original request with new token
      result = await rawBaseQuery(args, api, extraOptions)
    } catch {
      api.dispatch(logout())
    }
  }

  // Bail out of retry for client errors (4xx) — only retry server/network errors
  if (
    result.error &&
    typeof result.error.status === 'number' &&
    result.error.status >= 400 &&
    result.error.status < 500
  ) {
    retry.fail(result.error)
  }

  return result
}

// Wrap with retry: up to 3 attempts with exponential backoff for transient (5xx/network) failures
const baseQueryWithRetry = retry(baseQueryWithReauth, {
  maxRetries: 2,
  backoff: async attempt => {
    await new Promise(resolve => setTimeout(resolve, Math.min(1000 * 2 ** attempt, 5000)))
  }
})

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithRetry,
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
  // Cache unused data for 60 seconds before garbage collection
  keepUnusedDataFor: 60,
  endpoints: () => ({})
})

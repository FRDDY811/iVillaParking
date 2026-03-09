/**
 * Axios instance is used exclusively for auth endpoints (login, register, refresh, logout).
 * Data-fetching for all other resources uses RTK Query (see store/api.ts).
 *
 * This separation exists because auth state must be resolved before that RTK Query
 * can attach tokens via prepareHeaders.
 */
import axios from 'axios'
import { API_BASE_URL } from '../utils/constants'

const timeout = 30000

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: timeout
})

let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken() {
  return accessToken
}

api.interceptors.request.use(config => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

export default api

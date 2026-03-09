import api from './axios'
import { LoginRequest, RegisterRequest } from '../types'

export const authApi = {
  login: (data: LoginRequest) => api.post('/auth/login', data),
  register: (data: RegisterRequest) => api.post('/auth/register', data),
  refresh: () => api.post('/auth/refresh'),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me')
}

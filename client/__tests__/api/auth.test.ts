const mockGet = vi.fn().mockResolvedValue({ data: {} })
const mockPost = vi.fn().mockResolvedValue({ data: {} })

vi.mock('../../src/api/axios', () => ({
  __esModule: true,
  default: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args)
  }
}))

import { authApi } from '../../src/api/auth'

beforeEach(() => {
  mockGet.mockClear()
  mockPost.mockClear()
})

describe('authApi endpoints', () => {
  it('should call the login ebdpoint with the credentials', async () => {
    const creds = { email: 'test@test.com', password: 'pass123' }
    await authApi.login(creds)
    expect(mockPost).toHaveBeenCalledWith('/auth/login', creds)
  })

  it('should call the register endpoint with with the user data', async () => {
    const data = {
      email: 'new@test.com',
      password: 'pass123',
      firstName: 'John',
      lastName: 'Doe',
      apartment: '4B'
    }
    await authApi.register(data)
    expect(mockPost).toHaveBeenCalledWith('/auth/register', data)
  })

  it('should call the refresh endpoint', async () => {
    await authApi.refresh()
    expect(mockPost).toHaveBeenCalledWith('/auth/refresh')
  })

  it('should call the logout endpoint', async () => {
    await authApi.logout()
    expect(mockPost).toHaveBeenCalledWith('/auth/logout')
  })

  it('should call the the me endpoint', async () => {
    await authApi.getMe()
    expect(mockGet).toHaveBeenCalledWith('/auth/me')
  })
})

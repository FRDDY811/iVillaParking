import authReducer, {
  login,
  register,
  logout,
  refreshToken,
  getMe,
  clearError
} from '../../src/store/authSlice'
import { UserRole, UserStatus } from '@ivillaparking/shared'

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null
}

const mockUser = {
  id: '1',
  email: 'test@test.com',
  firstName: 'Test',
  lastName: 'User',
  apartment: '1A',
  role: UserRole.RESIDENT,
  status: UserStatus.ACTIVE,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z'
}

describe('authSlice', () => {
  it('should return the initial state', () => {
    expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState)
  })

  it('should set loading on login.pending', () => {
    const state = authReducer(
      { ...initialState, error: 'old error' },
      login.pending('', { email: '', password: '' })
    )
    expect(state.loading).toBe(true)
    expect(state.error).toBeNull()
  })

  it('should set the user and isAuthenticated on login.fulfilled', () => {
    const state = authReducer(
      { ...initialState, loading: true },
      login.fulfilled(mockUser, '', { email: '', password: '' })
    )
    expect(state.user).toEqual(mockUser)
    expect(state.isAuthenticated).toBe(true)
    expect(state.loading).toBe(false)
  })

  it('should set an error on login.rejected', () => {
    const state = authReducer(
      { ...initialState, loading: true },
      login.rejected(null, '', { email: '', password: '' }, 'Invalid credentials')
    )
    expect(state.error).toBe('Invalid credentials')
    expect(state.loading).toBe(false)
    expect(state.isAuthenticated).toBe(false)
  })

  it('should set loading on register.pending', () => {
    const state = authReducer(
      initialState,
      register.pending('', { email: '', password: '', firstName: '', lastName: '', apartment: '' })
    )
    expect(state.loading).toBe(true)
    expect(state.error).toBeNull()
  })

  it('should not set the user on register.fulfilled', () => {
    const state = authReducer(
      { ...initialState, loading: true },
      register.fulfilled({ success: true } as never, '', {
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        apartment: ''
      })
    )
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
    expect(state.loading).toBe(false)
  })

  it('should set an error on register.rejected', () => {
    const state = authReducer(
      { ...initialState, loading: true },
      register.rejected(
        null,
        '',
        { email: '', password: '', firstName: '', lastName: '', apartment: '' },
        'Email taken'
      )
    )
    expect(state.error).toBe('Email taken')
    expect(state.loading).toBe(false)
  })

  it('should set the user on getMe.fulfilled', () => {
    const state = authReducer(initialState, getMe.fulfilled(mockUser, ''))
    expect(state.user).toEqual(mockUser)
    expect(state.isAuthenticated).toBe(true)
  })

  it('should clear the user on getMe.rejected', () => {
    const loggedInState = { ...initialState, user: mockUser, isAuthenticated: true }
    const state = authReducer(loggedInState, getMe.rejected(null, '', undefined, 'Failed'))
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })

  it('should clear the state on logout.fulfilled', () => {
    const loggedInState = { user: mockUser, isAuthenticated: true, loading: false, error: null }
    const state = authReducer(loggedInState, logout.fulfilled(undefined, ''))
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })

  it('should setthe  user on refreshToken.fulfilled', () => {
    const state = authReducer(initialState, refreshToken.fulfilled(mockUser, ''))
    expect(state.user).toEqual(mockUser)
    expect(state.isAuthenticated).toBe(true)
  })

  it('should clear the user on refreshToken.rejected', () => {
    const loggedInState = { ...initialState, user: mockUser, isAuthenticated: true }
    const state = authReducer(
      loggedInState,
      refreshToken.rejected(null, '', undefined, 'Session expired')
    )
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })

  it('should clear the error with  the clearError reducer', () => {
    const errorState = { ...initialState, error: 'Some error' }
    const state = authReducer(errorState, clearError())
    expect(state.error).toBeNull()
  })
})

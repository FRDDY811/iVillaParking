import { renderHook } from '@testing-library/react'
import { useAuth } from '../../src/hooks/useAuth'
import * as store from '../../src/store'
import { UserRole } from '../../src/types'

describe('useAuth', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return an unauthenticated state when there is not user logged', () => {
    vi.spyOn(store, 'useAppSelector').mockImplementation(selector =>
      selector({
        auth: { user: null, isAuthenticated: false, loading: false, error: null }
      } as store.RootState)
    )

    const { result } = renderHook(() => useAuth())

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.loading).toBe(false)
    expect(result.current.isAdmin).toBe(false)
    expect(result.current.isResident).toBe(false)
  })

  it('should return an admin state for an admin user', () => {
    const adminUser = { id: '1', role: UserRole.ADMIN } as store.RootState['auth']['user']
    vi.spyOn(store, 'useAppSelector').mockImplementation(selector =>
      selector({
        auth: { user: adminUser, isAuthenticated: true, loading: false, error: null }
      } as store.RootState)
    )

    const { result } = renderHook(() => useAuth())

    expect(result.current.user).toBe(adminUser)
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.isAdmin).toBe(true)
    expect(result.current.isResident).toBe(false)
  })

  it('should return a resident state for a resident user', () => {
    const residentUser = { id: '2', role: UserRole.RESIDENT } as store.RootState['auth']['user']
    vi.spyOn(store, 'useAppSelector').mockImplementation(selector =>
      selector({
        auth: { user: residentUser, isAuthenticated: true, loading: false, error: null }
      } as store.RootState)
    )

    const { result } = renderHook(() => useAuth())

    expect(result.current.isAdmin).toBe(false)
    expect(result.current.isResident).toBe(true)
  })

  it('should reflect the loading state', () => {
    vi.spyOn(store, 'useAppSelector').mockImplementation(selector =>
      selector({
        auth: { user: null, isAuthenticated: false, loading: true, error: null }
      } as store.RootState)
    )

    const { result } = renderHook(() => useAuth())

    expect(result.current.loading).toBe(true)
  })
})

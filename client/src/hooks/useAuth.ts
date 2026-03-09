/**
 * Provides current authentication state and role-derived booleans.
 * Uses shallowEqual to prevent unnecessary re-renders when unrelated
 * Redux state changes.
 *
 * @returns user, isAuthenticated, loading, isAdmin, isResident
 * @example
 * const { user, isAdmin } = useAuth()
 * if (!isAdmin) return <Navigate to="/dashboard" />
 */
import { shallowEqual } from 'react-redux'
import { useAppSelector } from '../store'
import { IUser, UserRole } from '../types'

interface UseAuthReturn {
  user: IUser | null
  isAuthenticated: boolean
  loading: boolean
  isAdmin: boolean
  isResident: boolean
}

export function useAuth(): UseAuthReturn {
  const { user, isAuthenticated, loading } = useAppSelector(state => state.auth, shallowEqual)

  return {
    user,
    isAuthenticated,
    loading,
    isAdmin: user?.role === UserRole.ADMIN,
    isResident: user?.role === UserRole.RESIDENT
  }
}

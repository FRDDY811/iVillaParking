import React from 'react'
import { Navigate } from 'react-router-dom'
import { Spin } from 'antd'
import { useAuth } from '../../hooks/useAuth'
import { UserRole } from '../../types'
import { ROUTES } from '../../utils/routes'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: UserRole
}

/** Route guard that redirects unauthenticated users to /login. Optionally restricts by role.
 * Renders children only when auth state is resolved.
 **/
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, user, loading } = useAuth()

  if (loading) {
    return (
      <div className="center-fullscreen">
        <Spin size="large" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to={user?.role === UserRole.ADMIN ? ROUTES.ADMIN : ROUTES.RESIDENT} replace />
  }

  return <>{children}</>
}

export default ProtectedRoute

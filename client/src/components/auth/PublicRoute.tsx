import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { ROUTES } from '../../utils/routes'

interface PublicRouteProps {
  children: React.ReactNode
}

/** Route guard for login/register pages.
 * Redirects authenticated users to their role-appropriate dashboard to prevent re-login.
 **/
const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated, isAdmin } = useAuth()

  if (isAuthenticated) {
    return <Navigate to={isAdmin ? ROUTES.ADMIN : ROUTES.RESIDENT} replace />
  }

  return <>{children}</>
}

export default PublicRoute

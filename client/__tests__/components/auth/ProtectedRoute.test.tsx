import React from 'react'
import { screen } from '@testing-library/react'
import { Routes, Route } from 'react-router-dom'
import {
  renderWithProviders,
  mockAdminUser,
  mockResidentUser
} from '../../helpers/renderWithProviders'
import ProtectedRoute from '../../../src/components/auth/ProtectedRoute'
import { UserRole } from '@ivillaparking/shared'
import type { RootState } from '../../../src/store'

function renderProtectedRoute(
  preloadedState: Partial<RootState>,
  requiredRole?: UserRole,
  route = '/protected'
) {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<div>Login Page</div>} />
      <Route path="/admin" element={<div>Admin Dashboard</div>} />
      <Route path="/resident" element={<div>Resident Dashboard</div>} />
      <Route
        path="/protected"
        element={
          <ProtectedRoute requiredRole={requiredRole}>
            <div>Protected Content</div>
          </ProtectedRoute>
        }
      />
    </Routes>,
    { preloadedState, route }
  )
}

describe('ProtectedRoute', () => {
  it('should redirect to /login when the user is not uthenticated', () => {
    renderProtectedRoute({
      auth: { user: null, isAuthenticated: false, loading: false, error: null }
    })

    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })

  it('should render the correct role', () => {
    renderProtectedRoute(
      {
        auth: { user: mockAdminUser, isAuthenticated: true, loading: false, error: null }
      },
      UserRole.ADMIN
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('should redirect to their dashboard for a wrong role', () => {
    renderProtectedRoute(
      {
        auth: { user: mockResidentUser, isAuthenticated: true, loading: false, error: null }
      },
      UserRole.ADMIN
    )

    expect(screen.getByText('Resident Dashboard')).toBeInTheDocument()
  })

  it('should show a spinner when is loading', () => {
    renderProtectedRoute({
      auth: { user: null, isAuthenticated: false, loading: true, error: null }
    })

    expect(document.querySelector('.ant-spin')).toBeInTheDocument()
  })
})

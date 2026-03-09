import React from 'react'
import { screen } from '@testing-library/react'
import PublicRoute from '../../../src/components/auth/PublicRoute'
import {
  renderWithProviders,
  mockAdminUser,
  mockResidentUser
} from '../../helpers/renderWithProviders'
import type { RootState } from '../../../src/store'

const unauthState: Partial<RootState> = {
  auth: { user: null, isAuthenticated: false, loading: false, error: null }
}

const adminAuthState: Partial<RootState> = {
  auth: { user: mockAdminUser, isAuthenticated: true, loading: false, error: null }
}

const residentAuthState: Partial<RootState> = {
  auth: { user: mockResidentUser, isAuthenticated: true, loading: false, error: null }
}

describe('PublicRoute', () => {
  it('should render when the user is not authenticated', () => {
    renderWithProviders(
      <PublicRoute>
        <div>Public Content</div>
      </PublicRoute>,
      { preloadedState: unauthState }
    )

    expect(screen.getByText('Public Content')).toBeInTheDocument()
  })

  it('should redirect the admin user to /admin when is authenticated', () => {
    renderWithProviders(
      <PublicRoute>
        <div>Public Content</div>
      </PublicRoute>,
      { preloadedState: adminAuthState, route: '/login' }
    )

    expect(screen.queryByText('Public Content')).not.toBeInTheDocument()
  })

  it('should redirect the resident to /resident when is authenticated', () => {
    renderWithProviders(
      <PublicRoute>
        <div>Public Content</div>
      </PublicRoute>,
      { preloadedState: residentAuthState, route: '/login' }
    )

    expect(screen.queryByText('Public Content')).not.toBeInTheDocument()
  })
})

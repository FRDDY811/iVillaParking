import React from 'react'
import { screen } from '@testing-library/react'
import LoginPage from '../../src/pages/LoginPage'
import { renderWithProviders } from '../helpers/renderWithProviders'
import type { RootState } from '../../src/store'

vi.mock('../../src/components/auth/LoginForm', () => ({
  default: () => <div data-testid="login-form">LoginForm</div>
}))

const unauthState: Partial<RootState> = {
  auth: { user: null, isAuthenticated: false, loading: false, error: null }
}

describe('LoginPage', () => {
  it('should render the title, login form, and the register link', () => {
    renderWithProviders(<LoginPage />, { preloadedState: unauthState })

    expect(screen.getByText('iVillaParking')).toBeInTheDocument()
    expect(screen.getByTestId('login-form')).toBeInTheDocument()
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /register here/i })).toHaveAttribute(
      'href',
      '/register'
    )
  })
})

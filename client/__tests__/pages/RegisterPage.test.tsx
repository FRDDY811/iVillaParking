import React from 'react'
import { screen } from '@testing-library/react'
import RegisterPage from '../../src/pages/RegisterPage'
import { renderWithProviders } from '../helpers/renderWithProviders'
import type { RootState } from '../../src/store'

vi.mock('../../src/components/auth/RegisterForm', () => ({
  default: () => <div data-testid="register-form">RegisterForm</div>
}))

const unauthState: Partial<RootState> = {
  auth: { user: null, isAuthenticated: false, loading: false, error: null }
}

describe('RegisterPage', () => {
  it('should render the title, register form, and login link', () => {
    renderWithProviders(<RegisterPage />, { preloadedState: unauthState })

    expect(screen.getByText('Register')).toBeInTheDocument()
    expect(screen.getByTestId('register-form')).toBeInTheDocument()
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /log in/i })).toHaveAttribute('href', '/login')
  })
})

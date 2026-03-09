import React from 'react'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../helpers/renderWithProviders'
import LoginForm from '../../../src/components/auth/LoginForm'
const user = userEvent.setup({ delay: null })

vi.mock('../../../src/api/auth', () => ({
  authApi: {
    login: vi.fn().mockResolvedValue({
      data: {
        data: { accessToken: 'token', user: { id: '1', email: 'test@test.com', role: 'RESIDENT' } }
      }
    })
  }
}))

vi.mock('../../../src/api/axios', () => ({
  __esModule: true,
  default: {},
  setAccessToken: vi.fn(),
  getAccessToken: vi.fn()
}))

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the email and password inputs and the submit button', () => {
    renderWithProviders(<LoginForm />)

    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument()
  })

  it('should show an error alert from store', () => {
    renderWithProviders(<LoginForm />, {
      preloadedState: {
        auth: { user: null, isAuthenticated: false, loading: false, error: 'Invalid credentials' }
      }
    })

    expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
  })

  it('should show the loading state when the log-in button is clicked', () => {
    renderWithProviders(<LoginForm />, {
      preloadedState: {
        auth: { user: null, isAuthenticated: false, loading: true, error: null }
      }
    })

    const button = screen.getByRole('button', { name: /log in/i })
    expect(button).toHaveClass('ant-btn-loading')
  })

  it('should dispatch the login on the form submit', async () => {
    const { store } = renderWithProviders(<LoginForm />)

    await user.type(screen.getByLabelText('Email'), 'test@test.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.click(screen.getByRole('button', { name: /log in/i }))

    await waitFor(() => {
      expect(store.getState().auth.isAuthenticated).toBe(true)
    })
  })

  it('should clear the existing error before dispatching login', async () => {
    const { store } = renderWithProviders(<LoginForm />, {
      preloadedState: {
        auth: { user: null, isAuthenticated: false, loading: false, error: 'Previous error' }
      }
    })

    expect(screen.getByText('Previous error')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Email'), 'test@test.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.click(screen.getByRole('button', { name: /log in/i }))

    await waitFor(() => {
      expect(store.getState().auth.error).toBeNull()
    })
  })

  it('should show a validation error when an invalid email is typed', async () => {
    renderWithProviders(<LoginForm />)

    await user.type(screen.getByLabelText('Email'), 'notanemail')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.click(screen.getByRole('button', { name: /log in/i }))

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email')).toBeInTheDocument()
    })
  })

  it('should show a validation error when the fields are empty', async () => {
    renderWithProviders(<LoginForm />)

    await user.click(screen.getByRole('button', { name: /log in/i }))

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email')).toBeInTheDocument()
      expect(screen.getByText('Please enter your password')).toBeInTheDocument()
    })
  })

  it('should not dispatch login with invalid data', async () => {
    const { store } = renderWithProviders(<LoginForm />)

    await user.type(screen.getByLabelText('Email'), 'notanemail')
    await user.click(screen.getByRole('button', { name: /log in/i }))

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email')).toBeInTheDocument()
    })

    expect(store.getState().auth.isAuthenticated).toBe(false)
    expect(store.getState().auth.loading).toBe(false)
  })

  it('should clear the error when the close button is clicked in the alert', async () => {
    const { store } = renderWithProviders(<LoginForm />, {
      preloadedState: {
        auth: { user: null, isAuthenticated: false, loading: false, error: 'Some error' }
      }
    })

    expect(screen.getByText('Some error')).toBeInTheDocument()

    const closeBtn = screen.getByRole('button', { name: /close/i })
    await user.click(closeBtn)

    await waitFor(() => {
      expect(store.getState().auth.error).toBeNull()
    })
  })
})

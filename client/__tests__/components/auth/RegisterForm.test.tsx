import React from 'react'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../helpers/renderWithProviders'
import RegisterForm from '../../../src/components/auth/RegisterForm'
import { authApi } from '../../../src/api/auth'

vi.mock('../../../src/api/auth', () => ({
  authApi: {
    register: vi.fn().mockResolvedValue({ data: { data: { message: 'Success' } } })
  }
}))

vi.mock('../../../src/api/axios', () => ({
  __esModule: true,
  default: {},
  setAccessToken: vi.fn(),
  getAccessToken: vi.fn()
}))

const user = userEvent.setup({ delay: null })

async function pasteInput(input: HTMLElement, value: string) {
  await user.click(input)
  await user.paste(value)
}

async function fillAndSubmitForm() {
  await pasteInput(screen.getByLabelText('First Name'), 'John')
  await pasteInput(screen.getByLabelText('Last Name'), 'Doe')
  await pasteInput(screen.getByLabelText('Apartment'), '4B')
  await pasteInput(screen.getByLabelText('Email'), 'john@test.com')
  await pasteInput(screen.getByLabelText('Password'), 'Password123!')
  await pasteInput(screen.getByLabelText('Confirm Password'), 'Password123!')
  await user.click(screen.getByRole('button', { name: /register/i }))
}

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render all the 6 fields and the register button', () => {
    renderWithProviders(<RegisterForm />)

    expect(screen.getByLabelText('First Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Last Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Apartment')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument()
  })

  it('should show an error alert from store', () => {
    renderWithProviders(<RegisterForm />, {
      preloadedState: {
        auth: { user: null, isAuthenticated: false, loading: false, error: 'Email already exists' }
      }
    })

    expect(screen.getByText('Email already exists')).toBeInTheDocument()
  })

  it('should show a loading state', () => {
    renderWithProviders(<RegisterForm />, {
      preloadedState: {
        auth: { user: null, isAuthenticated: false, loading: true, error: null }
      }
    })

    const button = screen.getByRole('button', { name: /register/i })
    expect(button).toHaveClass('ant-btn-loading')
  })

  it('should show a success result after a successful registration', async () => {
    renderWithProviders(<RegisterForm />)

    await fillAndSubmitForm()

    await waitFor(() => {
      expect(screen.getByText('Registration Successful!')).toBeInTheDocument()
    })
    expect(screen.getByText(/please wait for admin approval/i)).toBeInTheDocument()
  })

  it('should clear the existing error before dispatching the register', async () => {
    const { store } = renderWithProviders(<RegisterForm />, {
      preloadedState: {
        auth: { user: null, isAuthenticated: false, loading: false, error: 'Previous error' }
      }
    })

    expect(screen.getByText('Previous error')).toBeInTheDocument()

    await fillAndSubmitForm()

    await waitFor(() => {
      expect(store.getState().auth.error).toBeNull()
    })
  })

  it('should clear the error when the close button is clicked in the alert', async () => {
    const { store } = renderWithProviders(<RegisterForm />, {
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

  it('should show an error when the password typed is too short', async () => {
    renderWithProviders(<RegisterForm />)

    await user.type(screen.getByLabelText('Password'), 'Test')
    await user.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument()
    })
  })

  it('should show an error when the password does not contain uppercase', async () => {
    renderWithProviders(<RegisterForm />)

    await user.type(screen.getByLabelText('Password'), 'test123')
    await user.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => {
      expect(
        screen.getByText(
          'Must include uppercase, lowercase, a number, and a special character (@$!%*?&)'
        )
      ).toBeInTheDocument()
    })
  })

  it('should show an error when the password tyoed does not contain a special character', async () => {
    renderWithProviders(<RegisterForm />)

    await user.type(screen.getByLabelText('Password'), 'Tester123')
    await user.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => {
      expect(
        screen.getByText(
          'Must include uppercase, lowercase, a number, and a special character (@$!%*?&)'
        )
      ).toBeInTheDocument()
    })
  })

  it('should show an error when the password typed does not contain a number', async () => {
    renderWithProviders(<RegisterForm />)

    await user.type(screen.getByLabelText('Password'), 'TesterJ')
    await user.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => {
      expect(
        screen.getByText(
          'Must include uppercase, lowercase, a number, and a special character (@$!%*?&)'
        )
      ).toBeInTheDocument()
    })
  })

  it('should show an error for password mismatch', async () => {
    renderWithProviders(<RegisterForm />)

    await user.type(screen.getByLabelText('Password'), 'Password123')
    await user.type(screen.getByLabelText('Confirm Password'), 'Different456')
    await user.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
    })
  })

  it('should show all the required field errors', async () => {
    renderWithProviders(<RegisterForm />)

    await user.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => {
      expect(screen.getByText('First name is required')).toBeInTheDocument()
      expect(screen.getByText('Last name is required')).toBeInTheDocument()
      expect(screen.getByText('Apartment is required')).toBeInTheDocument()
      expect(screen.getByText('Please enter a valid email')).toBeInTheDocument()
      expect(screen.getByText('Password is required')).toBeInTheDocument()
      expect(screen.getByText('Please confirm your password')).toBeInTheDocument()
    })
  })

  it('should dispatch the register when a valid submission is made', async () => {
    renderWithProviders(<RegisterForm />)

    await fillAndSubmitForm()

    await waitFor(() => {
      expect(vi.mocked(authApi.register)).toHaveBeenCalled()
    })
  })

  it('should stay on the form when the registration fails', async () => {
    vi.mocked(authApi.register).mockRejectedValueOnce({
      response: { data: { error: 'Email taken' } }
    })

    renderWithProviders(<RegisterForm />)

    await fillAndSubmitForm()

    await waitFor(() => {
      expect(screen.queryByText('Registration Successful!')).not.toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument()
  })
})

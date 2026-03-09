import React from 'react'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
const user = userEvent.setup({ delay: null })
import AppLayout from '../../../src/components/layout/AppLayout'
import {
  renderWithProviders,
  mockAdminUser,
  mockResidentUser
} from '../../helpers/renderWithProviders'
import type { RootState } from '../../../src/store'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Outlet: () => <div data-testid="outlet">outlet</div>
  }
})

const adminState: Partial<RootState> = {
  auth: { user: mockAdminUser, isAuthenticated: true, loading: false, error: null },
  ui: { sidebarCollapsed: false }
}

const residentState: Partial<RootState> = {
  auth: { user: mockResidentUser, isAuthenticated: true, loading: false, error: null },
  ui: { sidebarCollapsed: false }
}

const collapsedState: Partial<RootState> = {
  auth: { user: mockAdminUser, isAuthenticated: true, loading: false, error: null },
  ui: { sidebarCollapsed: true }
}

describe('AppLayout', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  it('should render the app name when the sidebar is expanded', () => {
    renderWithProviders(<AppLayout />, { preloadedState: adminState })
    expect(screen.getByText('iVillaParking')).toBeInTheDocument()
  })

  it('should render an abbreviated name when the sidebar is collapsed', () => {
    renderWithProviders(<AppLayout />, { preloadedState: collapsedState })
    expect(screen.getByText('iVP')).toBeInTheDocument()
  })

  it('should render the admin menu items for an admin user', () => {
    renderWithProviders(<AppLayout />, { preloadedState: adminState })
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Residents')).toBeInTheDocument()
    expect(screen.getByText('Parking Config')).toBeInTheDocument()
    expect(screen.getByText('Raffle')).toBeInTheDocument()
    expect(screen.getByText('Plate Search')).toBeInTheDocument()
    expect(screen.getByText('Import/Export')).toBeInTheDocument()
    expect(screen.getByText('Camera')).toBeInTheDocument()
  })

  it('should render the resident menu items for a resident user', () => {
    renderWithProviders(<AppLayout />, { preloadedState: residentState })
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('My Vehicles')).toBeInTheDocument()
    expect(screen.getByText('Raffle')).toBeInTheDocument()
    expect(screen.getByText('History')).toBeInTheDocument()
    expect(screen.queryByText('Residents')).not.toBeInTheDocument()
    expect(screen.queryByText('Camera')).not.toBeInTheDocument()
  })

  it('should display the formatted user name', () => {
    renderWithProviders(<AppLayout />, { preloadedState: adminState })
    expect(screen.getByText('Admin User')).toBeInTheDocument()
  })

  it('should render the Outlet for child routes', () => {
    renderWithProviders(<AppLayout />, { preloadedState: adminState })
    expect(screen.getByTestId('outlet')).toBeInTheDocument()
  })

  it('should toggle the sidebar in a collapsed state when the button is clicked', async () => {
    const { store } = renderWithProviders(<AppLayout />, { preloadedState: adminState })
    expect(store.getState().ui.sidebarCollapsed).toBe(false)

    const buttons = screen.getAllByRole('button')
    await user.click(buttons[0])

    expect(store.getState().ui.sidebarCollapsed).toBe(true)
  })

  it('should navigate to the menu item', async () => {
    renderWithProviders(<AppLayout />, { preloadedState: adminState, route: '/admin' })

    await user.click(screen.getByText('Residents'))
    expect(mockNavigate).toHaveBeenCalledWith('/admin/residents')
  })

  it('should show the logout option in the user dropdown', async () => {
    renderWithProviders(<AppLayout />, { preloadedState: adminState })

    await user.click(screen.getByText('Admin User'))

    const logoutItem = await screen.findByText('Logout')
    expect(logoutItem).toBeInTheDocument()
  })
})

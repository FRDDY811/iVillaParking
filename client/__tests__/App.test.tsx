import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
import { baseApi } from '../src/store/api'
import authReducer from '../src/store/authSlice'
import uiReducer from '../src/store/uiSlice'
import { UserRole, UserStatus } from '@ivillaparking/shared'
import type { RootState } from '../src/store'
import type { IUser } from '../src/types'

vi.mock('../src/pages/LoginPage', () => ({
  __esModule: true,
  default: () => <div data-testid="login-page">LoginPage</div>
}))
vi.mock('../src/pages/RegisterPage', () => ({
  __esModule: true,
  default: () => <div data-testid="register-page">RegisterPage</div>
}))
vi.mock('../src/pages/AdminDashboard', () => ({
  __esModule: true,
  default: () => <div data-testid="admin-dashboard">AdminDashboard</div>
}))
vi.mock('../src/pages/ResidentDashboard', () => ({
  __esModule: true,
  default: () => <div data-testid="resident-dashboard">ResidentDashboard</div>
}))
vi.mock('../src/pages/NotFoundPage', () => ({
  __esModule: true,
  default: () => <div data-testid="not-found">NotFoundPage</div>
}))
vi.mock('../src/components/admin/ResidentManagement', () => ({
  __esModule: true,
  default: () => <div>ResidentManagement</div>
}))
vi.mock('../src/components/admin/ParkingSpotConfig', () => ({
  __esModule: true,
  default: () => <div>ParkingSpotConfig</div>
}))
vi.mock('../src/components/admin/RaffleControl', () => ({
  __esModule: true,
  default: () => <div>RaffleControl</div>
}))
vi.mock('../src/components/admin/LicensePlateSearch', () => ({
  __esModule: true,
  default: () => <div>LicensePlateSearch</div>
}))
vi.mock('../src/components/admin/ImportExportPanel', () => ({
  __esModule: true,
  default: () => <div>ImportExportPanel</div>
}))
vi.mock('../src/components/admin/CameraPanel', () => ({
  __esModule: true,
  default: () => <div>CameraPanel</div>
}))
vi.mock('../src/components/resident/VehicleList', () => ({
  __esModule: true,
  default: () => <div>VehicleList</div>
}))
vi.mock('../src/components/resident/RaffleRegistration', () => ({
  __esModule: true,
  default: () => <div>RaffleRegistration</div>
}))
vi.mock('../src/components/resident/ParkingHistory', () => ({
  __esModule: true,
  default: () => <div>ParkingHistory</div>
}))

vi.mock('../src/components/layout/AppLayout', async () => {
  const { Outlet } = await import('react-router-dom')
  return {
    __esModule: true,
    default: () => (
      <div data-testid="app-layout">
        <Outlet />
      </div>
    )
  }
})

const mockRefresh = vi.fn()
vi.mock('../src/api/auth', () => ({
  __esModule: true,
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    refresh: (...args: unknown[]) => mockRefresh(...args),
    logout: vi.fn(),
    getMe: vi.fn()
  }
}))

vi.mock('../src/api/axios', () => ({
  __esModule: true,
  default: { get: vi.fn(), post: vi.fn() },
  setAccessToken: vi.fn()
}))

import App from '../src/App'

const adminUser: IUser = {
  id: 'admin-1',
  email: 'admin@test.com',
  firstName: 'Admin',
  lastName: 'User',
  apartment: 'ADMIN',
  role: UserRole.ADMIN,
  status: UserStatus.ACTIVE,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z'
}

const residentUser: IUser = {
  ...adminUser,
  id: 'resident-1',
  role: UserRole.RESIDENT,
  apartment: '4B'
}

const rootReducer = combineReducers({
  auth: authReducer,
  ui: uiReducer,
  [baseApi.reducerPath]: baseApi.reducer
})

function createTestStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer: rootReducer,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({ serializableCheck: false, immutableCheck: false }).concat(
        baseApi.middleware
      ),
    preloadedState
  })
}

function renderApp(preloadedState?: Partial<RootState>, route = '/') {
  window.history.pushState({}, '', route)
  const store = createTestStore(preloadedState)
  return render(
    <Provider store={store}>
      <App />
    </Provider>
  )
}

function mockRefreshSuccess(user: typeof adminUser) {
  mockRefresh.mockResolvedValue({
    data: { data: { accessToken: 'tok', user } }
  })
}

function mockRefreshFailure() {
  mockRefresh.mockRejectedValue(new Error('no session'))
}

describe('App', () => {
  beforeEach(() => {
    mockRefresh.mockReset()
  })

  it('should render the login page at /login', async () => {
    mockRefreshFailure()
    renderApp(undefined, '/login')

    await waitFor(() => {
      expect(screen.getByTestId('login-page')).toBeInTheDocument()
    })
  })

  it('should render the register page at /register', async () => {
    mockRefreshFailure()
    renderApp(undefined, '/register')

    await waitFor(() => {
      expect(screen.getByTestId('register-page')).toBeInTheDocument()
    })
  })

  it('should redirect to unauthenticated users to /login for unknown routes', async () => {
    mockRefreshFailure()
    renderApp(undefined, '/does-not-exist')

    await waitFor(() => {
      expect(screen.getByTestId('login-page')).toBeInTheDocument()
    })
  })

  it('should show the NotFoundPage for authenticated users on unknown routes', async () => {
    mockRefreshSuccess(adminUser)
    renderApp(
      { auth: { user: adminUser, isAuthenticated: true, loading: false, error: null } },
      '/some-random-page'
    )

    await waitFor(() => {
      expect(screen.getByTestId('not-found')).toBeInTheDocument()
    })
  })

  it('should render to admin dashboard for admin users', async () => {
    mockRefreshSuccess(adminUser)
    renderApp(
      { auth: { user: adminUser, isAuthenticated: true, loading: false, error: null } },
      '/admin'
    )

    await waitFor(() => {
      expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument()
    })
  })

  it('should renders to resident dashboard for resident users', async () => {
    mockRefreshSuccess(residentUser)
    renderApp(
      { auth: { user: residentUser, isAuthenticated: true, loading: false, error: null } },
      '/resident'
    )

    await waitFor(() => {
      expect(screen.getByTestId('resident-dashboard')).toBeInTheDocument()
    })
  })

  it('should wrap with ConfigProvider and AntApp', async () => {
    mockRefreshFailure()
    const { container } = renderApp(undefined, '/login')

    await waitFor(() => {
      expect(screen.getByTestId('login-page')).toBeInTheDocument()
    })
    expect(container.querySelector('.ant-app')).toBeInTheDocument()
  })
})

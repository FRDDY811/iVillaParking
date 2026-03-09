import React, { PropsWithChildren } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { baseApi } from '../../src/store/api'
import authReducer from '../../src/store/authSlice'
import uiReducer from '../../src/store/uiSlice'
import type { RootState } from '../../src/store'
import { UserRole, UserStatus, VehicleType, RaffleCycleStatus } from '@ivillaparking/shared'
import type { IUser, IVehicle, IRaffleCycle } from '../../src/types'

export const mockAdminUser: IUser = {
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

export const mockResidentUser: IUser = {
  id: 'resident-1',
  email: 'resident@test.com',
  firstName: 'John',
  lastName: 'Doe',
  apartment: '4B',
  role: UserRole.RESIDENT,
  status: UserStatus.ACTIVE,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z'
}

export const mockVehicle: IVehicle = {
  id: 'vehicle-1',
  licensePlate: 'ABC-1234',
  type: VehicleType.CAR,
  make: 'Toyota',
  model: 'Corolla',
  color: 'Silver',
  userId: 'resident-1',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z'
}

export const mockRaffleCycle: IRaffleCycle = {
  id: 'cycle-1',
  name: 'Q1 2026',
  startDate: '2026-01-01T00:00:00.000Z',
  endDate: '2026-03-31T00:00:00.000Z',
  status: RaffleCycleStatus.OPEN,
  executedAt: null,
  createdAt: '2025-12-01T00:00:00.000Z',
  updatedAt: '2025-12-01T00:00:00.000Z'
}

export function createMockNotify() {
  return {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn()
  }
}

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  preloadedState?: Partial<RootState>
  route?: string
}

const rootReducer = combineReducers({
  auth: authReducer,
  ui: uiReducer,
  [baseApi.reducerPath]: baseApi.reducer
})

export function createTestStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer: rootReducer,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({ serializableCheck: false }).concat(baseApi.middleware),
    preloadedState
  })
}

export function renderWithProviders(
  ui: React.ReactElement,
  { preloadedState, route = '/', ...renderOptions }: ExtendedRenderOptions = {}
) {
  const stateWithAuthDefaults = {
    ...preloadedState,
    auth: {
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,
      ...preloadedState?.auth
    }
  }
  const store = createTestStore(stateWithAuthDefaults)

  function Wrapper({ children }: PropsWithChildren) {
    return (
      <Provider store={store}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </Provider>
    )
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) }
}

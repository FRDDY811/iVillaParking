import React from 'react'
import { screen } from '@testing-library/react'
import { renderWithProviders, mockResidentUser, mockVehicle } from '../helpers/renderWithProviders'
import ResidentDashboard from '../../src/pages/ResidentDashboard'

const mockGetVehiclesQuery = vi.fn()
const mockGetAssignmentHistoryQuery = vi.fn()
const mockGetUserRegistrationsQuery = vi.fn()

vi.mock('../../src/store/api/vehiclesApi', () => ({
  useGetVehiclesQuery: () => mockGetVehiclesQuery()
}))

vi.mock('../../src/store/api/parkingSpotsApi', () => ({
  useGetAssignmentHistoryQuery: () => mockGetAssignmentHistoryQuery()
}))

vi.mock('../../src/store/api/raffleApi', () => ({
  useGetUserRegistrationsQuery: () => mockGetUserRegistrationsQuery()
}))

const residentAuthState = {
  auth: { user: mockResidentUser, isAuthenticated: true, loading: false, error: null }
}

describe('ResidentDashboard', () => {
  beforeEach(() => {
    mockGetVehiclesQuery.mockReturnValue({ data: [] })
    mockGetAssignmentHistoryQuery.mockReturnValue({ data: [] })
    mockGetUserRegistrationsQuery.mockReturnValue({ data: [] })
  })

  it('should show the welcome message with the user name', () => {
    renderWithProviders(<ResidentDashboard />, {
      preloadedState: residentAuthState
    })

    expect(screen.getByText(/welcome, john/i)).toBeInTheDocument()
  })

  it('should show the correct vehicle/registration/assignment counts', () => {
    mockGetVehiclesQuery.mockReturnValue({ data: [mockVehicle, { ...mockVehicle, id: 'v2' }] })
    mockGetAssignmentHistoryQuery.mockReturnValue({
      data: [{ id: 'a1' }, { id: 'a2' }, { id: 'a3' }]
    })
    mockGetUserRegistrationsQuery.mockReturnValue({ data: [{ id: 'r1' }] })

    renderWithProviders(<ResidentDashboard />, {
      preloadedState: residentAuthState
    })

    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('should show an empty state when there is not an assignment', () => {
    renderWithProviders(<ResidentDashboard />, {
      preloadedState: residentAuthState
    })

    expect(screen.getByText(/no current parking assignment/i)).toBeInTheDocument()
  })

  it('should show an assignment details when is available', () => {
    const assignment = {
      id: 'a1',
      userId: 'resident-1',
      vehicleId: 'v1',
      raffleCycleId: 'c1',
      spotNumber: 42,
      vehicleType: 'CAR',
      tier: 1,
      raffleCycle: {
        name: 'Q1 2026',
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-03-31T00:00:00.000Z'
      },
      createdAt: '2026-01-01T00:00:00.000Z'
    }

    mockGetAssignmentHistoryQuery.mockReturnValue({ data: [assignment] })

    renderWithProviders(<ResidentDashboard />, {
      preloadedState: residentAuthState
    })

    expect(screen.getByText(/spot #42/i)).toBeInTheDocument()
  })
})

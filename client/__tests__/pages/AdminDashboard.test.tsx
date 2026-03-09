import React from 'react'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../helpers/renderWithProviders'
import AdminDashboard from '../../src/pages/AdminDashboard'

const mockGetUsersQuery = vi.fn()
const mockGetPendingUsersQuery = vi.fn()
const mockGetParkingConfigQuery = vi.fn()
const mockGetCurrentAssignmentsQuery = vi.fn()
const mockGetCyclesQuery = vi.fn()

vi.mock('../../src/store/api/usersApi', () => ({
  useGetUsersQuery: () => mockGetUsersQuery(),
  useGetPendingUsersQuery: () => mockGetPendingUsersQuery()
}))

vi.mock('../../src/store/api/parkingSpotsApi', () => ({
  useGetParkingConfigQuery: () => mockGetParkingConfigQuery(),
  useGetCurrentAssignmentsQuery: () => mockGetCurrentAssignmentsQuery()
}))

vi.mock('../../src/store/api/raffleApi', () => ({
  useGetCyclesQuery: () => mockGetCyclesQuery()
}))

describe('AdminDashboard', () => {
  beforeEach(() => {
    mockGetUsersQuery.mockReturnValue({ data: { data: [], total: 0 } })
    mockGetPendingUsersQuery.mockReturnValue({ data: [] })
    mockGetParkingConfigQuery.mockReturnValue({ data: [] })
    mockGetCurrentAssignmentsQuery.mockReturnValue({ data: [] })
    mockGetCyclesQuery.mockReturnValue({ data: [] })
  })

  it('should render the title', () => {
    renderWithProviders(<AdminDashboard />)
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
  })

  it('should display the correct statistics', () => {
    mockGetUsersQuery.mockReturnValue({ data: { data: [], total: 25 } })
    mockGetPendingUsersQuery.mockReturnValue({ data: [{ id: 'p1' }, { id: 'p2' }] })
    mockGetParkingConfigQuery.mockReturnValue({
      data: [
        { id: 'c1', vehicleType: 'CAR', totalSpots: 10, effectiveFrom: '', createdAt: '' },
        { id: 'c2', vehicleType: 'MOTORCYCLE', totalSpots: 5, effectiveFrom: '', createdAt: '' }
      ]
    })
    mockGetCurrentAssignmentsQuery.mockReturnValue({ data: [{ id: 'a1' }] })
    mockGetCyclesQuery.mockReturnValue({ data: [{ id: 'cy1', status: 'OPEN' }] })

    renderWithProviders(<AdminDashboard />)

    expect(screen.getByText('Total Residents')).toBeInTheDocument()
    expect(screen.getByText('Pending Approvals')).toBeInTheDocument()
    expect(screen.getByText('Total Parking Spots')).toBeInTheDocument()
    expect(screen.getByText('Active Raffle Cycles')).toBeInTheDocument()

    expect(screen.getByText('25')).toBeInTheDocument()
    expect(screen.getByText('15')).toBeInTheDocument()
    expect(screen.getAllByText('1')).toHaveLength(2)
  })

  it('should render the parking config breakdown', () => {
    mockGetParkingConfigQuery.mockReturnValue({
      data: [{ id: 'c1', vehicleType: 'CAR', totalSpots: 10, effectiveFrom: '', createdAt: '' }]
    })

    renderWithProviders(<AdminDashboard />)

    expect(screen.getByText('CAR')).toBeInTheDocument()
    expect(screen.getByText('10 spots')).toBeInTheDocument()
  })
})

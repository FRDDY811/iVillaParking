import React from 'react'
import { screen } from '@testing-library/react'
import ParkingHistory from '../../../src/components/resident/ParkingHistory'
import { renderWithProviders } from '../../helpers/renderWithProviders'

const mockGetAssignmentHistoryQuery = vi.fn()

vi.mock('../../../src/store/api/parkingSpotsApi', () => ({
  useGetAssignmentHistoryQuery: () => mockGetAssignmentHistoryQuery()
}))

const mockAssignment = {
  id: 'assign-1',
  userId: 'user-1',
  vehicleId: 'vehicle-1',
  raffleCycleId: 'cycle-1',
  spotNumber: 12,
  vehicleType: 'CAR',
  tier: 1,
  vehicle: { id: 'vehicle-1', licensePlate: 'ABC-1234' },
  raffleCycle: {
    id: 'cycle-1',
    name: 'Q1 2026',
    startDate: '2026-01-01T00:00:00.000Z',
    endDate: '2026-03-31T00:00:00.000Z'
  }
}

const mockAssignmentNoRelations = {
  id: 'assign-2',
  userId: 'user-1',
  vehicleId: 'vehicle-2',
  raffleCycleId: 'cycle-2',
  spotNumber: 5,
  vehicleType: 'MOTORCYCLE',
  tier: 3,
  vehicle: null,
  raffleCycle: null
}

describe('ParkingHistory', () => {
  beforeEach(() => {
    mockGetAssignmentHistoryQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null
    })
  })

  it('should render the card title', () => {
    renderWithProviders(<ParkingHistory />)
    expect(screen.getByText('My Parking Assignment History')).toBeInTheDocument()
  })

  it('should render the table with assignment data', () => {
    mockGetAssignmentHistoryQuery.mockReturnValue({
      data: [mockAssignment],
      isLoading: false,
      isError: false,
      error: null
    })

    renderWithProviders(<ParkingHistory />)

    expect(screen.getByText('Q1 2026')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('Car')).toBeInTheDocument()
    expect(screen.getByText('Tier 1')).toBeInTheDocument()
    expect(screen.getByText('ABC-1234')).toBeInTheDocument()
  })

  it('should render the period from a raffle cycle dates', () => {
    mockGetAssignmentHistoryQuery.mockReturnValue({
      data: [mockAssignment],
      isLoading: false,
      isError: false,
      error: null
    })

    renderWithProviders(<ParkingHistory />)

    const cells = screen.getAllByRole('cell')
    const periodCell = cells.find(cell => cell.textContent?.includes('2026'))
    expect(periodCell).toBeDefined()
  })

  it('should show dash when the raffleCycle is missing', () => {
    mockGetAssignmentHistoryQuery.mockReturnValue({
      data: [mockAssignmentNoRelations],
      isLoading: false,
      isError: false,
      error: null
    })

    renderWithProviders(<ParkingHistory />)

    const dashes = screen.getAllByText('-')
    expect(dashes.length).toBeGreaterThanOrEqual(3)
  })

  it('should show an error alert when the query fails', () => {
    mockGetAssignmentHistoryQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: true,
      error: { data: { message: 'Network error' } }
    })

    renderWithProviders(<ParkingHistory />)

    expect(screen.getByText('Failed to load assignment history')).toBeInTheDocument()
    expect(screen.getByText('Network error')).toBeInTheDocument()
  })

  it('should show a loading state', () => {
    mockGetAssignmentHistoryQuery.mockReturnValue({
      data: [],
      isLoading: true,
      isError: false,
      error: null
    })

    renderWithProviders(<ParkingHistory />)

    expect(document.querySelector('.ant-spin')).toBeInTheDocument()
  })
})

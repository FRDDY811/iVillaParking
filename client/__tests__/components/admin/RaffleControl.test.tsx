import React from 'react'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  renderWithProviders,
  mockRaffleCycle,
  createMockNotify
} from '../../helpers/renderWithProviders'
import RaffleControl from '../../../src/components/admin/RaffleControl'

const mockGetCyclesQuery = vi.fn()
const mockCreateCycleMutation = vi.fn()
const mockUpdateCycleMutation = vi.fn()
const mockExecuteRaffleMutation = vi.fn()
const mockLazyGetCycleById = vi.fn()
const mockLazyGetResults = vi.fn()

const user = userEvent.setup({ delay: null })

vi.mock('../../../src/store/api/raffleApi', () => ({
  useGetCyclesQuery: () => mockGetCyclesQuery(),
  useCreateCycleMutation: () => [mockCreateCycleMutation, { isLoading: false }],
  useUpdateCycleMutation: () => [mockUpdateCycleMutation, { isLoading: false }],
  useExecuteRaffleMutation: () => [mockExecuteRaffleMutation, { isLoading: false }],
  useLazyGetCycleByIdQuery: () => [mockLazyGetCycleById],
  useLazyGetResultsQuery: () => [mockLazyGetResults, { data: [], isFetching: false }]
}))

const mockNotify = createMockNotify()

vi.mock('../../../src/hooks/useNotification', () => ({
  useNotification: () => mockNotify
}))

const completedCycle = {
  ...mockRaffleCycle,
  id: 'cycle-2',
  name: 'Q4 2025',
  status: 'COMPLETED',
  _count: { registrations: 5, parkingAssignments: 3 }
}

const pendingCycle = {
  ...mockRaffleCycle,
  id: 'cycle-3',
  name: 'Pending Cycle',
  status: 'PENDING',
  _count: { registrations: 0, parkingAssignments: 0 }
}

const closedCycle = {
  ...mockRaffleCycle,
  id: 'cycle-4',
  name: 'Closed Cycle',
  status: 'CLOSED',
  _count: { registrations: 8, parkingAssignments: 0 }
}

describe('RaffleControl', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUpdateCycleMutation.mockReturnValue({ unwrap: () => Promise.resolve({}) })
    mockExecuteRaffleMutation.mockReturnValue({ unwrap: () => Promise.resolve({}) })
    mockLazyGetCycleById.mockReturnValue({ unwrap: () => Promise.resolve(completedCycle) })
    mockGetCyclesQuery.mockReturnValue({
      data: [{ ...mockRaffleCycle, _count: { registrations: 10, parkingAssignments: 0 } }],
      isLoading: false,
      isError: false,
      error: null
    })
  })

  it('should render the cycles table with data', () => {
    renderWithProviders(<RaffleControl />)
    expect(screen.getByText('Raffle Cycles')).toBeInTheDocument()
    expect(screen.getByText('Q1 2026')).toBeInTheDocument()
  })

  it('should render the "New Cycle" button', () => {
    renderWithProviders(<RaffleControl />)
    expect(screen.getByRole('button', { name: /new cycle/i })).toBeInTheDocument()
  })

  it('should open the create modal', async () => {
    renderWithProviders(<RaffleControl />)
    await user.click(screen.getByRole('button', { name: /new cycle/i }))
    expect(screen.getByText('Create Raffle Cycle')).toBeInTheDocument()
  })

  it('should show the Close button for OPEN cycle', () => {
    renderWithProviders(<RaffleControl />)
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
  })

  it('should show the View Results button for COMPLETED cycle', () => {
    mockGetCyclesQuery.mockReturnValue({
      data: [completedCycle],
      isLoading: false,
      isError: false,
      error: null
    })
    renderWithProviders(<RaffleControl />)
    expect(screen.getByRole('button', { name: /view results/i })).toBeInTheDocument()
  })

  it('should show an error alert on query failure', () => {
    mockGetCyclesQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: true,
      error: { data: 'Failed to load' }
    })
    renderWithProviders(<RaffleControl />)
    expect(screen.getByText('Failed to load raffle cycles')).toBeInTheDocument()
  })

  it('should call the updateCycle with CLOSED status when the Close button is clicked', async () => {
    renderWithProviders(<RaffleControl />)
    await user.click(screen.getByRole('button', { name: /close/i }))
    expect(mockUpdateCycleMutation).toHaveBeenCalledWith({
      id: 'cycle-1',
      data: { status: 'CLOSED' }
    })
    expect(mockNotify.success).toHaveBeenCalledWith('Cycle status updated to CLOSED')
  })

  it('should show the Open button for PENDING cycle', () => {
    mockGetCyclesQuery.mockReturnValue({
      data: [pendingCycle],
      isLoading: false,
      isError: false,
      error: null
    })
    renderWithProviders(<RaffleControl />)
    expect(screen.getByRole('button', { name: /open/i })).toBeInTheDocument()
  })

  it('should call the updateCycle with OPEN status when the Open button is clicked', async () => {
    mockGetCyclesQuery.mockReturnValue({
      data: [pendingCycle],
      isLoading: false,
      isError: false,
      error: null
    })
    renderWithProviders(<RaffleControl />)
    await user.click(screen.getByRole('button', { name: /open/i }))
    expect(mockUpdateCycleMutation).toHaveBeenCalledWith({
      id: 'cycle-3',
      data: { status: 'OPEN' }
    })
    expect(mockNotify.success).toHaveBeenCalledWith('Cycle status updated to OPEN')
  })

  it('should show the Execute button for CLOSED cycle with Popconfirm', async () => {
    mockGetCyclesQuery.mockReturnValue({
      data: [closedCycle],
      isLoading: false,
      isError: false,
      error: null
    })
    renderWithProviders(<RaffleControl />)
    expect(screen.getByRole('button', { name: /execute/i })).toBeInTheDocument()
  })

  it('should show an error notification when the status change fails', async () => {
    mockUpdateCycleMutation.mockReturnValue({
      unwrap: () => Promise.reject({ data: { message: 'Status change failed' } })
    })
    renderWithProviders(<RaffleControl />)
    await user.click(screen.getByRole('button', { name: /close/i }))
    expect(mockNotify.error).toHaveBeenCalledWith('Status change failed')
  })

  it('should open the results modal and loads data when the View Results button is clicked', async () => {
    mockGetCyclesQuery.mockReturnValue({
      data: [completedCycle],
      isLoading: false,
      isError: false,
      error: null
    })
    renderWithProviders(<RaffleControl />)
    await user.click(screen.getByRole('button', { name: /view results/i }))
    expect(mockLazyGetCycleById).toHaveBeenCalledWith('cycle-2')
    expect(mockLazyGetResults).toHaveBeenCalledWith('cycle-2')
  })
})

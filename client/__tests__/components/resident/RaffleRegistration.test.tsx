import React from 'react'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
const user = userEvent.setup({ delay: null })
import {
  renderWithProviders,
  mockRaffleCycle,
  mockVehicle,
  createMockNotify
} from '../../helpers/renderWithProviders'
import RaffleRegistration from '../../../src/components/resident/RaffleRegistration'

const mockGetCyclesQuery = vi.fn()
const mockGetVehiclesQuery = vi.fn()
const mockGetUserRegistrationsQuery = vi.fn()
const mockRegisterMutation = vi.fn()
const mockUnregisterMutation = vi.fn()

const mockNotify = createMockNotify()

vi.mock('../../../src/store/api/raffleApi', () => ({
  useGetCyclesQuery: () => mockGetCyclesQuery(),
  useGetUserRegistrationsQuery: () => mockGetUserRegistrationsQuery(),
  useRegisterForRaffleMutation: () => [mockRegisterMutation, { isLoading: false }],
  useUnregisterFromRaffleMutation: () => [mockUnregisterMutation, { isLoading: false }]
}))

vi.mock('../../../src/store/api/vehiclesApi', () => ({
  useGetVehiclesQuery: () => mockGetVehiclesQuery()
}))

vi.mock('../../../src/hooks/useNotification', () => ({
  useNotification: () => mockNotify
}))

const openCycle = { ...mockRaffleCycle, status: 'OPEN' }
const completedCycle = { ...mockRaffleCycle, id: 'cycle-2', name: 'Q4 2025', status: 'COMPLETED' }

const mockRegistration = {
  id: 'reg-1',
  userId: 'user-1',
  vehicleId: 'vehicle-1',
  raffleCycleId: 'cycle-1',
  raffleCycle: openCycle,
  vehicle: mockVehicle,
  createdAt: '2026-01-15T00:00:00.000Z'
}

const completedRegistration = {
  ...mockRegistration,
  id: 'reg-2',
  raffleCycleId: 'cycle-2',
  raffleCycle: completedCycle
}

describe('RaffleRegistration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetCyclesQuery.mockReturnValue({ data: [], isLoading: false, isError: false, error: null })
    mockGetVehiclesQuery.mockReturnValue({ data: [], isLoading: false })
    mockGetUserRegistrationsQuery.mockReturnValue({ data: [], isLoading: false })
    mockRegisterMutation.mockReturnValue({ unwrap: () => Promise.resolve({}) })
    mockUnregisterMutation.mockReturnValue({ unwrap: () => Promise.resolve({}) })
  })

  it('should show an empty state when there are no open cycles', () => {
    renderWithProviders(<RaffleRegistration />)
    expect(screen.getByText(/no raffle cycles are currently open/i)).toBeInTheDocument()
  })

  it('renders open cycles with register button and vehicle select', () => {
    mockGetCyclesQuery.mockReturnValue({
      data: [openCycle],
      isLoading: false,
      isError: false,
      error: null
    })
    mockGetVehiclesQuery.mockReturnValue({ data: [mockVehicle], isLoading: false })

    renderWithProviders(<RaffleRegistration />)

    expect(screen.getByText('Q1 2026')).toBeInTheDocument()
    expect(screen.getByText('OPEN')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument()
  })

  it('should filter out the non-OPEN cycles from the open cycles section', () => {
    mockGetCyclesQuery.mockReturnValue({
      data: [completedCycle],
      isLoading: false,
      isError: false,
      error: null
    })

    renderWithProviders(<RaffleRegistration />)

    expect(screen.getByText(/no raffle cycles are currently open/i)).toBeInTheDocument()
  })

  it('should show an error alert when the query fails', () => {
    mockGetCyclesQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: true,
      error: { data: { message: 'Network error' } }
    })

    renderWithProviders(<RaffleRegistration />)

    expect(screen.getByText('Failed to load raffle data')).toBeInTheDocument()
    expect(screen.getByText('Network error')).toBeInTheDocument()
  })

  it('should disable the register button when no vehicle is selected', async () => {
    mockGetCyclesQuery.mockReturnValue({
      data: [openCycle],
      isLoading: false,
      isError: false,
      error: null
    })
    mockGetVehiclesQuery.mockReturnValue({ data: [mockVehicle], isLoading: false })

    renderWithProviders(<RaffleRegistration />)

    const registerButton = screen.getByRole('button', { name: /register/i })
    expect(registerButton).toBeDisabled()
    expect(mockRegisterMutation).not.toHaveBeenCalled()
  })

  it('should register successfully after selecting a vehicle', async () => {
    mockGetCyclesQuery.mockReturnValue({
      data: [openCycle],
      isLoading: false,
      isError: false,
      error: null
    })
    mockGetVehiclesQuery.mockReturnValue({ data: [mockVehicle], isLoading: false })

    renderWithProviders(<RaffleRegistration />)

    const select = screen.getByRole('combobox', { name: /select vehicle/i })
    await user.click(select)

    const option = await screen.findByText(`${mockVehicle.licensePlate} (Car)`)
    await user.click(option)

    await user.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => {
      expect(mockRegisterMutation).toHaveBeenCalledWith({
        cycleId: openCycle.id,
        vehicleId: mockVehicle.id
      })
      expect(mockNotify.success).toHaveBeenCalledWith('Registered for raffle')
    })
  })

  it('should show an error notification when the registration fails', async () => {
    mockRegisterMutation.mockReturnValue({
      unwrap: () => Promise.reject({ data: { message: 'Already registered' } })
    })
    mockGetCyclesQuery.mockReturnValue({
      data: [openCycle],
      isLoading: false,
      isError: false,
      error: null
    })
    mockGetVehiclesQuery.mockReturnValue({ data: [mockVehicle], isLoading: false })

    renderWithProviders(<RaffleRegistration />)

    await user.click(screen.getByRole('combobox', { name: /select vehicle/i }))
    await user.click(await screen.findByText(`${mockVehicle.licensePlate} (Car)`))

    await user.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => {
      expect(mockNotify.error).toHaveBeenCalledWith('Already registered')
    })
  })

  it('should render a registrations table with Unregister button for OPEN cycles', () => {
    mockGetCyclesQuery.mockReturnValue({
      data: [openCycle],
      isLoading: false,
      isError: false,
      error: null
    })
    mockGetVehiclesQuery.mockReturnValue({ data: [mockVehicle], isLoading: false })
    mockGetUserRegistrationsQuery.mockReturnValue({ data: [mockRegistration], isLoading: false })

    renderWithProviders(<RaffleRegistration />)

    expect(screen.getByText('My Registrations')).toBeInTheDocument()
    expect(screen.getAllByText('Q1 2026')).toHaveLength(2)
    expect(screen.getByText(`${mockVehicle.licensePlate} (Car)`)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /unregister/i })).toBeInTheDocument()
  })

  it('should not show the Unregister button for COMPLETED cycle registrations', () => {
    mockGetCyclesQuery.mockReturnValue({ data: [], isLoading: false, isError: false, error: null })
    mockGetUserRegistrationsQuery.mockReturnValue({
      data: [completedRegistration],
      isLoading: false
    })

    renderWithProviders(<RaffleRegistration />)

    expect(screen.queryByRole('button', { name: /unregister/i })).not.toBeInTheDocument()
  })

  it('should call the unregister on Unregister button click', async () => {
    mockGetCyclesQuery.mockReturnValue({
      data: [openCycle],
      isLoading: false,
      isError: false,
      error: null
    })
    mockGetVehiclesQuery.mockReturnValue({ data: [mockVehicle], isLoading: false })
    mockGetUserRegistrationsQuery.mockReturnValue({ data: [mockRegistration], isLoading: false })

    renderWithProviders(<RaffleRegistration />)

    await user.click(screen.getByRole('button', { name: /unregister/i }))

    await waitFor(() => {
      expect(mockUnregisterMutation).toHaveBeenCalledWith({
        cycleId: mockRegistration.raffleCycleId,
        vehicleId: mockRegistration.vehicleId
      })
      expect(mockNotify.success).toHaveBeenCalledWith('Unregistered from raffle')
    })
  })

  it('should show an error notification when the unregister fails', async () => {
    mockUnregisterMutation.mockReturnValue({
      unwrap: () => Promise.reject({ data: { message: 'Unregister failed' } })
    })
    mockGetCyclesQuery.mockReturnValue({
      data: [openCycle],
      isLoading: false,
      isError: false,
      error: null
    })
    mockGetVehiclesQuery.mockReturnValue({ data: [mockVehicle], isLoading: false })
    mockGetUserRegistrationsQuery.mockReturnValue({ data: [mockRegistration], isLoading: false })

    renderWithProviders(<RaffleRegistration />)

    await user.click(screen.getByRole('button', { name: /unregister/i }))

    await waitFor(() => {
      expect(mockNotify.error).toHaveBeenCalledWith('Unregister failed')
    })
  })
})

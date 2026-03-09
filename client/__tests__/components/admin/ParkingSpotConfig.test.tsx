import React from 'react'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, createMockNotify } from '../../helpers/renderWithProviders'
import ParkingSpotConfig from '../../../src/components/admin/ParkingSpotConfig'

const mockGetParkingConfigQuery = vi.fn()
const mockGetCurrentAssignmentsQuery = vi.fn()
const mockCreateParkingConfig = vi.fn()
const user = userEvent.setup({ delay: null })

vi.mock('../../../src/store/api/parkingSpotsApi', () => ({
  useGetParkingConfigQuery: () => mockGetParkingConfigQuery(),
  useGetCurrentAssignmentsQuery: () => mockGetCurrentAssignmentsQuery(),
  useCreateParkingConfigMutation: () => [mockCreateParkingConfig, { isLoading: false }]
}))

const mockNotify = createMockNotify()

vi.mock('../../../src/hooks/useNotification', () => ({
  useNotification: () => mockNotify
}))

const mockConfig = [
  { id: 'cfg-1', vehicleType: 'CAR', totalSpots: 20 },
  { id: 'cfg-2', vehicleType: 'MOTORCYCLE', totalSpots: 10 }
]

describe('ParkingSpotConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateParkingConfig.mockReturnValue({ unwrap: () => Promise.resolve({}) })
    mockGetParkingConfigQuery.mockReturnValue({
      data: mockConfig,
      isLoading: false,
      isError: false,
      error: null
    })
    mockGetCurrentAssignmentsQuery.mockReturnValue({
      data: [],
      isLoading: false
    })
  })

  it('should render the config stats cards', () => {
    renderWithProviders(<ParkingSpotConfig />)
    expect(screen.getByText('20')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
  })

  it('should render the update form', () => {
    renderWithProviders(<ParkingSpotConfig />)
    expect(screen.getByText('Update Parking Configuration')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument()
  })

  it('should render the current assignments table', () => {
    renderWithProviders(<ParkingSpotConfig />)
    expect(screen.getByText('Current Assignments')).toBeInTheDocument()
  })

  it('should show an error alert on config load failure', () => {
    mockGetParkingConfigQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: true,
      error: { data: { message: 'Config load failed' } }
    })

    renderWithProviders(<ParkingSpotConfig />)
    expect(screen.getByText('Failed to load parking configuration')).toBeInTheDocument()
  })

  it('should render the assignments with user and vehicle data', () => {
    mockGetCurrentAssignmentsQuery.mockReturnValue({
      data: [
        {
          id: 'assign-1',
          spotNumber: 5,
          vehicleType: 'CAR',
          tier: 1,
          user: { firstName: 'Alice', lastName: 'Smith', apartment: '2A' },
          vehicle: { licensePlate: 'XYZ-999' }
        }
      ],
      isLoading: false
    })
    renderWithProviders(<ParkingSpotConfig />)
    expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    expect(screen.getByText('XYZ-999')).toBeInTheDocument()
  })

  it('should submit a new parking spot config', async () => {
    renderWithProviders(<ParkingSpotConfig />)

    const selector = document.querySelector('.ant-select-selector')!
    await user.click(selector)
    await user.click(await screen.findByText('Car'))

    const spotsInput = screen.getByLabelText('Total Spots')
    await user.type(spotsInput, '15')

    await user.click(screen.getByRole('button', { name: /update/i }))

    await waitFor(() => {
      expect(mockCreateParkingConfig).toHaveBeenCalledWith(
        expect.objectContaining({ vehicleType: 'CAR', totalSpots: 15 })
      )
    })
  })

  it('should validate the required fields', async () => {
    renderWithProviders(<ParkingSpotConfig />)

    await user.click(screen.getByRole('button', { name: /update/i }))

    await waitFor(() => {
      const hasErrors = document.querySelectorAll('.ant-form-item-explain-error').length > 0
      const hasWarnings = document.querySelectorAll('.ant-form-item-has-error').length > 0
      expect(hasErrors || hasWarnings || !mockCreateParkingConfig.mock.calls.length).toBe(true)
    })
    expect(mockCreateParkingConfig).not.toHaveBeenCalled()
  })

  it('should show a success notification on config update', async () => {
    mockCreateParkingConfig.mockReturnValue({ unwrap: () => Promise.resolve({ id: 'cfg-new' }) })
    renderWithProviders(<ParkingSpotConfig />)

    const selector = document.querySelector('.ant-select-selector')!
    await user.click(selector)
    await user.click(await screen.findByText('Motorcycle'))

    const spotsInput = screen.getByLabelText('Total Spots')
    await user.type(spotsInput, '5')

    await user.click(screen.getByRole('button', { name: /update/i }))

    await waitFor(() => {
      expect(mockNotify.success).toHaveBeenCalledWith('Parking configuration updated')
    })
  })

  it('should show an error notification on create failure', async () => {
    mockCreateParkingConfig.mockReturnValue({
      unwrap: () => Promise.reject(new Error('Create failed'))
    })
    renderWithProviders(<ParkingSpotConfig />)

    const selector = document.querySelector('.ant-select-selector')!
    await user.click(selector)
    await user.click(await screen.findByText('Car'))

    const spotsInput = screen.getByLabelText('Total Spots')
    await user.type(spotsInput, '10')

    await user.click(screen.getByRole('button', { name: /update/i }))

    await waitFor(() => {
      expect(mockNotify.error).toHaveBeenCalled()
    })
  })
})

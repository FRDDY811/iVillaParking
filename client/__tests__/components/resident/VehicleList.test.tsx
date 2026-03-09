import React from 'react'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  renderWithProviders,
  mockVehicle,
  createMockNotify
} from '../../helpers/renderWithProviders'
import VehicleList from '../../../src/components/resident/VehicleList'

const mockGetVehiclesQuery = vi.fn()
const mockCreateVehicle = vi.fn()
const mockUpdateVehicle = vi.fn()
const mockDeleteVehicle = vi.fn()

vi.mock('../../../src/store/api/vehiclesApi', () => ({
  useGetVehiclesQuery: () => mockGetVehiclesQuery(),
  useCreateVehicleMutation: () => [
    (data: unknown) => ({ unwrap: () => mockCreateVehicle(data) }),
    { isLoading: false }
  ],
  useUpdateVehicleMutation: () => [
    (data: unknown) => ({ unwrap: () => mockUpdateVehicle(data) }),
    { isLoading: false }
  ],
  useDeleteVehicleMutation: () => [
    (id: string) => ({ unwrap: () => mockDeleteVehicle(id) }),
    { isLoading: false }
  ]
}))

const user = userEvent.setup({ delay: null })

const mockNotify = createMockNotify()

vi.mock('../../../src/hooks/useNotification', () => ({
  useNotification: () => mockNotify
}))

const secondVehicle = {
  ...mockVehicle,
  id: 'vehicle-2',
  licensePlate: 'XYZ-5678',
  make: 'Honda',
  model: 'Civic',
  color: 'Blue'
}

async function pasteInput(input: HTMLElement, value: string) {
  await user.click(input)
  await user.paste(value)
}

async function selectOption(text: string) {
  const selector = document.querySelector('.ant-modal .ant-select-selector')!
  await user.click(selector)
  await user.click(await screen.findByText(text))
}

describe('VehicleList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetVehiclesQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: undefined
    })
    mockCreateVehicle.mockResolvedValue({ id: 'v-new' })
    mockUpdateVehicle.mockResolvedValue({ id: 'vehicle-1' })
    mockDeleteVehicle.mockResolvedValue(undefined)
  })

  it('should render the title and "Add Vehicle" button', () => {
    renderWithProviders(<VehicleList />)

    expect(screen.getByText('My Vehicles')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add vehicle/i })).toBeInTheDocument()
  })

  it('should display vehicles in the table', () => {
    mockGetVehiclesQuery.mockReturnValue({
      data: [mockVehicle],
      isLoading: false,
      isError: false,
      error: undefined
    })

    renderWithProviders(<VehicleList />)

    expect(screen.getByText('ABC-1234')).toBeInTheDocument()
    expect(screen.getByText('Toyota')).toBeInTheDocument()
    expect(screen.getByText('Corolla')).toBeInTheDocument()
  })

  it('should show a loading state', () => {
    mockGetVehiclesQuery.mockReturnValue({
      data: [],
      isLoading: true,
      isError: false,
      error: undefined
    })

    renderWithProviders(<VehicleList />)

    expect(document.querySelector('.ant-spin')).toBeInTheDocument()
  })

  it('should render vehicle cards with the correct data', () => {
    mockGetVehiclesQuery.mockReturnValue({
      data: [mockVehicle, secondVehicle],
      isLoading: false,
      isError: false,
      error: undefined
    })

    renderWithProviders(<VehicleList />)

    expect(screen.getByText('ABC-1234')).toBeInTheDocument()
    expect(screen.getByText('Toyota')).toBeInTheDocument()
    expect(screen.getByText('Corolla')).toBeInTheDocument()
    expect(screen.getByText('Silver')).toBeInTheDocument()
    expect(screen.getByText('XYZ-5678')).toBeInTheDocument()
    expect(screen.getByText('Honda')).toBeInTheDocument()
    expect(screen.getByText('Civic')).toBeInTheDocument()
    expect(screen.getByText('Blue')).toBeInTheDocument()
  })

  it('should open the add modal when the "Add Vehicle" is clicked', async () => {
    renderWithProviders(<VehicleList />)

    await user.click(screen.getByRole('button', { name: /add vehicle/i }))

    const modalTitle = screen.getByText('Add Vehicle', { selector: '.ant-modal-title' })
    expect(modalTitle).toBeInTheDocument()
    expect(screen.getByLabelText('License Plate')).toBeInTheDocument()
    expect(screen.getByLabelText('Make')).toBeInTheDocument()
    expect(screen.getByLabelText('Model')).toBeInTheDocument()
    expect(screen.getByLabelText('Color')).toBeInTheDocument()
  })

  it('should submit a new vehicle form', async () => {
    renderWithProviders(<VehicleList />)

    await user.click(screen.getByRole('button', { name: /add vehicle/i }))

    await pasteInput(screen.getByLabelText('License Plate'), 'NEW-1234')
    await selectOption('Car')
    await pasteInput(screen.getByLabelText('Make'), 'Ford')
    await pasteInput(screen.getByLabelText('Model'), 'Focus')
    await pasteInput(screen.getByLabelText('Color'), 'Red')

    await user.click(screen.getByRole('button', { name: /^add$/i }))

    await waitFor(() => {
      expect(mockCreateVehicle).toHaveBeenCalledWith(
        expect.objectContaining({
          licensePlate: 'NEW-1234',
          make: 'Ford',
          model: 'Focus',
          color: 'Red'
        })
      )
    })
  })

  it('should open the edit modal with pre-filled data', async () => {
    mockGetVehiclesQuery.mockReturnValue({
      data: [mockVehicle],
      isLoading: false,
      isError: false,
      error: undefined
    })

    renderWithProviders(<VehicleList />)

    await user.click(screen.getByRole('button', { name: /edit vehicle/i }))

    expect(screen.getByText('Edit Vehicle', { selector: '.ant-modal-title' })).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByLabelText('License Plate')).toHaveValue('ABC-1234')
    })
    expect(screen.getByLabelText('Make')).toHaveValue('Toyota')
    expect(screen.getByLabelText('Model')).toHaveValue('Corolla')
    expect(screen.getByLabelText('Color')).toHaveValue('Silver')
  })

  it('should submit an updated vehicle', async () => {
    mockGetVehiclesQuery.mockReturnValue({
      data: [mockVehicle],
      isLoading: false,
      isError: false,
      error: undefined
    })

    renderWithProviders(<VehicleList />)

    await user.click(screen.getByRole('button', { name: /edit vehicle/i }))

    await waitFor(() => {
      expect(screen.getByLabelText('Make')).toHaveValue('Toyota')
    })

    await user.clear(screen.getByLabelText('Make'))
    await user.paste('Lexus')

    await user.click(screen.getByRole('button', { name: /update/i }))

    await waitFor(() => {
      expect(mockUpdateVehicle).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'vehicle-1',
          data: expect.objectContaining({ make: 'Lexus' })
        })
      )
    })
  })

  it('should confirm and delete a vehicle', async () => {
    mockGetVehiclesQuery.mockReturnValue({
      data: [mockVehicle],
      isLoading: false,
      isError: false,
      error: undefined
    })

    renderWithProviders(<VehicleList />)

    await user.click(screen.getByRole('button', { name: /delete vehicle/i }))

    await waitFor(() => {
      expect(document.querySelector('.ant-popconfirm')).toBeInTheDocument()
    })
    const okBtn = document.querySelector('.ant-popconfirm-buttons .ant-btn-primary') as HTMLElement
    await user.click(okBtn)

    await waitFor(() => {
      expect(mockDeleteVehicle).toHaveBeenCalledWith('vehicle-1')
    })
  })

  it('should show an empty state when there are not vehicles', () => {
    mockGetVehiclesQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: undefined
    })

    renderWithProviders(<VehicleList />)

    expect(screen.getByText('No data', { selector: '.ant-empty-description' })).toBeInTheDocument()
  })

  it('closes modal on cancel', async () => {
    renderWithProviders(<VehicleList />)

    await user.click(screen.getByRole('button', { name: /add vehicle/i }))
    expect(screen.getByText('Add Vehicle', { selector: '.ant-modal-title' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /cancel/i }))

    await waitFor(() => {
      const wrap = document.querySelector('.ant-modal-wrap')
      expect(wrap?.classList.contains('ant-modal-wrap-open') ?? false).toBe(false)
    })
  })

  it('should show a notification on create error', async () => {
    mockCreateVehicle.mockRejectedValue(new Error('Server error'))

    renderWithProviders(<VehicleList />)

    await user.click(screen.getByRole('button', { name: /add vehicle/i }))

    await pasteInput(screen.getByLabelText('License Plate'), 'NEW-1234')
    await selectOption('Car')
    await pasteInput(screen.getByLabelText('Make'), 'Ford')
    await pasteInput(screen.getByLabelText('Model'), 'Focus')
    await pasteInput(screen.getByLabelText('Color'), 'Red')

    await user.click(screen.getByRole('button', { name: /^add$/i }))

    await waitFor(() => {
      expect(mockNotify.error).toHaveBeenCalled()
    })
  })
})

import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { App, Form } from 'antd'
import { createMockNotify } from '../helpers/renderWithProviders'
import { useVehicleForm } from '../../src/hooks/useVehicleForm'
import { VehicleType } from '../../src/types'

const mockCreateVehicle = vi.fn()
const mockUpdateVehicle = vi.fn()
const mockDeleteVehicle = vi.fn()

vi.mock('../../src/store/api/vehiclesApi', () => ({
  useGetVehiclesQuery: () => ({
    data: [
      {
        id: 'v1',
        licensePlate: 'ABC-123',
        type: VehicleType.CAR,
        make: 'Toyota',
        model: 'Corolla',
        color: 'White'
      }
    ],
    isLoading: false,
    isError: false,
    error: undefined
  }),
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

const mockNotify = createMockNotify()

vi.mock('../../src/hooks/useNotification', () => ({
  useNotification: () => mockNotify
}))

const wrapper = ({ children }: { children: React.ReactNode }) => <App>{children}</App>

function renderUseVehicleForm() {
  return renderHook(
    () => {
      const [form] = Form.useForm()
      return useVehicleForm(form)
    },
    { wrapper }
  )
}

describe('useVehicleForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateVehicle.mockResolvedValue({ id: 'v2' })
    mockUpdateVehicle.mockResolvedValue({ id: 'v1' })
    mockDeleteVehicle.mockResolvedValue(undefined)
  })

  it('should return the vehicles from the query', () => {
    const { result } = renderUseVehicleForm()

    expect(result.current.vehicles).toHaveLength(1)
    expect(result.current.vehicles[0].licensePlate).toBe('ABC-123')
  })

  it('should start with the modal closed and no editing', () => {
    const { result } = renderUseVehicleForm()

    expect(result.current.modalOpen).toBe(false)
    expect(result.current.editing).toBeNull()
  })

  it('should open and close the modal', () => {
    const { result } = renderUseVehicleForm()

    act(() => result.current.openModal())
    expect(result.current.modalOpen).toBe(true)

    act(() => result.current.closeModal())
    expect(result.current.modalOpen).toBe(false)
  })

  it('should set the editing state when the handleEdit method is called', () => {
    const { result } = renderUseVehicleForm()
    const vehicle = result.current.vehicles[0]

    act(() => result.current.handleEdit(vehicle))

    expect(result.current.editing).toBe(vehicle)
    expect(result.current.modalOpen).toBe(true)
  })

  it('should call the createVehicle on submit when not editing', async () => {
    const { result } = renderUseVehicleForm()
    const values = {
      licensePlate: 'XYZ-789',
      type: VehicleType.CAR,
      make: 'Honda',
      model: 'Civic',
      color: 'Blue'
    }

    act(() => result.current.openModal())

    await act(async () => {
      await result.current.handleSubmit(values)
    })

    expect(mockCreateVehicle).toHaveBeenCalledWith(values)
  })

  it('should call the deleteVehicle on handleDelete', async () => {
    const { result } = renderUseVehicleForm()

    await act(async () => {
      await result.current.handleDelete('v1')
    })

    expect(mockDeleteVehicle).toHaveBeenCalledWith('v1')
  })

  it('should show an error notification when the create fails', async () => {
    mockCreateVehicle.mockRejectedValue(new Error('Create failed'))
    const { result } = renderUseVehicleForm()
    const values = {
      licensePlate: 'XYZ-789',
      type: VehicleType.CAR,
      make: 'Honda',
      model: 'Civic',
      color: 'Blue'
    }

    act(() => result.current.openModal())

    await act(async () => {
      await result.current.handleSubmit(values)
    })

    expect(mockNotify.error).toHaveBeenCalledWith('Create failed')
  })

  it('should show an error notification when the update fails', async () => {
    mockUpdateVehicle.mockRejectedValue(new Error('Update failed'))
    const { result } = renderUseVehicleForm()
    const vehicle = result.current.vehicles[0]

    act(() => result.current.handleEdit(vehicle))

    await act(async () => {
      await result.current.handleSubmit({
        licensePlate: 'ABC-123',
        type: VehicleType.CAR,
        make: 'Toyota',
        model: 'Corolla',
        color: 'White'
      })
    })

    expect(mockNotify.error).toHaveBeenCalledWith('Update failed')
  })

  it('should show an error notification when the delete fails', async () => {
    mockDeleteVehicle.mockRejectedValue(new Error('Delete failed'))
    const { result } = renderUseVehicleForm()

    await act(async () => {
      await result.current.handleDelete('v1')
    })

    expect(mockNotify.error).toHaveBeenCalledWith('Delete failed')
  })

  it('should return a stable handler references across re-renders', () => {
    const { result, rerender } = renderUseVehicleForm()
    const first = {
      openModal: result.current.openModal,
      closeModal: result.current.closeModal
    }
    rerender()
    expect(result.current.openModal).toBe(first.openModal)
    expect(result.current.closeModal).toBe(first.closeModal)
  })
})

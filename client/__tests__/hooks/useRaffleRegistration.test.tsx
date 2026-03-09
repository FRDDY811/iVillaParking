import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { App } from 'antd'
import { createMockNotify } from '../helpers/renderWithProviders'
import { useRaffleRegistration } from '../../src/hooks/useRaffleRegistration'
import { RaffleCycleStatus, VehicleType } from '../../src/types'

const mockRegister = vi.fn()
const mockUnregister = vi.fn()

vi.mock('../../src/store/api/raffleApi', () => ({
  useGetCyclesQuery: () => ({
    data: [
      {
        id: 'c1',
        name: 'Q1',
        status: RaffleCycleStatus.OPEN,
        startDate: '2026-01-01',
        endDate: '2026-03-31'
      },
      {
        id: 'c2',
        name: 'Q2',
        status: RaffleCycleStatus.CLOSED,
        startDate: '2026-04-01',
        endDate: '2026-06-30'
      }
    ],
    isLoading: false,
    isError: false,
    error: undefined
  }),
  useGetUserRegistrationsQuery: () => ({ data: [], isLoading: false }),
  useRegisterForRaffleMutation: () => [
    (data: unknown) => ({ unwrap: () => mockRegister(data) }),
    { isLoading: false }
  ],
  useUnregisterFromRaffleMutation: () => [
    (data: unknown) => ({ unwrap: () => mockUnregister(data) }),
    { isLoading: false }
  ]
}))

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
    ]
  })
}))

const mockNotify = createMockNotify()

vi.mock('../../src/hooks/useNotification', () => ({
  useNotification: () => mockNotify
}))

const wrapper = ({ children }: { children: React.ReactNode }) => <App>{children}</App>

describe('useRaffleRegistration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRegister.mockResolvedValue({ id: 'r1' })
    mockUnregister.mockResolvedValue(undefined)
  })

  it('should return the vehicles from the query', () => {
    const { result } = renderHook(() => useRaffleRegistration(), { wrapper })

    expect(result.current.vehicles).toHaveLength(1)
    expect(result.current.vehicles[0].licensePlate).toBe('ABC-123')
  })

  it('should filter only open cycles', () => {
    const { result } = renderHook(() => useRaffleRegistration(), { wrapper })

    expect(result.current.openCycles).toHaveLength(1)
    expect(result.current.openCycles[0].id).toBe('c1')
  })

  it('should track the selected vehicles per cycle', () => {
    const { result } = renderHook(() => useRaffleRegistration(), { wrapper })

    act(() => result.current.selectVehicle('c1', 'v1'))

    expect(result.current.selectedVehicles).toEqual({ c1: 'v1' })
  })

  it('should call the registerForRaffle for a selected vehicle', async () => {
    const { result } = renderHook(() => useRaffleRegistration(), { wrapper })

    act(() => result.current.selectVehicle('c1', 'v1'))

    await act(async () => {
      await result.current.handleRegister('c1')
    })

    expect(mockRegister).toHaveBeenCalledWith({ cycleId: 'c1', vehicleId: 'v1' })
  })

  it('should clear the selected vehicle after a successful registration', async () => {
    const { result } = renderHook(() => useRaffleRegistration(), { wrapper })

    act(() => result.current.selectVehicle('c1', 'v1'))

    await act(async () => {
      await result.current.handleRegister('c1')
    })

    expect(result.current.selectedVehicles).toEqual({})
  })

  it('should call unregisterFromRaffle on handleUnregister', async () => {
    const { result } = renderHook(() => useRaffleRegistration(), { wrapper })

    await act(async () => {
      await result.current.handleUnregister('c1', 'v1')
    })

    expect(mockUnregister).toHaveBeenCalledWith({ cycleId: 'c1', vehicleId: 'v1' })
  })

  it('should show an error notification when the registration fails', async () => {
    mockRegister.mockRejectedValue(new Error('Registration failed'))
    const { result } = renderHook(() => useRaffleRegistration(), { wrapper })

    act(() => result.current.selectVehicle('c1', 'v1'))

    await act(async () => {
      await result.current.handleRegister('c1')
    })

    expect(mockNotify.error).toHaveBeenCalledWith('Registration failed')
  })

  it('should show an error notification when the unregister fails', async () => {
    mockUnregister.mockRejectedValue(new Error('Unregister failed'))
    const { result } = renderHook(() => useRaffleRegistration(), { wrapper })

    await act(async () => {
      await result.current.handleUnregister('c1', 'v1')
    })

    expect(mockNotify.error).toHaveBeenCalledWith('Unregister failed')
  })

  it('should return a  stable handler references across re-renders', () => {
    const { result, rerender } = renderHook(() => useRaffleRegistration(), { wrapper })
    const first = result.current.selectVehicle
    rerender()
    expect(result.current.selectVehicle).toBe(first)
  })
})

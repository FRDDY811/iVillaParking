import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { App, Form } from 'antd'
import { createMockNotify } from '../helpers/renderWithProviders'
import { useRaffleControl } from '../../src/hooks/useRaffleControl'
import { RaffleCycleStatus } from '../../src/types'
import type { CycleFormValues } from '../../src/types/forms'

const mockCreateCycle = vi.fn()
const mockUpdateCycle = vi.fn()
const mockExecuteRaffle = vi.fn()
const mockGetCycleById = vi.fn()
const mockGetResults = vi.fn()

vi.mock('../../src/store/api/raffleApi', () => ({
  useGetCyclesQuery: () => ({
    data: [
      {
        id: 'c1',
        name: 'Q1',
        status: RaffleCycleStatus.OPEN,
        startDate: '2026-01-01',
        endDate: '2026-03-31'
      }
    ],
    isLoading: false,
    isError: false,
    error: undefined
  }),
  useCreateCycleMutation: () => [
    (data: unknown) => ({ unwrap: () => mockCreateCycle(data) }),
    { isLoading: false }
  ],
  useUpdateCycleMutation: () => [(data: unknown) => ({ unwrap: () => mockUpdateCycle(data) })],
  useExecuteRaffleMutation: () => [
    (id: string) => ({ unwrap: () => mockExecuteRaffle(id) }),
    { isLoading: false }
  ],
  useLazyGetCycleByIdQuery: () => [(id: string) => ({ unwrap: () => mockGetCycleById(id) })],
  useLazyGetResultsQuery: () => [
    mockGetResults,
    { data: [], isFetching: false, isError: false, error: undefined }
  ]
}))

const mockNotify = createMockNotify()

vi.mock('../../src/hooks/useNotification', () => ({
  useNotification: () => mockNotify
}))

const wrapper = ({ children }: { children: React.ReactNode }) => <App>{children}</App>

function renderUseRaffleControl() {
  return renderHook(
    () => {
      const [form] = Form.useForm()
      return useRaffleControl(form)
    },
    { wrapper }
  )
}

describe('useRaffleControl', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateCycle.mockResolvedValue({ id: 'c2' })
    mockUpdateCycle.mockResolvedValue({ id: 'c1' })
    mockExecuteRaffle.mockResolvedValue({ id: 'c1' })
    mockGetCycleById.mockResolvedValue({
      id: 'c1',
      name: 'Q1',
      status: RaffleCycleStatus.COMPLETED
    })
  })

  it('should return the cycles from the query', () => {
    const { result } = renderUseRaffleControl()

    expect(result.current.cycles).toHaveLength(1)
    expect(result.current.cycles[0].name).toBe('Q1')
  })

  it('should start with the modals closed', () => {
    const { result } = renderUseRaffleControl()

    expect(result.current.createModalOpen).toBe(false)
    expect(result.current.resultsModalOpen).toBe(false)
    expect(result.current.currentCycle).toBeNull()
  })

  it('should open and close the create modal', () => {
    const { result } = renderUseRaffleControl()

    act(() => result.current.openCreateModal())
    expect(result.current.createModalOpen).toBe(true)

    act(() => result.current.closeCreateModal())
    expect(result.current.createModalOpen).toBe(false)
  })

  it('should call the createCycle on handleCreate', async () => {
    const { result } = renderUseRaffleControl()
    const mockDayjs = { toISOString: () => '2026-01-01T00:00:00.000Z' }
    const values = {
      name: 'Q2',
      dates: [mockDayjs, mockDayjs]
    } as unknown as CycleFormValues

    await act(async () => {
      await result.current.handleCreate(values)
    })

    expect(mockCreateCycle).toHaveBeenCalledWith({
      name: 'Q2',
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: '2026-01-01T00:00:00.000Z'
    })
  })

  it('should call the updateCycle on handleStatusChange', async () => {
    const { result } = renderUseRaffleControl()

    await act(async () => {
      await result.current.handleStatusChange('c1', RaffleCycleStatus.CLOSED)
    })

    expect(mockUpdateCycle).toHaveBeenCalledWith({
      id: 'c1',
      data: { status: RaffleCycleStatus.CLOSED }
    })
  })

  it('should track the statusActionId during the status change', async () => {
    const _capturedId: string | null = null
    mockUpdateCycle.mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => resolve({ id: 'c1' }), 10)
      })
    })

    const { result } = renderUseRaffleControl()

    const promise = act(async () => {
      await result.current.handleStatusChange('c1', RaffleCycleStatus.CLOSED)
    })

    await promise
    expect(result.current.statusActionId).toBeNull()
  })

  it('should call the executeRaffle on handleExecute', async () => {
    const { result } = renderUseRaffleControl()

    await act(async () => {
      await result.current.handleExecute('c1')
    })

    expect(mockExecuteRaffle).toHaveBeenCalledWith('c1')
  })

  it('should open the results modal and fetches the data on handleViewResults', async () => {
    const { result } = renderUseRaffleControl()

    await act(async () => {
      await result.current.handleViewResults('c1')
    })

    expect(mockGetCycleById).toHaveBeenCalledWith('c1')
    expect(mockGetResults).toHaveBeenCalledWith('c1')
    expect(result.current.resultsModalOpen).toBe(true)
    expect(result.current.currentCycle).toEqual({
      id: 'c1',
      name: 'Q1',
      status: RaffleCycleStatus.COMPLETED
    })
  })

  it('should close the results modal and clears the current cycle', async () => {
    const { result } = renderUseRaffleControl()

    await act(async () => {
      await result.current.handleViewResults('c1')
    })
    expect(result.current.resultsModalOpen).toBe(true)

    act(() => result.current.closeResultsModal())
    expect(result.current.resultsModalOpen).toBe(false)
    expect(result.current.currentCycle).toBeNull()
  })

  it('should show a notification when the createCycle fails', async () => {
    mockCreateCycle.mockRejectedValue(new Error('Create failed'))
    const { result } = renderUseRaffleControl()
    const mockDayjs = { toISOString: () => '2026-01-01T00:00:00.000Z' }
    const values = {
      name: 'Q2',
      dates: [mockDayjs, mockDayjs]
    } as unknown as CycleFormValues

    await act(async () => {
      await result.current.handleCreate(values)
    })

    expect(mockNotify.error).toHaveBeenCalledWith('Create failed')
  })

  it('should show a notification when the executeRaffle fails', async () => {
    mockExecuteRaffle.mockRejectedValue(new Error('Execute failed'))
    const { result } = renderUseRaffleControl()

    await act(async () => {
      await result.current.handleExecute('c1')
    })

    expect(mockNotify.error).toHaveBeenCalledWith('Execute failed')
  })

  it('should show a notification when the handleStatusChange fails', async () => {
    mockUpdateCycle.mockRejectedValue(new Error('Status change failed'))
    const { result } = renderUseRaffleControl()

    await act(async () => {
      await result.current.handleStatusChange('c1', RaffleCycleStatus.CLOSED)
    })

    expect(mockNotify.error).toHaveBeenCalledWith('Status change failed')
  })

  it('should return a stable handler references across re-renders', () => {
    const { result, rerender } = renderUseRaffleControl()
    const first = {
      openCreateModal: result.current.openCreateModal,
      closeCreateModal: result.current.closeCreateModal,
      closeResultsModal: result.current.closeResultsModal
    }
    rerender()
    expect(result.current.openCreateModal).toBe(first.openCreateModal)
    expect(result.current.closeCreateModal).toBe(first.closeCreateModal)
    expect(result.current.closeResultsModal).toBe(first.closeResultsModal)
  })
})

/**
 * Encapsulates all raffle cycle management for the admin panel:
 * CRUD cycles, status transitions, execution, and result viewing.
 *
 * @param form - Ant Design form instance bound to the create/edit cycle modal
 * @returns cycles, loading/error state, modal controls, and action handlers
 */
import { useState, useCallback } from 'react'
import type { FormInstance } from 'antd'
import type { SerializedError } from '@reduxjs/toolkit'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import {
  useGetCyclesQuery,
  useCreateCycleMutation,
  useUpdateCycleMutation,
  useExecuteRaffleMutation,
  useLazyGetCycleByIdQuery,
  useLazyGetResultsQuery
} from '../store/api/raffleApi'
import { useMutationHandler } from './useMutationHandler'
import { useActionInFlight } from './useActionInFlight'
import { IRaffleCycle, IParkingAssignment, RaffleCycleStatus } from '../types'
import { CycleFormValues } from '../types/forms'

interface UseRaffleControlReturn {
  cycles: IRaffleCycle[]
  isLoading: boolean
  isError: boolean
  error: FetchBaseQueryError | SerializedError | undefined
  isCreating: boolean
  isExecuting: boolean
  statusActionId: string | null
  createModalOpen: boolean
  openCreateModal: () => void
  closeCreateModal: () => void
  resultsModalOpen: boolean
  closeResultsModal: () => void
  currentCycle: IRaffleCycle | null
  results: IParkingAssignment[]
  isLoadingResults: boolean
  isResultsError: boolean
  resultsError: FetchBaseQueryError | SerializedError | undefined
  handleCreate: (values: CycleFormValues) => Promise<void>
  handleStatusChange: (id: string, newStatus: RaffleCycleStatus) => Promise<unknown>
  handleExecute: (id: string) => Promise<void>
  handleViewResults: (id: string) => Promise<void>
}

export function useRaffleControl(form: FormInstance): UseRaffleControlReturn {
  const { data: cycles = [], isLoading, isError, error } = useGetCyclesQuery()
  const [createCycle, { isLoading: isCreating }] = useCreateCycleMutation()
  const [updateCycle] = useUpdateCycleMutation()
  const [executeRaffle, { isLoading: isExecuting }] = useExecuteRaffleMutation()
  const [getCycleById] = useLazyGetCycleByIdQuery()
  const [
    getResults,
    {
      data: results = [],
      isFetching: isLoadingResults,
      isError: isResultsError,
      error: resultsError
    }
  ] = useLazyGetResultsQuery()
  const handle = useMutationHandler()
  const { activeId: statusActionId, run } = useActionInFlight()

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [resultsModalOpen, setResultsModalOpen] = useState(false)
  const [currentCycle, setCurrentCycle] = useState<IRaffleCycle | null>(null)

  const openCreateModal = useCallback(() => setCreateModalOpen(true), [])
  const closeCreateModal = useCallback(() => setCreateModalOpen(false), [])

  const closeResultsModal = useCallback(() => {
    setResultsModalOpen(false)
    setCurrentCycle(null)
  }, [])

  const handleCreate = useCallback(
    async (values: CycleFormValues) => {
      const result = await handle(
        createCycle({
          name: values.name,
          startDate: values.dates[0].toISOString(),
          endDate: values.dates[1].toISOString()
        }).unwrap(),
        'Raffle cycle created',
        'Failed to create cycle'
      )
      if (result) {
        setCreateModalOpen(false)
        form.resetFields()
      }
    },
    [createCycle, handle, form]
  )

  const handleStatusChange = useCallback(
    (id: string, newStatus: RaffleCycleStatus) =>
      run(
        id,
        updateCycle({ id, data: { status: newStatus } }).unwrap(),
        `Cycle status updated to ${newStatus}`,
        'Failed to update cycle status'
      ),
    [updateCycle, run]
  )

  const handleExecute = useCallback(
    async (id: string) => {
      await handle(
        executeRaffle(id).unwrap(),
        'Raffle executed successfully!',
        'Failed to execute raffle'
      )
    },
    [executeRaffle, handle]
  )

  const handleViewResults = useCallback(
    async (id: string) => {
      const cycleResult = await handle(getCycleById(id).unwrap(), '', 'Failed to load results')
      if (cycleResult) {
        setCurrentCycle(cycleResult)
        getResults(id)
        setResultsModalOpen(true)
      }
    },
    [getCycleById, getResults, handle]
  )

  return {
    cycles,
    isLoading,
    isError,
    error,
    isCreating,
    isExecuting,
    statusActionId,
    createModalOpen,
    openCreateModal,
    closeCreateModal,
    resultsModalOpen,
    closeResultsModal,
    currentCycle,
    results,
    isLoadingResults,
    isResultsError,
    resultsError,
    handleCreate,
    handleStatusChange,
    handleExecute,
    handleViewResults
  }
}

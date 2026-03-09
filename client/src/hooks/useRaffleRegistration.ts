/**
 * Manages the resident-facing raffle registration flow:
 * lists open cycles, shows the resident's vehicles, tracks which
 * vehicles are registered for which cycles, and handles register/unregister.
 *
 * @returns vehicles, openCycles, registrations, selectedVehicles map, and handlers
 */
import { useState, useCallback, useMemo } from 'react'
import type { SerializedError } from '@reduxjs/toolkit'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import {
  useGetCyclesQuery,
  useGetUserRegistrationsQuery,
  useRegisterForRaffleMutation,
  useUnregisterFromRaffleMutation
} from '../store/api/raffleApi'
import { useGetVehiclesQuery } from '../store/api/vehiclesApi'
import { useMutationHandler } from './useMutationHandler'
import { useNotification } from './useNotification'
import { IRaffleCycle, IRaffleRegistration, IVehicle, RaffleCycleStatus } from '../types'

interface UseRaffleRegistrationReturn {
  vehicles: IVehicle[]
  userRegistrations: IRaffleRegistration[]
  isLoading: boolean
  isError: boolean
  error: FetchBaseQueryError | SerializedError | undefined
  isRegistering: boolean
  isUnregistering: boolean
  openCycles: IRaffleCycle[]
  selectedVehicles: Record<string, string>
  selectVehicle: (cycleId: string, vehicleId: string) => void
  handleRegister: (cycleId: string) => Promise<void>
  handleUnregister: (cycleId: string, vehicleId: string) => Promise<void>
}

export function useRaffleRegistration(): UseRaffleRegistrationReturn {
  const { data: cycles = [], isLoading, isError, error } = useGetCyclesQuery()
  const { data: vehicles = [] } = useGetVehiclesQuery()
  const { data: userRegistrations = [] } = useGetUserRegistrationsQuery()
  const [registerForRaffle, { isLoading: isRegistering }] = useRegisterForRaffleMutation()
  const [unregisterFromRaffle, { isLoading: isUnregistering }] = useUnregisterFromRaffleMutation()
  const notify = useNotification()
  const handle = useMutationHandler()

  const [selectedVehicles, setSelectedVehicles] = useState<Record<string, string>>({})

  const openCycles = useMemo(
    () => cycles.filter((cycle: IRaffleCycle) => cycle.status === RaffleCycleStatus.OPEN),
    [cycles]
  )

  const selectVehicle = useCallback((cycleId: string, vehicleId: string) => {
    setSelectedVehicles(prev => ({ ...prev, [cycleId]: vehicleId }))
  }, [])

  const handleRegister = useCallback(
    async (cycleId: string) => {
      const vehicleId = selectedVehicles[cycleId]
      if (!vehicleId) {
        notify.warning('Please select a vehicle')
        return
      }
      const result = await handle(
        registerForRaffle({ cycleId, vehicleId }).unwrap(),
        'Registered for raffle',
        'Registration failed'
      )
      if (result) {
        setSelectedVehicles(prev => {
          const next = { ...prev }
          delete next[cycleId]
          return next
        })
      }
    },
    [selectedVehicles, registerForRaffle, notify, handle]
  )

  const handleUnregister = useCallback(
    async (cycleId: string, vehicleId: string) => {
      await handle(
        unregisterFromRaffle({ cycleId, vehicleId }).unwrap(),
        'Unregistered from raffle',
        'Failed to unregister'
      )
    },
    [unregisterFromRaffle, handle]
  )

  return {
    vehicles,
    userRegistrations,
    isLoading,
    isError,
    error,
    isRegistering,
    isUnregistering,
    openCycles,
    selectedVehicles,
    selectVehicle,
    handleRegister,
    handleUnregister
  }
}

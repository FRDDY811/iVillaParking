/**
 * Vehicle CRUD form state management for the resident dashboard.
 * Handles modal open/close, form population for edit mode, and
 * create/update/delete mutations with notifications.
 *
 * @param form - Ant Design form instance bound to the vehicle modal
 * @returns vehicles, loading/error state, modal controls, and CRUD handlers
 */
import { useState, useCallback } from 'react'
import type { FormInstance } from 'antd'
import type { SerializedError } from '@reduxjs/toolkit'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import {
  useGetVehiclesQuery,
  useCreateVehicleMutation,
  useUpdateVehicleMutation,
  useDeleteVehicleMutation
} from '../store/api/vehiclesApi'
import { useMutationHandler } from './useMutationHandler'
import { IVehicle } from '../types'
import { VehicleFormValues } from '../types/forms'

interface UseVehicleFormReturn {
  vehicles: IVehicle[]
  isLoading: boolean
  isError: boolean
  error: FetchBaseQueryError | SerializedError | undefined
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
  modalOpen: boolean
  editing: IVehicle | null
  openModal: () => void
  closeModal: () => void
  handleSubmit: (values: VehicleFormValues) => Promise<void>
  handleEdit: (record: IVehicle) => void
  handleDelete: (id: string) => Promise<void>
}

export function useVehicleForm(form: FormInstance): UseVehicleFormReturn {
  const { data: vehicles = [], isLoading, isError, error } = useGetVehiclesQuery()
  const [createVehicle, { isLoading: isCreating }] = useCreateVehicleMutation()
  const [updateVehicle, { isLoading: isUpdating }] = useUpdateVehicleMutation()
  const [deleteVehicleMut, { isLoading: isDeleting }] = useDeleteVehicleMutation()
  const handle = useMutationHandler()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<IVehicle | null>(null)

  const closeModal = useCallback(() => {
    setModalOpen(false)
    setEditing(null)
    form.resetFields()
  }, [form])

  const openModal = useCallback(() => {
    setEditing(null)
    form.resetFields()
    setModalOpen(true)
  }, [form])

  const handleSubmit = useCallback(
    async (values: VehicleFormValues) => {
      const result = editing
        ? await handle(
            updateVehicle({ id: editing.id, data: values }).unwrap(),
            'Vehicle updated',
            'Failed to update vehicle'
          )
        : await handle(createVehicle(values).unwrap(), 'Vehicle added', 'Failed to add vehicle')
      if (result) closeModal()
    },
    [editing, updateVehicle, createVehicle, handle, closeModal]
  )

  const handleEdit = useCallback(
    (record: IVehicle) => {
      setEditing(record)
      form.setFieldsValue(record)
      setModalOpen(true)
    },
    [form]
  )

  const handleDelete = useCallback(
    async (id: string) => {
      await handle(deleteVehicleMut(id).unwrap(), 'Vehicle deleted', 'Failed to delete vehicle')
    },
    [deleteVehicleMut, handle]
  )

  return {
    vehicles,
    isLoading,
    isError,
    error,
    isCreating,
    isUpdating,
    isDeleting,
    modalOpen,
    editing,
    openModal,
    closeModal,
    handleSubmit,
    handleEdit,
    handleDelete
  }
}

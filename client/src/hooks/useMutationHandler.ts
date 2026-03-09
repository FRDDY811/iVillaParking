/**
 * Wraps async RTK Query mutation calls with an automatic success/error notifications.
 * Returns the mutation result on success or null on failure, allowing callers
 * to conditionally proceed (e.g., close a modal only on success).
 *
 * @returns handler function: (promise, successMsg, errorMsg) => Promise<T | null>
 * @example
 * const handle = useMutationHandler()
 * const result = await handle(createVehicle(data).unwrap(), 'Created!', 'Failed')
 * if (result) form.resetFields()
 */
import { useCallback } from 'react'
import { useNotification } from './useNotification'
import { extractErrorMessage } from '../utils/errorMessage'

type MutationHandler = <T>(
  mutation: Promise<T>,
  successMsg: string,
  errorMsg: string
) => Promise<T | null>

export function useMutationHandler(): MutationHandler {
  const notify = useNotification()

  const handle = useCallback(
    async <T>(mutation: Promise<T>, successMsg: string, errorMsg: string): Promise<T | null> => {
      try {
        const result = await mutation
        notify.success(successMsg)
        return result
      } catch (err: unknown) {
        notify.error(extractErrorMessage(err, errorMsg))
        return null
      }
    },
    [notify]
  )

  return handle
}

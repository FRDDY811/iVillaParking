import { useState, useCallback } from 'react'
import { useMutationHandler } from './useMutationHandler'

interface UseActionInFlightReturn {
  activeId: string | null
  isBusy: (id: string) => boolean
  anyBusy: boolean
  run: <T>(id: string, promise: Promise<T>, successMsg: string, errorMsg: string) => Promise<T | null>
}

export function useActionInFlight(): UseActionInFlightReturn {
  const [activeId, setActiveId] = useState<string | null>(null)
  const handle = useMutationHandler()

  const isBusy = useCallback((id: string) => activeId === id, [activeId])
  const anyBusy = activeId !== null

  const run = useCallback(
    async <T>(id: string, promise: Promise<T>, successMsg: string, errorMsg: string) => {
      setActiveId(id)
      try {
        return await handle(promise, successMsg, errorMsg)
      } finally {
        setActiveId(null)
      }
    },
    [handle]
  )

  return { activeId, isBusy, anyBusy, run }
}

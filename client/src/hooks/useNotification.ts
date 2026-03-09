/**
 * Stable notification wrapper around Ant Design's message API.
 * Returns memoized callbacks that never change identity, making them
 * safe to use in useEffect/useCallback dependency arrays without
 * causing re-renders.
 *
 * @returns { success, error, warning, info } — each takes a message string
 * @example
 * const notify = useNotification()
 * notify.success('Vehicle registered')
 */
import { useRef, useCallback, useEffect, useMemo } from 'react'
import { App } from 'antd'

interface UseNotificationReturn {
  success: (content: string) => void
  error: (content: string) => void
  warning: (content: string) => void
  info: (content: string) => void
}

export function useNotification(): UseNotificationReturn {
  const { message } = App.useApp()
  const messageRef = useRef(message)
  useEffect(() => {
    messageRef.current = message
  }, [message])

  const success = useCallback((content: string) => messageRef.current.success(content), [])
  const error = useCallback((content: string) => messageRef.current.error(content), [])
  const warning = useCallback((content: string) => messageRef.current.warning(content), [])
  const info = useCallback((content: string) => messageRef.current.info(content), [])

  return useMemo(() => ({ success, error, warning, info }), [success, error, warning, info])
}

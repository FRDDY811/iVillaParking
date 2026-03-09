import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { App } from 'antd'
import { useMutationHandler } from '../../src/hooks/useMutationHandler'

const messageSpy = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn()
}

beforeEach(() => {
  vi.spyOn(App, 'useApp').mockReturnValue({
    message: messageSpy as unknown as ReturnType<typeof App.useApp>['message'],
    notification: {} as ReturnType<typeof App.useApp>['notification'],
    modal: {} as ReturnType<typeof App.useApp>['modal']
  })
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

const wrapper = ({ children }: { children: React.ReactNode }) => <App>{children}</App>

describe('useMutationHandler', () => {
  it('should show a success notification and returns result when is success', async () => {
    const { result } = renderHook(() => useMutationHandler(), { wrapper })

    let value: unknown
    await act(async () => {
      value = await result.current(Promise.resolve({ id: '1' }), 'Created!', 'Failed')
    })

    expect(value).toEqual({ id: '1' })
    expect(messageSpy.success).toHaveBeenCalledWith('Created!')
    expect(messageSpy.error).not.toHaveBeenCalled()
  })

  it('should show an error notification and returns null when is failure', async () => {
    const { result } = renderHook(() => useMutationHandler(), { wrapper })

    let value: unknown
    await act(async () => {
      value = await result.current(Promise.reject(new Error('boom')), 'OK', 'Something went wrong')
    })

    expect(value).toBeNull()
    expect(messageSpy.error).toHaveBeenCalled()
    expect(messageSpy.success).not.toHaveBeenCalled()
  })

  it('should extract the server error message from the rejection payload', async () => {
    const { result } = renderHook(() => useMutationHandler(), { wrapper })

    const serverError = { data: { error: 'Duplicate entry' } }
    await act(async () => {
      await result.current(Promise.reject(serverError), 'OK', 'Fallback message')
    })

    expect(messageSpy.error).toHaveBeenCalledWith('Duplicate entry')
  })

  it('should return a stable function reference across re-renders', () => {
    const { result, rerender } = renderHook(() => useMutationHandler(), { wrapper })
    const first = result.current
    rerender()
    expect(result.current).toBe(first)
  })
})

import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { App } from 'antd'
import type { MockInstance } from 'vitest'
import { useNotification } from '../../src/hooks/useNotification'

const wrapper = ({ children }: { children: React.ReactNode }) => <App>{children}</App>

describe('useNotification', () => {
  let messageSpy: {
    success: MockInstance
    error: MockInstance
    warning: MockInstance
    info: MockInstance
  }

  beforeEach(() => {
    messageSpy = {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn()
    }

    vi.spyOn(App, 'useApp').mockReturnValue({
      message: messageSpy as unknown as ReturnType<typeof App.useApp>['message'],
      notification: {} as ReturnType<typeof App.useApp>['notification'],
      modal: {} as ReturnType<typeof App.useApp>['modal']
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return success, error, warning, and info methods', () => {
    const { result } = renderHook(() => useNotification(), { wrapper })
    expect(result.current.success).toBeInstanceOf(Function)
    expect(result.current.error).toBeInstanceOf(Function)
    expect(result.current.warning).toBeInstanceOf(Function)
    expect(result.current.info).toBeInstanceOf(Function)
  })

  it('should call the message.success method', () => {
    const { result } = renderHook(() => useNotification(), { wrapper })
    act(() => {
      result.current.success('Done!')
    })
    expect(messageSpy.success).toHaveBeenCalledWith('Done!')
  })

  it('should call the message.error method', () => {
    const { result } = renderHook(() => useNotification(), { wrapper })
    act(() => {
      result.current.error('Something failed')
    })
    expect(messageSpy.error).toHaveBeenCalledWith('Something failed')
  })

  it('should calls the message.warning method', () => {
    const { result } = renderHook(() => useNotification(), { wrapper })
    act(() => {
      result.current.warning('Be careful')
    })
    expect(messageSpy.warning).toHaveBeenCalledWith('Be careful')
  })

  it('should calls message.info method', () => {
    const { result } = renderHook(() => useNotification(), { wrapper })
    act(() => {
      result.current.info('FYI')
    })
    expect(messageSpy.info).toHaveBeenCalledWith('FYI')
  })

  it('should return a stable reference across re-renders', () => {
    const { result, rerender } = renderHook(() => useNotification(), { wrapper })
    const first = result.current
    rerender()
    expect(result.current).toBe(first)
  })
})

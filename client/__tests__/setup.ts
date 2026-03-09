import '@testing-library/jest-dom'

if (!globalThis.fetch) {
  globalThis.fetch = vi.fn() as unknown as typeof fetch
  globalThis.Request = vi.fn() as unknown as typeof Request
  globalThis.Response = vi.fn() as unknown as typeof Response
  globalThis.Headers = vi.fn() as unknown as typeof Headers
}

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})

const originalGetComputedStyle = window.getComputedStyle
window.getComputedStyle = (elt: Element, pseudoElt?: string | null) => {
  if (pseudoElt) {
    return {} as CSSStyleDeclaration
  }
  return originalGetComputedStyle(elt)
}

const originalError = console.error
console.error = (...args: unknown[]) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning:') ||
      args[0].includes('not wrapped in act') ||
      args[0].includes('Not implemented'))
  )
    return
  originalError.call(console, ...args)
}

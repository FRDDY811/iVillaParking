import React from 'react'
import { render, screen } from '@testing-library/react'

import ErrorBoundary from '../../src/components/ErrorBoundary'

const ThrowingComponent = () => {
  throw new Error('Test crash')
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  vi.restoreAllMocks()
})

describe('ErrorBoundary', () => {
  it('should render the children when ther is not an error', () => {
    render(
      <ErrorBoundary>
        <div>Content</div>
      </ErrorBoundary>
    )
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('should render a fallback UI when Something went wrong', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    )
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Test crash')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })
})

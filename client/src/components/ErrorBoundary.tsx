import React from 'react'
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary'
import { Button, Result } from 'antd'

function ErrorFallback({
  error,
  resetErrorBoundary
}: {
  error: unknown
  resetErrorBoundary: () => void
}) {
  const message = error instanceof Error ? error.message : 'An unexpected error occurred'
  return (
    <Result
      status="error"
      title="Something went wrong"
      subTitle={message}
      extra={
        <Button type="primary" onClick={resetErrorBoundary}>
          Try Again
        </Button>
      }
    />
  )
}

/** Wraps the child components in react-error-boundary. Renders a fallback UI with an error message and
 * with a retry button on unhandled React render errors.
 **/
const ErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <ReactErrorBoundary FallbackComponent={ErrorFallback}>{children}</ReactErrorBoundary>
}

export default ErrorBoundary

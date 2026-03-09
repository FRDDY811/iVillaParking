/**
 * Polymorphic error message extraction.
 * Handles multiple error shapes: RTK Query (ErrorWithData), Axios (ErrorWithResponse),
 * and standard Error objects. Uses type guards and progressive narrowing
 * to extract a readable string from any error type.
 */
interface ErrorWithData {
  data: unknown
}

interface ErrorWithResponse {
  response: unknown
}

interface DataWithError {
  error: string
}

interface DataWithMessage {
  message: string
}

function hasData(err: unknown): err is ErrorWithData {
  return err !== null && typeof err === 'object' && 'data' in err
}

function hasResponse(err: unknown): err is ErrorWithResponse {
  return err !== null && typeof err === 'object' && 'response' in err
}

function hasError(data: object): data is DataWithError {
  return 'error' in data && typeof (data as DataWithError).error === 'string'
}

function hasMessage(data: object): data is DataWithMessage {
  return 'message' in data && typeof (data as DataWithMessage).message === 'string'
}

export function extractErrorMessage(err: unknown, fallback: string): string {
  // RTK Query error shape: { data: { error: string } } or { data: { message: string } }
  if (hasData(err)) {
    const { data } = err
    if (typeof data === 'string') return data
    if (data && typeof data === 'object') {
      if (hasError(data)) return data.error
      if (hasMessage(data)) return data.message
    }
  }
  // Axios error shape: { response: { data: { error: string } } }
  if (hasResponse(err)) {
    const { response } = err
    if (response && typeof response === 'object' && 'data' in response) {
      const data = (response as ErrorWithData).data
      if (data && typeof data === 'object' && hasError(data)) {
        return data.error
      }
    }
  }
  if (err instanceof Error) {
    return err.message
  }
  return fallback
}

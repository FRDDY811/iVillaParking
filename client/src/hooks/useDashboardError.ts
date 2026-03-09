import { extractErrorMessage } from '../utils/errorMessage'

interface QueryErrorState {
  isError: boolean
  error: unknown
}

export function useDashboardError(...queries: QueryErrorState[]) {
  const failed = queries.find(query => query.isError)
  return {
    anyError: !!failed,
    errorMsg: failed ? extractErrorMessage(failed.error, '') : ''
  }
}

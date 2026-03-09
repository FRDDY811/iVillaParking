import { extractErrorMessage } from '../../src/utils/errorMessage'

describe('extractErrorMessage', () => {
  it('should return fallback for null/undefined', () => {
    expect(extractErrorMessage(null, 'fallback')).toBe('fallback')
    expect(extractErrorMessage(undefined, 'fallback')).toBe('fallback')
  })

  it('should extract string data from RTK Query error shape', () => {
    expect(extractErrorMessage({ data: 'Server error' }, 'fallback')).toBe('Server error')
  })

  it('should extracts the error field from data object', () => {
    expect(extractErrorMessage({ data: { error: 'Invalid email' } }, 'fallback')).toBe(
      'Invalid email'
    )
  })

  it('should extract the message field from data object', () => {
    expect(extractErrorMessage({ data: { message: 'Not found' } }, 'fallback')).toBe('Not found')
  })

  it('should prefer the error field over message field', () => {
    expect(extractErrorMessage({ data: { error: 'err', message: 'msg' } }, 'fallback')).toBe('err')
  })

  it('should extract from Error instance', () => {
    expect(extractErrorMessage(new Error('boom'), 'fallback')).toBe('boom')
  })

  it('should return a fallback for non-string data.error', () => {
    expect(extractErrorMessage({ data: { error: 123 } }, 'fallback')).toBe('fallback')
  })

  it('should return a fallback for empty data object', () => {
    expect(extractErrorMessage({ data: {} }, 'fallback')).toBe('fallback')
  })

  it('should returns a fallback for primitive non-error values', () => {
    expect(extractErrorMessage(42, 'fallback')).toBe('fallback')
    expect(extractErrorMessage('string', 'fallback')).toBe('fallback')
  })

  it('should extract an error from axios error shape (response.data.error)', () => {
    expect(extractErrorMessage({ response: { data: { error: 'Unauthorized' } } }, 'fallback')).toBe(
      'Unauthorized'
    )
  })

  it('should return a fallback for axios error with no error field', () => {
    expect(extractErrorMessage({ response: { data: {} } }, 'fallback')).toBe('fallback')
  })
})

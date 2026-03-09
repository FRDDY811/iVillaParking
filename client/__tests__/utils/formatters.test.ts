import { formatDate, formatDateTime, formatUserName } from '../../src/utils/formatters'

describe('formatDate', () => {
  it('should format the ISO date string to a readable date', () => {
    const result = formatDate('2026-03-15T10:30:00.000Z')
    expect(result).toContain('Mar')
    expect(result).toContain('15')
    expect(result).toContain('2026')
  })
})

describe('formatDateTime', () => {
  it('should format the ISO date string with time', () => {
    const result = formatDateTime('2026-03-15T14:30:00.000Z')
    expect(result).toContain('Mar')
    expect(result).toContain('15')
    expect(result).toContain('2026')
  })
})

describe('formatUserName', () => {
  it('should return the full name when the user is provided', () => {
    expect(formatUserName({ firstName: 'John', lastName: 'Doe' })).toBe('John Doe')
  })

  it('should return a default fallback when the user is null', () => {
    expect(formatUserName(null)).toBe('-')
  })

  it('should return a default fallback when the user is undefined', () => {
    expect(formatUserName(undefined)).toBe('-')
  })

  it('should return a custom fallback when provided', () => {
    expect(formatUserName(null, 'Unknown')).toBe('Unknown')
  })
})

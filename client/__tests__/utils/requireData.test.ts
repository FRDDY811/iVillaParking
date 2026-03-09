import { requireData } from '../../src/types'

describe('requireData', () => {
  it('should return data when present', () => {
    expect(requireData({ data: { id: '1' } })).toEqual({ id: '1' })
  })

  it('should throw when the data is undefined', () => {
    expect(() => requireData({ data: undefined })).toThrow('Server returned empty data')
  })

  it('should throw when the data is null', () => {
    expect(() => requireData({ data: null })).toThrow('Server returned empty data')
  })

  it('should return false but non-null data (e.g., 0, empty string)', () => {
    expect(requireData({ data: 0 })).toBe(0)
    expect(requireData({ data: '' })).toBe('')
    expect(requireData({ data: false })).toBe(false)
  })
})

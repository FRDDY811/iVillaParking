import {
  getTierColor,
  TIER_COLORS,
  DETECTION_STATUS_COLORS,
  USER_STATUS_COLORS,
  RAFFLE_STATUS_COLORS,
  VEHICLE_TYPE_LABELS
} from '../../src/utils/constants'

describe('getTierColor', () => {
  it('should return green for the tier 1', () => {
    expect(getTierColor(1)).toBe('green')
  })

  it('should return blue for the tier 2', () => {
    expect(getTierColor(2)).toBe('blue')
  })

  it('should return default for the tier 3', () => {
    expect(getTierColor(3)).toBe('default')
  })

  it('should return default for an unknown tier', () => {
    expect(getTierColor(99)).toBe('default')
  })
})

describe('constant maps', () => {
  it('should DETECTION_STATUS_COLORS covers all the expected statuses', () => {
    expect(DETECTION_STATUS_COLORS).toEqual({
      AUTHORIZED: 'green',
      DETECTED: 'blue',
      UNKNOWN: 'red'
    })
  })

  it('should USER_STATUS_COLORS covers all the expected statuses', () => {
    expect(USER_STATUS_COLORS).toEqual({
      PENDING: 'orange',
      ACTIVE: 'green',
      REJECTED: 'red'
    })
  })

  it('should RAFFLE_STATUS_COLORS covers all the expected statuses', () => {
    expect(Object.keys(RAFFLE_STATUS_COLORS)).toEqual(['PENDING', 'OPEN', 'CLOSED', 'COMPLETED'])
  })

  it('should VEHICLE_TYPE_LABELS covers all the expected types', () => {
    expect(Object.keys(VEHICLE_TYPE_LABELS)).toEqual(['CAR', 'MOTORCYCLE', 'BICYCLE'])
  })

  it('should TIER_COLORS covers the tiers 1-3', () => {
    expect(Object.keys(TIER_COLORS).map(Number)).toEqual([1, 2, 3])
  })
})

import NodeCache from 'node-cache'

const CACHE_TTL_SECONDS = 5 * 60
const CACHE_CHECK_INTERVAL_SECONDS = 60

export const cache = new NodeCache({
  stdTTL: CACHE_TTL_SECONDS,
  checkperiod: CACHE_CHECK_INTERVAL_SECONDS
})

export const CACHE_KEYS = {
  PARKING_CONFIG: 'parking_config',
  CURRENT_ASSIGNMENTS: 'current_assignments',
  DASHBOARD_STATS: 'dashboard_stats'
}

export function invalidateCache(key?: string) {
  if (key) {
    cache.del(key)
  } else {
    cache.flushAll()
  }
}

import api, { setAccessToken, getAccessToken } from '../../src/api/axios'

import type { Mock } from 'vitest'
let mockAdapter: Mock

beforeEach(() => {
  setAccessToken(null)
  mockAdapter = vi.fn()
  api.defaults.adapter = mockAdapter
})

describe('axios api', () => {
  describe('setAccessToken / getAccessToken', () => {
    it('should store and retrieve the token', () => {
      expect(getAccessToken()).toBeNull()
      setAccessToken('my-token')
      expect(getAccessToken()).toBe('my-token')
    })

    it('should clear the token when is set to null', () => {
      setAccessToken('some-token')
      setAccessToken(null)
      expect(getAccessToken()).toBeNull()
    })
  })

  describe('request interceptor', () => {
    it('should add the authorization header when token is set', async () => {
      setAccessToken('test-token')
      mockAdapter.mockResolvedValue({ status: 200, data: 'ok', headers: {} })

      await api.get('/test')

      const config = mockAdapter.mock.calls[0][0]
      expect(config.headers.Authorization).toBe('Bearer test-token')
    })

    it('should not add the authorization header when there is not token', async () => {
      mockAdapter.mockResolvedValue({ status: 200, data: 'ok', headers: {} })

      await api.get('/test')

      const config = mockAdapter.mock.calls[0][0]
      expect(config.headers.Authorization).toBeUndefined()
    })
  })
})

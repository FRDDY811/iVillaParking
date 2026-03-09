import uiReducer, { toggleSidebar } from '../../src/store/uiSlice'

const initialState = {
  sidebarCollapsed: false
}

describe('uiSlice', () => {
  it('should return the initial state', () => {
    expect(uiReducer(undefined, { type: 'unknown' })).toEqual(initialState)
  })

  it('should toggle the sidebar collapsed state', () => {
    const state = uiReducer(initialState, toggleSidebar())
    expect(state.sidebarCollapsed).toBe(true)

    const state2 = uiReducer(state, toggleSidebar())
    expect(state2.sidebarCollapsed).toBe(false)
  })
})

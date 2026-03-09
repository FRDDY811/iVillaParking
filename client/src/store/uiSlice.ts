/** UI state slice for layout preferences (sidebar collapsed state). */
import { createSlice } from '@reduxjs/toolkit'

export interface UIState {
  sidebarCollapsed: boolean
}

const initialState: UIState = {
  sidebarCollapsed: false
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: state => {
      state.sidebarCollapsed = !state.sidebarCollapsed
    }
  }
})

export const { toggleSidebar } = uiSlice.actions
export default uiSlice.reducer

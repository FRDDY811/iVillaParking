/**
 * Redux store configuration.
 * RootState and AppDispatch are derived from the store itself, so they
 * stay in sync automatically when new slices or API endpoints are added.
 */
import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import { baseApi } from './api'
import authReducer, { logout } from './authSlice'
import uiReducer from './uiSlice'

const appReducer = combineReducers({
  auth: authReducer,
  ui: uiReducer,
  [baseApi.reducerPath]: baseApi.reducer
})

const rootReducer: typeof appReducer = (state, action) => {
  // Clear RTK Query cache on logout so the next user doesn't see stale data
  if (logout.fulfilled.match(action)) {
    return appReducer({ ...state, [baseApi.reducerPath]: undefined } as never, action)
  }
  return appReducer(state, action)
}

export const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware => getDefaultMiddleware().concat(baseApi.middleware)
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

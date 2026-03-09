/**
 * Auth state management via async thunks.
 * Handles login, register, token refresh, logout, and getMe.
 *
 * Uses Axios (not RTK Query) for auth endpoints because auth state
 * must be resolved before RTK Query's baseQuery can attach tokens.
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { authApi } from '../api/auth'
import { setAccessToken } from '../api/axios'
import { IUser, LoginRequest, RegisterRequest } from '../types'
import { extractErrorMessage } from '../utils/errorMessage'

export interface AuthState {
  user: IUser | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null
}

export const login = createAsyncThunk<IUser, LoginRequest, { rejectValue: string }>(
  'auth/login',
  async (data, { rejectWithValue }) => {
    try {
      const response = await authApi.login(data)
      setAccessToken(response.data.data.accessToken)
      return response.data.data.user
    } catch (error: unknown) {
      return rejectWithValue(extractErrorMessage(error, 'Login failed'))
    }
  }
)

export const register = createAsyncThunk<void, RegisterRequest, { rejectValue: string }>(
  'auth/register',
  async (data, { rejectWithValue }) => {
    try {
      await authApi.register(data)
    } catch (error: unknown) {
      return rejectWithValue(extractErrorMessage(error, 'Registration failed'))
    }
  }
)

export const getMe = createAsyncThunk<IUser, void, { rejectValue: string }>(
  'auth/getMe',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authApi.getMe()
      return response.data.data
    } catch (error: unknown) {
      return rejectWithValue(extractErrorMessage(error, 'Failed to get user'))
    }
  }
)

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await authApi.logout()
  } finally {
    setAccessToken(null)
  }
})

export const refreshToken = createAsyncThunk<IUser, void, { rejectValue: string }>(
  'auth/refresh',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authApi.refresh()
      setAccessToken(response.data.data.accessToken)
      return response.data.data.user
    } catch {
      setAccessToken(null)
      return rejectWithValue('Session expired')
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: state => {
      state.error = null
    }
  },
  extraReducers: builder => {
    builder
      .addCase(login.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload
        state.isAuthenticated = true
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload ?? null
      })
      .addCase(register.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(register.fulfilled, state => {
        state.loading = false
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload ?? null
      })
      .addCase(getMe.fulfilled, (state, action) => {
        state.user = action.payload
        state.isAuthenticated = true
      })
      .addCase(getMe.rejected, state => {
        state.user = null
        state.isAuthenticated = false
      })
      .addCase(logout.fulfilled, state => {
        state.user = null
        state.isAuthenticated = false
      })
      .addCase(refreshToken.pending, state => {
        state.loading = true
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload
        state.isAuthenticated = true
      })
      .addCase(refreshToken.rejected, state => {
        state.loading = false
        state.user = null
        state.isAuthenticated = false
      })
  }
})

export const { clearError } = authSlice.actions
export default authSlice.reducer

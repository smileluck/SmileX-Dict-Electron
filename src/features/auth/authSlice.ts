import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { authApi, type AuthUser } from '../../services/api'
import type { RootState } from '../../store'

interface AuthState {
  token: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

const initialState: AuthState = {
  token: null,
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
}

// Load token from localStorage on init
const savedToken = localStorage.getItem('smilex_dict_token')
if (savedToken) {
  initialState.token = savedToken
  initialState.isAuthenticated = true
}

export const fetchCurrentUser = createAsyncThunk<
  AuthUser,
  void,
  { state: RootState }
>('auth/fetchCurrentUser', async () => {
  return await authApi.getMe()
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth(state, action: PayloadAction<{ token: string; user: AuthUser }>) {
      state.token = action.payload.token
      state.user = action.payload.user
      state.isAuthenticated = true
      state.loading = false
      state.error = null
      localStorage.setItem('smilex_dict_token', action.payload.token)
    },
    clearAuth(state) {
      state.token = null
      state.user = null
      state.isAuthenticated = false
      state.loading = false
      state.error = null
      localStorage.removeItem('smilex_dict_token')
    },
    setError(state, action: PayloadAction<string>) {
      state.error = action.payload
      state.loading = false
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchCurrentUser.fulfilled, (state, action) => {
      state.user = action.payload
      state.isAuthenticated = true
    })
    builder.addCase(fetchCurrentUser.rejected, (state) => {
      state.isAuthenticated = false
      state.token = null
      state.user = null
      localStorage.removeItem('smilex_dict_token')
    })
  },
})

export const { setAuth, clearAuth, setError, setLoading } = authSlice.actions
export default authSlice.reducer

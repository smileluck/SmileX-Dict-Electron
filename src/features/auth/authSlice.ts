import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../../store'
import type { AuthUser } from '../../services/api'
import { authApi, dictsApi } from '../../services/api'
import type { DictItem, DictSource } from '../dicts/dictsSlice'

export const fetchCurrentUser = createAsyncThunk<
  AuthUser,
  void,
  { state: RootState }
>('auth/fetchCurrentUser', async () => {
  return await authApi.getMe()
})

export const logoutUser = createAsyncThunk<
  void,
  void,
  { state: RootState }
>('auth/logoutUser', async (_, { dispatch }) => {
  await authApi.logout()
  dispatch(clearAuth())
})

export const loadUserDicts = createAsyncThunk<
  DictItem[],
  void,
  { state: RootState }
>('auth/loadUserDicts', async (_, { rejectWithValue }) => {
  try {
    const serverDicts = await dictsApi.list()
    // 合并本地特殊词典和服务器词典
    const specialIds = ['collected', 'wrong', 'mastered']
    const allDicts = [
      ...specialIds.map(id => ({ id, name: '', wordCount: 0, source: 'special' as DictSource })),
      ...serverDicts
    ]
    return allDicts
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : '加载词典失败')
  }
})

interface AuthState {
  token: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
  mine: DictItem[]
}

const initialState: AuthState = {
  token: localStorage.getItem('smilex_dict_token'),
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  mine: [],
}

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
    },
    clearAuth(state) {
      state.token = null
      state.user = null
      state.isAuthenticated = false
      state.loading = false
      state.error = null
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
    })
    builder.addCase(loadUserDicts.fulfilled, (state, action) => {
      // 词典加载成功,合并到mine中
      const specialIds = ['collected', 'wrong', 'mastered']
      const specialDicts = state.mine.filter(d => specialIds.includes(d.id))
      const serverDicts = action.payload.filter(d => !specialIds.includes(d.id))
      state.mine = [...specialDicts, ...serverDicts]
    })
    builder.addCase(loadUserDicts.rejected, (_state, action) => {
      console.error('加载词典失败:', action.error)
    })
  },
})

export const { setAuth, clearAuth, setError, setLoading } = authSlice.actions
export default authSlice.reducer

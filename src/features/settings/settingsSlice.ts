import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../../store'
import { settingsApi } from '../../services/api'

export interface UserSettings {
  userId: string
  username: string
  dailyNewWordTarget: number
}

interface SettingsState {
  settings: UserSettings | null
  loading: boolean
  error: string | null
}

const initialState: SettingsState = {
  settings: null,
  loading: false,
  error: null,
}

export const fetchSettings = createAsyncThunk<
  UserSettings,
  void,
  { state: RootState }
>('settings/fetchSettings', async () => {
  return await settingsApi.get()
})

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setSettings(state, action: PayloadAction<UserSettings>) {
      state.settings = action.payload
      state.loading = false
      state.error = null
    },
    updateSettings(state, action: PayloadAction<Partial<UserSettings>>) {
      if (state.settings) {
        state.settings = { ...state.settings, ...action.payload }
      }
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
    builder.addCase(fetchSettings.pending, (state) => {
      state.loading = true
      state.error = null
    })
    builder.addCase(fetchSettings.fulfilled, (state, action) => {
      state.settings = action.payload
      state.loading = false
    })
    builder.addCase(fetchSettings.rejected, (state, action) => {
      state.loading = false
      state.error = action.error.message || 'Failed to fetch settings'
    })
  },
})

export const { setSettings, updateSettings, setError, setLoading } = settingsSlice.actions
export default settingsSlice.reducer

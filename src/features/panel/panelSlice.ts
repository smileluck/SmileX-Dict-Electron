import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

export interface DailyStat {
  date: string
  newCount: number
  reviewCount: number
  dictationCount: number
}

interface PanelState {
  signinDates: string[]
  stats: DailyStat[]
}

const today = new Date().toISOString().slice(0,10)

const initialState: PanelState = {
  signinDates: [],
  stats: [{ date: today, newCount: 0, reviewCount: 0, dictationCount: 0 }],
}

const panelSlice = createSlice({
  name: 'panel',
  initialState,
  reducers: {
    signIn(state) {
      if (!state.signinDates.includes(today)) state.signinDates.push(today)
    },
    updateToday(state, action: PayloadAction<Partial<Omit<DailyStat,'date'>>>) {
      const s = state.stats.find(x=>x.date===today)
      if (!s) state.stats.push({ date: today, newCount: 0, reviewCount: 0, dictationCount: 0 })
      const t = state.stats.find(x=>x.date===today)!
      Object.assign(t, action.payload)
    },
  },
})

export const { signIn, updateToday } = panelSlice.actions
export default panelSlice.reducer
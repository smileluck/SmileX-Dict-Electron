import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

export interface DailyStat {
  date: string
  newCount: number
  reviewCount: number
  dictationCount: number
  wrongCount: number
}

interface PanelState {
  signinDates: string[]
  stats: DailyStat[]
  historyStats: DailyStat[]
}

const today = new Date().toISOString().slice(0,10)

const initialState: PanelState = {
  signinDates: [],
  stats: [{ date: today, newCount: 0, reviewCount: 0, dictationCount: 0, wrongCount: 0 }],
  historyStats: [],
}

// Calculate streak from signin dates
function calcStreak(dates: string[]): number {
  if (dates.length === 0) return 0
  const sorted = [...dates].sort().reverse()
  const todayDate = new Date().toISOString().slice(0, 10)
  
  // Check if today is in the list; if not, streak might include yesterday
  const checkDate = new Date(todayDate)
  if (!sorted.includes(todayDate)) {
    // If not signed in today, check from yesterday
    checkDate.setDate(checkDate.getDate() - 1)
  }
  
  let streak = 0
  
  for (let i = 0; i < 365; i++) {
    const d = new Date(checkDate)
    d.setDate(d.getDate() - i)
    const dStr = d.toISOString().slice(0, 10)
    if (sorted.includes(dStr)) {
      streak++
    } else {
      break
    }
  }
  return streak
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
      if (!s) state.stats.push({ date: today, newCount: 0, reviewCount: 0, dictationCount: 0, wrongCount: 0 })
      const t = state.stats.find(x=>x.date===today)!
      Object.assign(t, action.payload)
    },
    setHistoryStats(state, action: PayloadAction<DailyStat[]>) {
      state.historyStats = action.payload
    },
  },
})

export const { signIn, updateToday, setHistoryStats } = panelSlice.actions
export { calcStreak }
export default panelSlice.reducer

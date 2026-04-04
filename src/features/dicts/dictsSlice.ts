import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

export type DictSource = 'system' | 'custom' | 'special'

export interface DictItem {
  id: string
  name: string
  wordCount: number
  source: DictSource
}

interface DictsState {
  activeId?: string
  mine: DictItem[]
  recommend: DictItem[]
}

const initialState: DictsState = {
  activeId: undefined,
  mine: [
    { id: 'collected', name: '收藏', wordCount: 0, source: 'special' },
    { id: 'wrong', name: '错词本', wordCount: 0, source: 'special' },
    { id: 'mastered', name: '已掌握', wordCount: 0, source: 'special' },
  ],
  recommend: [
    { id: 'cet4', name: 'CET-4 大学英语四级', wordCount: 2607, source: 'system' },
    { id: 'cet6', name: 'CET-6 大学英语六级', wordCount: 2345, source: 'system' },
    { id: 'toefl', name: 'TOEFL 托福', wordCount: 4264, source: 'system' },
    { id: 'ielts', name: 'IELTS 雅思', wordCount: 3575, source: 'system' },
    { id: 'gre', name: 'GRE 研究生入学', wordCount: 3251, source: 'system' },
    { id: 'bec-h', name: 'BEC高级 商务英语', wordCount: 2593, source: 'system' },
    { id: 'tem8', name: 'TEM-8 专八词汇', wordCount: 6193, source: 'system' },
  ],
}

const dictsSlice = createSlice({
  name: 'dicts',
  initialState,
  reducers: {
    setActive(state, action: PayloadAction<string | undefined>) {
      state.activeId = action.payload
    },
    addCustom(state, action: PayloadAction<{ name: string; wordCount?: number }>) {
      const id = `d${Date.now()}`
      state.mine.push({ id, name: action.payload.name, wordCount: action.payload.wordCount ?? 0, source: 'custom' })
    },
    setDicts(state, action: PayloadAction<DictItem[]>) {
      const specialIds = ['collected', 'wrong', 'mastered']
      const specialDicts = state.mine.filter(d => specialIds.includes(d.id))
      const serverDicts = action.payload.filter(d => !specialIds.includes(d.id))
      state.mine = [...specialDicts, ...serverDicts]
    },
    addServerDict(state, action: PayloadAction<DictItem>) {
      const specialIds = ['collected', 'wrong', 'mastered']
      if (!specialIds.includes(action.payload.id)) {
        const exists = state.mine.find(d => d.id === action.payload.id)
        if (!exists) {
          state.mine.push(action.payload)
        }
      }
    },
    updateDict(state, action: PayloadAction<{ id: string; updates: Partial<DictItem> }>) {
      const dict = state.mine.find(d => d.id === action.payload.id)
      if (dict) {
        Object.assign(dict, action.payload.updates)
      }
    },
    removeDict(state, action: PayloadAction<string>) {
      state.mine = state.mine.filter(d => d.id !== action.payload)
      if (state.activeId === action.payload) {
        state.activeId = undefined
      }
    },
    updateSpecialCounts(state, action: PayloadAction<{ collected: number; wrong: number; mastered: number }>) {
      const m = state.mine
      const upd = (id: string, n: number) => { const d = m.find(i=>i.id===id); if (d) d.wordCount = n }
      upd('collected', action.payload.collected)
      upd('wrong', action.payload.wrong)
      upd('mastered', action.payload.mastered)
    },
  },
})

export const { setActive, addCustom, setDicts, addServerDict, updateDict, removeDict, updateSpecialCounts } = dictsSlice.actions
export default dictsSlice.reducer
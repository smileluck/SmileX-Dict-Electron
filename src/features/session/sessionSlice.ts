import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

export type InputMode = 'follow' | 'review' | 'dictation'
export type PracticeType = 'word' | 'article'

interface SessionState {
  practiceType: PracticeType
  inputMode: InputMode
  currentId?: string
  freeMode: boolean
}

const initialState: SessionState = {
  practiceType: 'word',
  inputMode: 'follow',
  freeMode: false,
}

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setPracticeType(state, action: PayloadAction<PracticeType>) {
      state.practiceType = action.payload
    },
    setInputMode(state, action: PayloadAction<InputMode>) {
      state.inputMode = action.payload
    },
    setCurrentId(state, action: PayloadAction<string | undefined>) {
      state.currentId = action.payload
    },
    toggleFreeMode(state) {
      state.freeMode = !state.freeMode
    },
  },
})

export const { setPracticeType, setInputMode, setCurrentId, toggleFreeMode } = sessionSlice.actions
export default sessionSlice.reducer
import { configureStore } from '@reduxjs/toolkit'
import wordsReducer from '../features/words/wordsSlice'
import articlesReducer from '../features/articles/articlesSlice'
import sessionReducer from '../features/session/sessionSlice'
import dictsReducer from '../features/dicts/dictsSlice'
import panelReducer from '../features/panel/panelSlice'

export const store = configureStore({
  reducer: {
    words: wordsReducer,
    articles: articlesReducer,
    session: sessionReducer,
    dicts: dictsReducer,
    panel: panelReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
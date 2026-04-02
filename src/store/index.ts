import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import wordsReducer from '../features/words/wordsSlice'
import articlesReducer from '../features/articles/articlesSlice'
import sessionReducer from '../features/session/sessionSlice'
import dictsReducer from '../features/dicts/dictsSlice'
import panelReducer from '../features/panel/panelSlice'

const persistConfig = {
  key: 'smilex-dict',
  storage,
  whitelist: ['words', 'dicts', 'panel', 'articles'], // Only persist these reducers
}

const persistedWordsReducer = persistReducer(persistConfig, wordsReducer)
const persistedDictsReducer = persistReducer(persistConfig, dictsReducer)
const persistedPanelReducer = persistReducer(persistConfig, panelReducer)
const persistedArticlesReducer = persistReducer(persistConfig, articlesReducer)

export const store = configureStore({
  reducer: {
    words: persistedWordsReducer,
    articles: persistedArticlesReducer,
    session: sessionReducer,
    dicts: persistedDictsReducer,
    panel: persistedPanelReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'persist/REGISTER'],
      },
    }),
})

export const persistor = persistStore(store)
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

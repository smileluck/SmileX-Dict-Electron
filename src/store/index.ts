import { configureStore, combineReducers } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import wordsReducer from '../features/words/wordsSlice'
import articlesReducer from '../features/articles/articlesSlice'
import dictsReducer from '../features/dicts/dictsSlice'
import panelReducer from '../features/panel/panelSlice'
import authReducer from '../features/auth/authSlice'
import settingsReducer from '../features/settings/settingsSlice'

const persistConfig = {
  key: 'smilex-dict',
  storage,
  whitelist: ['words', 'dicts', 'panel', 'articles', 'settings'],
}

const rootReducer = combineReducers({
  words: wordsReducer,
  articles: articlesReducer,
  dicts: dictsReducer,
  panel: panelReducer,
  auth: authReducer,
  settings: settingsReducer,
})

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'persist/REGISTER'],
      },
    }),
})

export const persistor = persistStore(store)
export type RootState = ReturnType<typeof rootReducer>
export type AppDispatch = typeof store.dispatch

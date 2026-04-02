import { configureStore, combineReducers } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import wordsReducer from '../features/words/wordsSlice'
import articlesReducer from '../features/articles/articlesSlice'
import sessionReducer from '../features/session/sessionSlice'
import dictsReducer from '../features/dicts/dictsSlice'
import panelReducer from '../features/panel/panelSlice'
import authReducer from '../features/auth/authSlice'

const persistConfig = {
  key: 'smilex-dict',
  storage,
  whitelist: ['words', 'dicts', 'panel', 'articles'], // Persist these reducers; auth uses localStorage directly
}

const rootReducer = combineReducers({
  words: wordsReducer,
  articles: articlesReducer,
  session: sessionReducer,
  dicts: dictsReducer,
  panel: panelReducer,
  auth: authReducer,
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

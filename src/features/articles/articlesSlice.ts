import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

export type ArticleType = 'article' | 'book'

export interface ArticleItem {
  id: string
  title: string
  content: string
  contentZh?: string
  type: ArticleType
}

interface ArticlesState {
  items: ArticleItem[]
}

const initialState: ArticlesState = {
  items: [
    { id: 'a1', title: '常见书籍 · 英语短文1', content: 'Learning English helps expand your world...', type: 'article' },
  ],
}

const articlesSlice = createSlice({
  name: 'articles',
  initialState,
  reducers: {
    addArticle(state, action: PayloadAction<Omit<ArticleItem,'id'>>) {
      const id = `${Date.now()}`
      state.items.push({ id, ...action.payload })
    },
    setArticles(state, action: PayloadAction<ArticleItem[]>) {
      state.items = action.payload
    },
    removeArticle(state, action: PayloadAction<string>) {
      state.items = state.items.filter(i => i.id !== action.payload)
    },
  },
})

export const { addArticle, setArticles, removeArticle } = articlesSlice.actions
export default articlesSlice.reducer
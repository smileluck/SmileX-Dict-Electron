import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

export type WordStatus = 'new' | 'wrong' | 'mastered' | 'collected'

export interface WordItem {
  id: string
  term: string
  meaning: string
  example?: string
  ipa?: string
  synonyms?: string[]
  synonymsNote?: string
  status: WordStatus
  reviewCount: number
  dictId?: string // 所属词典ID
  // 记忆算法相关字段
  efactor: number // 记忆因子 (Easiness Factor), 范围 1.3-2.5
  interval: number // 下次复习间隔天数
  nextReviewDate: string // 下次复习日期 (ISO格式)
  lastReviewDate?: string // 上次复习日期 (ISO格式)
  repetitions: number // 连续正确次数
}

interface WordsState {
  items: WordItem[]
}

const initialState: WordsState = {
  items: [
    { id: '1', term: 'abandon', ipa: '/əˈbændən/', meaning: '放弃；丢弃', example: 'They had to abandon the project.', synonyms: ['give up','desert'], synonymsNote: 'give up 通常指停止做某事；desert 更强调抛弃责任或人。', status: 'new', reviewCount: 0, dictId: 'cet4', efactor: 2.5, interval: 0, nextReviewDate: new Date().toISOString(), repetitions: 0 },
    { id: '2', term: 'benevolent', ipa: '/bɪˈnevələnt/', meaning: '仁慈的；乐善好施的', example: 'A benevolent donor', synonyms: ['kind','charitable'], synonymsNote: 'kind 泛指善良；charitable 强调施舍或慈善。', status: 'new', reviewCount: 0, dictId: 'cet6', efactor: 2.5, interval: 0, nextReviewDate: new Date().toISOString(), repetitions: 0 },
    { id: '3', term: 'candid', ipa: '/ˈkændɪd/', meaning: '坦率的；直言不讳的', example: 'A candid discussion', synonyms: ['frank','honest'], synonymsNote: 'frank 更直接，有时显得生硬；honest 更广义。', status: 'new', reviewCount: 0, dictId: 'toefl', efactor: 2.5, interval: 0, nextReviewDate: new Date().toISOString(), repetitions: 0 },
  ],
}

const wordsSlice = createSlice({
  name: 'words',
  initialState,
  reducers: {
    markWrong(state, action: PayloadAction<string>) {
      const w = state.items.find(i => i.id === action.payload)
      if (w) w.status = 'wrong'
    },
    markMastered(state, action: PayloadAction<string>) {
      const w = state.items.find(i => i.id === action.payload)
      if (w) w.status = 'mastered'
    },
    toggleCollect(state, action: PayloadAction<string>) {
      const w = state.items.find(i => i.id === action.payload)
      if (w) w.status = w.status === 'collected' ? 'new' : 'collected'
    },
    incrementReview(state, action: PayloadAction<string>) {
      const w = state.items.find(i => i.id === action.payload)
      if (w) w.reviewCount += 1
    },
    addWord(state, action: PayloadAction<Omit<WordItem,'id'|'reviewCount'|'status'|'efactor'|'interval'|'nextReviewDate'|'lastReviewDate'|'repetitions'> & { dictId?: string }>) {
      const id = `${Date.now()}`
      state.items.push({ 
        id, 
        reviewCount: 0, 
        status: 'new', 
        efactor: 2.5, // 初始记忆因子
        interval: 0, // 初始间隔为0天
        nextReviewDate: new Date().toISOString(), // 今天需要复习
        repetitions: 0, // 初始连续正确次数为0
        ...action.payload 
      })
    },
    // 处理单词复习结果，使用SM-2算法更新记忆相关字段
    reviewWord(state, action: PayloadAction<{ wordId: string; quality: number }>) {
      const { wordId, quality } = action.payload
      const word = state.items.find(w => w.id === wordId)
      if (!word) return

      // 更新复习次数
      word.reviewCount += 1
      word.lastReviewDate = new Date().toISOString()

      if (quality < 3) {
        // 回答错误或困难，重置记忆状态
        word.repetitions = 0
        word.interval = 0
        word.status = 'wrong'
      } else {
        // 回答正确，更新记忆因子和间隔
        // 计算新的记忆因子：EF' = EF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
        word.efactor = Math.max(1.3, Math.min(2.5, word.efactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))))
        word.repetitions += 1
        
        // 计算新的间隔
        if (word.repetitions === 1) {
          word.interval = 1 // 第一次正确，1天后复习
        } else if (word.repetitions === 2) {
          word.interval = 6 // 第二次正确，6天后复习
        } else {
          word.interval = Math.round(word.interval * word.efactor) // 之后按记忆因子递增
        }
        
        // 如果连续正确次数达到5次，标记为已掌握
        if (word.repetitions >= 5) {
          word.status = 'mastered'
        } else {
          word.status = 'new' // 保持活跃状态
        }
      }
      
      // 计算下次复习日期
      const nextDate = new Date()
      nextDate.setDate(nextDate.getDate() + word.interval)
      word.nextReviewDate = nextDate.toISOString()
    },
  },
})

export const { markWrong, markMastered, toggleCollect, incrementReview, addWord, reviewWord } = wordsSlice.actions
export default wordsSlice.reducer
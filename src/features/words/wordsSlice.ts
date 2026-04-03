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
  dictId?: string
  // Enhanced SM2 algorithm fields
  efactor: number
  interval: number
  nextReviewDate: string
  lastReviewDate?: string
  repetitions: number
  // New enhanced fields for better learning
  difficulty: number // 1-5 difficulty level
  importance: number // 1-3 importance level (basic/essential/advanced)
  category: string // vocabulary category (academic/daily/professional etc.)
  learningStreak: number // consecutive learning sessions
  averageQuality: number // average response quality (0-6)
  lastResponseQuality: number // last response quality
  fatigueFactor: number // learning fatigue factor (0-1)
  responseTime: number // average response time in milliseconds
  contextualReviews: number // number of context-based reviews
}

interface WordsState {
  items: WordItem[]
}

const initialState: WordsState = {
  items: [
    { id: '1', term: 'abandon', ipa: '/əˈbændən/', meaning: '放弃；丢弃', example: 'They had to abandon the project.', synonyms: ['give up','desert'], synonymsNote: 'give up 通常指停止做某事；desert 更强调抛弃责任或人。', status: 'new', reviewCount: 0, dictId: 'cet4', efactor: 2.5, interval: 0, nextReviewDate: new Date().toISOString(), repetitions: 0, difficulty: 2, importance: 2, category: 'daily', learningStreak: 0, averageQuality: 0, lastResponseQuality: 0, fatigueFactor: 1.0, responseTime: 0, contextualReviews: 0 },
    { id: '2', term: 'benevolent', ipa: '/bɪˈnevələnt/', meaning: '仁慈的；乐善好施的', example: 'A benevolent donor', synonyms: ['kind','charitable'], synonymsNote: 'kind 泛指善良；charitable 强调施舍或慈善。', status: 'new', reviewCount: 0, dictId: 'cet6', efactor: 2.5, interval: 0, nextReviewDate: new Date().toISOString(), repetitions: 0, difficulty: 4, importance: 3, category: 'academic', learningStreak: 0, averageQuality: 0, lastResponseQuality: 0, fatigueFactor: 1.0, responseTime: 0, contextualReviews: 0 },
    { id: '3', term: 'candid', ipa: '/ˈkændɪd/', meaning: '坦率的；直言不讳的', example: 'A candid discussion', synonyms: ['frank','honest'], synonymsNote: 'frank 更直接，有时显得生硬；honest 更广义。', status: 'new', reviewCount: 0, dictId: 'toefl', efactor: 2.5, interval: 0, nextReviewDate: new Date().toISOString(), repetitions: 0, difficulty: 4, importance: 3, category: 'academic', learningStreak: 0, averageQuality: 0, lastResponseQuality: 0, fatigueFactor: 1.0, responseTime: 0, contextualReviews: 0 },
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
    addWord(state, action: PayloadAction<Omit<WordItem,'id'|'reviewCount'|'status'|'efactor'|'interval'|'nextReviewDate'|'lastReviewDate'|'repetitions'|'difficulty'|'importance'|'category'|'learningStreak'|'averageQuality'|'lastResponseQuality'|'fatigueFactor'|'responseTime'|'contextualReviews'> & { dictId?: string }>) {
      const id = `${Date.now()}`
      state.items.push({ 
        id, 
        reviewCount: 0, 
        status: 'new', 
        efactor: 2.5,
        interval: 0,
        nextReviewDate: new Date().toISOString(),
        repetitions: 0,
        difficulty: 3,
        importance: 2,
        category: 'general',
        learningStreak: 0,
        averageQuality: 0,
        lastResponseQuality: 0,
        fatigueFactor: 1.0,
        responseTime: 0,
        contextualReviews: 0,
        ...action.payload 
      })
    },
    // 处理单词复习结果，使用增强SM-2算法更新记忆相关字段
    reviewWord(state, action: PayloadAction<{ wordId: string; quality: number; responseTime?: number; learningContext?: 'typing' | 'recall' | 'multiple_choice' | 'context' }>) {
      const { wordId, quality, responseTime, learningContext = 'recall' } = action.payload
      const word = state.items.find(w => w.id === wordId)
      if (!word) return

      // 更新复习次数和时间
      word.reviewCount += 1
      word.lastResponseQuality = quality
      
      // 计算平均响应时间
      if (responseTime) {
        word.responseTime = Math.round((word.responseTime * (word.reviewCount - 1) + responseTime) / word.reviewCount)
      }
      
      // 更新语境学习次数
      if (learningContext === 'context') {
        word.contextualReviews += 1
      }

      // 更新平均质量
      word.averageQuality = Math.round((word.averageQuality * (word.reviewCount - 1) + quality) / word.reviewCount)

      // 检测学习疲劳度
      if (word.responseTime > 10000) { // 超过10秒
        word.fatigueFactor = Math.min(1.0, word.fatigueFactor + 0.1)
      } else if (word.responseTime < 3000) { // 少于3秒
        word.fatigueFactor = Math.max(0.1, word.fatigueFactor - 0.05)
      }

      if (quality < 3) {
        // 回答错误或困难，重置记忆状态
        word.repetitions = 0
        word.interval = 0
        word.status = 'wrong'
        
        // 根据重要性调整记忆因子降低程度
        const difficultyPenalty = word.importance === 3 ? 0.15 : word.importance === 2 ? 0.1 : 0.05
        word.efactor = Math.max(1.3, word.efactor - difficultyPenalty)
        
        // 增加学习疲劳度（错误学习会让人疲惫）
        word.fatigueFactor = Math.min(1.0, word.fatigueFactor + 0.15)
      } else {
        // 回答正确，更新记忆因子和间隔
        let qualityMultiplier = 0.1
        
        // 质量评分调整（支持0-6分）
        if (quality >= 6) {
          // 完全掌握，额外奖励
          qualityMultiplier = 0.15
          word.repetitions += 1 // 额外增加连续次数
        } else if (quality === 5) {
          qualityMultiplier = 0.1
        } else if (quality === 4) {
          qualityMultiplier = 0.05
        }
        
        // 基于学习模式的调整
        let contextMultiplier = 1.0
        if (learningContext === 'context') {
          contextMultiplier = 1.1 // 语境学习效果更好
        } else if (learningContext === 'typing') {
          contextMultiplier = 1.05 // 打字练习略有优势
        }
        
        // 基于难度的记忆因子调整范围
        let efactorMin = 1.3
        let efactorMax = 2.5
        if (word.difficulty >= 4) {
          efactorMax = 2.2 // 高难度单词记忆因子调整范围更小
        }
        
        // 计算新的记忆因子
        word.efactor = Math.max(efactorMin, Math.min(efactorMax, 
          word.efactor + (qualityMultiplier - (6 - quality) * (0.08 + (6 - quality) * 0.02))) * contextMultiplier)
        
        word.repetitions += 1
        
        // 计算新的间隔（考虑疲劳度）
        let baseInterval: number
        if (word.repetitions === 1) {
          baseInterval = 1
        } else if (word.repetitions === 2) {
          baseInterval = 6
        } else if (word.repetitions === 3) {
          baseInterval = Math.round(6 * word.efactor)
        } else {
          baseInterval = Math.round(word.interval * word.efactor)
        }
        
        // 应用疲劳度调整
        const fatigueAdjustment = word.fatigueFactor < 0.5 ? 1.2 : word.fatigueFactor > 0.8 ? 0.8 : 1.0
        word.interval = Math.round(baseInterval * fatigueAdjustment)
        
        // 考虑重要性对间隔的影响
        if (word.importance === 3) {
          word.interval = Math.round(word.interval * 1.1) // 重要单词间隔更长
        }
        
        // 如果连续正确次数达到5次，标记为已掌握
        if (word.repetitions >= 5) {
          word.status = 'mastered'
        } else {
          word.status = 'new'
        }
        
        // 减少学习疲劳度（成功学习会减少疲劳）
        word.fatigueFactor = Math.max(0.1, word.fatigueFactor - 0.05)
      }
      
      // 更新学习连续次数
      const today = new Date().toISOString().split('T')[0]
      const lastReview = word.lastReviewDate ? new Date(word.lastReviewDate).toISOString().split('T')[0] : null
      if (lastReview === today) {
        word.learningStreak += 1
      } else {
        word.learningStreak = 1
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
import type { WordItem } from '../features/words/wordsSlice'

/**
 * 计算单词优先级分数
 * 分数越高，优先级越高
 */
export function calculateWordPriority(word: WordItem): number {
  let priority = 0
  
  // 1. 错词优先级最高
  if (word.status === 'wrong') return 1000
  
  // 2. 基于重要性的权重
  priority += word.importance * 200
  
  // 3. 基于难度的权重
  priority += word.difficulty * 80
  
  // 4. 基于疲劳度的惩罚
  priority -= word.fatigueFactor * 50
  
  // 5. 基于复习间隔的紧急程度
  const daysUntilReview = calculateDaysUntilReview(word)
  priority += Math.max(0, 7 - daysUntilReview) * 15
  
  // 6. 基于学习连续次数的奖励
  priority += word.learningStreak * 5
  
  // 7. 基于语境学习次数的奖励
  priority += word.contextualReviews * 3
  
  // 8. 基于平均质量调整
  if (word.averageQuality >= 5) {
    priority -= 20 // 高质量单词可以稍微降低优先级
  } else if (word.averageQuality < 3) {
    priority += 30 // 低质量单词提高优先级
  }
  
  return priority
}

/**
 * 计算距离下次复习的天数
 */
export function calculateDaysUntilReview(word: WordItem): number {
  if (!word.nextReviewDate) return 0
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const reviewDate = new Date(word.nextReviewDate)
  reviewDate.setHours(0, 0, 0, 0)
  
  const diffTime = reviewDate.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * 智能排序算法
 * 根据多个维度对单词进行排序
 */
export function sortWordsByPriority(words: WordItem[]): WordItem[] {
  return words.sort((a, b) => {
    const aPriority = calculateWordPriority(a)
    const bPriority = calculateWordPriority(b)
    return bPriority - aPriority // 降序排列，优先级高的在前
  })
}

/**
 * 根据状态分组排序
 */
export function sortWordsByStatus(words: WordItem[]): WordItem[] {
  const wrongWords = words.filter(w => w.status === 'wrong')
  const reviewWords = words.filter(w => w.status !== 'wrong' && w.status !== 'mastered' && 
    new Date(w.nextReviewDate) <= new Date())
  const newWords = words.filter(w => w.status === 'new' && 
    new Date(w.nextReviewDate) > new Date())
  const masteredWords = words.filter(w => w.status === 'mastered')
  
  // 对每个组内进行优先级排序
  const sortedWrong = sortWordsByPriority(wrongWords)
  const sortedReview = sortWordsByPriority(reviewWords)
  const sortedNew = sortWordsByPriority(newWords)
  
  return [...sortedWrong, ...sortedReview, ...sortedNew, ...masteredWords]
}

/**
 * 获取待学习的单词队列
 */
export function getLearningQueue(words: WordItem[]): WordItem[] {
  const today = new Date().toISOString().split('T')[0]
  
  // 筛选需要学习的单词（已掌握的不包括）
  const pendingWords = words.filter(w => 
    w.status !== 'mastered' && 
    w.nextReviewDate.split('T')[0] <= today
  )
  
  // 按状态优先级排序
  return sortWordsByStatus(pendingWords)
}

/**
 * 计算单词疲劳度预警
 */
export function getFatigueWarning(word: WordItem): {
  isFatigued: boolean
  level: 'low' | 'medium' | 'high'
  message: string
} {
  if (word.fatigueFactor >= 0.8) {
    return {
      isFatigued: true,
      level: 'high',
      message: '学习疲劳度高，建议休息一下'
    }
  } else if (word.fatigueFactor >= 0.6) {
    return {
      isFatigued: true,
      level: 'medium',
      message: '学习疲劳度中等，可以适当降低学习强度'
    }
  } else if (word.fatigueFactor >= 0.4) {
    return {
      isFatigued: false,
      level: 'low',
      message: '学习疲劳度正常'
    }
  } else {
    return {
      isFatigued: false,
      level: 'low',
      message: '学习状态良好'
    }
  }
}

/**
 * 获取学习建议
 */
export function getLearningSuggestion(word: WordItem): string {
  const { isFatigued, level } = getFatigueWarning(word)
  
  if (isFatigued) {
    switch (level) {
      case 'high':
        return '建议休息5-10分钟后再继续学习'
      case 'medium':
        return '建议减少单词数量，专注于质量'
      default:
        return '注意保持良好的学习节奏'
    }
  }
  
  switch (word.importance) {
    case 3:
      return '这是高级词汇，需要特别注意用法和例句'
    case 2:
      return '这是常用词汇，建议熟练掌握'
    case 1:
      return '这是基础词汇，要确保拼写准确'
    default:
      return '继续保持良好的学习状态'
  }
}
import { useState, useMemo } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '../../store'
import type { WordItem } from '../../features/words/wordsSlice'
import Icon from '../Icon'

interface LearningPath {
  id: string
  title: string
  description: string
  milestones: Milestone[]
}

interface Milestone {
  id: string
  title: string
  targetWords: number
  completed: boolean
  words: string[]
}

interface Recommendation {
  type: 'new_words' | 'review_words' | 'focus_areas'
  priority: number
  reason: string
  estimatedTime: number
  words: WordItem[]
}

const LEARNING_PATHS: LearningPath[] = [
  {
    id: 'tem4',
    title: '英语专业四级 (TEM-4)',
    description: '针对英语专业四级考试的词汇学习路径',
    milestones: [
      { id: 'tem4_1', title: '基础词汇 (3000-4000)', targetWords: 1000, completed: false, words: [] },
      { id: 'tem4_2', title: '核心词汇 (4000-5000)', targetWords: 1000, completed: false, words: [] },
      { id: 'tem4_3', title: '高频词汇 (5000-6000)', targetWords: 1000, completed: false, words: [] },
      { id: 'tem4_4', title: '冲刺词汇 (6000+)', targetWords: 500, completed: false, words: [] },
    ],
  },
  {
    id: 'tem8',
    title: '英语专业八级 (TEM-8)',
    description: '针对英语专业八级考试的高级词汇路径',
    milestones: [
      { id: 'tem8_1', title: '高级核心词汇', targetWords: 1500, completed: false, words: [] },
      { id: 'tem8_2', title: '学术词汇扩展', targetWords: 1000, completed: false, words: [] },
      { id: 'tem8_3', title: '文学与文化词汇', targetWords: 800, completed: false, words: [] },
      { id: 'tem8_4', title: '翻译与写作词汇', targetWords: 700, completed: false, words: [] },
    ],
  },
  {
    id: 'ielts_7',
    title: '雅思 7.0+ 目标',
    description: '针对雅思考试7分以上的词汇准备路径',
    milestones: [
      { id: 'ielts_1', title: '基础学术词汇', targetWords: 1200, completed: false, words: [] },
      { id: 'ielts_2', title: '话题词汇 (教育/科技)', targetWords: 800, completed: false, words: [] },
      { id: 'ielts_3', title: '话题词汇 (环境/社会)', targetWords: 800, completed: false, words: [] },
      { id: 'ielts_4', title: '写作高级词汇', targetWords: 600, completed: false, words: [] },
    ],
  },
]

export default function LearningPath() {
  const words = useSelector((s: RootState) => s.words.items)
  const [selectedPath, setSelectedPath] = useState<string>('tem4')
  const [showRecommendations, setShowRecommendations] = useState(true)

  const currentPath = useMemo(
    () => LEARNING_PATHS.find(p => p.id === selectedPath),
    [selectedPath]
  )

  const stats = useMemo(() => {
    const total = words.length
    const mastered = words.filter(w => w.status === 'mastered').length
    const wrong = words.filter(w => w.status === 'wrong').length
    const newWords = words.filter(w => w.status === 'new').length
    const reviewing = words.filter(w => w.status !== 'mastered' && w.status !== 'new' && w.status !== 'wrong').length
    return { total, mastered, wrong, newWords, reviewing }
  }, [words])

  const recommendations = useMemo((): Recommendation[] => {
    const recs: Recommendation[] = []
    const today = new Date().toISOString().split('T')[0]

    // Review words recommendation
    const reviewWords = words.filter(
      w => w.status !== 'mastered' && w.nextReviewDate.split('T')[0] <= today
    )
    if (reviewWords.length > 0) {
      recs.push({
        type: 'review_words',
        priority: 100,
        reason: `有 ${reviewWords.length} 个单词需要复习`,
        estimatedTime: Math.round(reviewWords.length * 1.5),
        words: reviewWords.slice(0, 20),
      })
    }

    // Wrong words focus
    const wrongWords = words.filter(w => w.status === 'wrong')
    if (wrongWords.length > 0) {
      recs.push({
        type: 'focus_areas',
        priority: 90,
        reason: `${wrongWords.length} 个错词需要重点复习`,
        estimatedTime: Math.round(wrongWords.length * 2),
        words: wrongWords.slice(0, 10),
      })
    }

    // New words recommendation
    const newWords = words.filter(w => w.status === 'new').slice(0, 15)
    if (newWords.length > 0) {
      recs.push({
        type: 'new_words',
        priority: 80,
        reason: `建议学习 ${newWords.length} 个新词`,
        estimatedTime: Math.round(newWords.length * 2),
        words: newWords,
      })
    }

    return recs.sort((a, b) => b.priority - a.priority)
  }, [words])

  const difficultyDistribution = useMemo(() => {
    const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    words.forEach(w => {
      const d = Math.min(5, Math.max(1, w.difficulty))
      dist[d as keyof typeof dist]++
    })
    return dist
  }, [words])

  return (
    <div className="space-y-4">
      {/* Learning path selector */}
      <div className="rounded-xl border bg-white p-4">
        <h3 className="font-semibold text-lg flex items-center gap-2 mb-3">
          <Icon name="map" size={20} className="text-brand-600" />
          个性化学习路径
        </h3>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {LEARNING_PATHS.map(path => (
            <button
              key={path.id}
              onClick={() => setSelectedPath(path.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedPath === path.id
                  ? 'bg-brand-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {path.title}
            </button>
          ))}
        </div>
        {currentPath && (
          <p className="text-sm text-gray-600 mt-2">{currentPath.description}</p>
        )}
      </div>

      {/* Progress overview */}
      <div className="rounded-xl border bg-white p-4">
        <h4 className="font-medium text-gray-700 mb-3">学习进度概览</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <div className="text-2xl font-bold text-gray-700">{stats.total}</div>
            <div className="text-xs text-gray-500">总词汇</div>
          </div>
          <div className="rounded-lg bg-green-50 p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.mastered}</div>
            <div className="text-xs text-gray-500">已掌握</div>
          </div>
          <div className="rounded-lg bg-blue-50 p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.newWords}</div>
            <div className="text-xs text-gray-500">新词</div>
          </div>
          <div className="rounded-lg bg-red-50 p-3 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.wrong}</div>
            <div className="text-xs text-gray-500">错词</div>
          </div>
        </div>

        {/* Difficulty distribution */}
        <div className="mt-4">
          <h5 className="text-sm font-medium text-gray-700 mb-2">词汇难度分布</h5>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(level => (
              <div key={level} className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-16">
                  {level === 1 ? '基础' : level === 2 ? '入门' : level === 3 ? '中等' : level === 4 ? '困难' : '高级'}
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-3 relative overflow-hidden">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      level >= 4 ? 'bg-red-400' : level >= 3 ? 'bg-yellow-400' : 'bg-green-400'
                    }`}
                    style={{
                      width: `${stats.total > 0 ? (difficultyDistribution[level as keyof typeof difficultyDistribution] / stats.total) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-8 text-right">
                  {difficultyDistribution[level as keyof typeof difficultyDistribution]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Milestones */}
      {currentPath && (
        <div className="rounded-xl border bg-white p-4">
          <h4 className="font-medium text-gray-700 mb-3">学习里程碑</h4>
          <div className="space-y-3">
            {currentPath.milestones.map((milestone, idx) => (
              <div
                key={milestone.id}
                className={`flex items-start gap-3 p-3 rounded-lg border ${
                  milestone.completed
                    ? 'bg-green-50 border-green-200'
                    : idx === currentPath.milestones.findIndex(m => !m.completed)
                    ? 'bg-brand-50 border-brand-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    milestone.completed
                      ? 'bg-green-500 text-white'
                      : idx === currentPath.milestones.findIndex(m => !m.completed)
                      ? 'bg-brand-500 text-white'
                      : 'bg-gray-300 text-white'
                  }`}
                >
                  {milestone.completed ? '✓' : idx + 1}
                </div>
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900">{milestone.title}</h5>
                  <p className="text-sm text-gray-500">
                    目标: {milestone.targetWords} 词
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="rounded-xl border bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-700 flex items-center gap-2">
            <Icon name="lightbulb" size={16} className="text-yellow-500" />
            今日推荐
          </h4>
          <button
            onClick={() => setShowRecommendations(!showRecommendations)}
            className="text-xs text-brand-600 hover:text-brand-700"
          >
            {showRecommendations ? '收起' : '展开'}
          </button>
        </div>
        {showRecommendations && (
          <div className="space-y-3">
            {recommendations.map((rec, idx) => (
              <div key={idx} className="rounded-lg border p-3 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900 text-sm">
                    {rec.type === 'review_words' && '复习任务'}
                    {rec.type === 'focus_areas' && '重点复习'}
                    {rec.type === 'new_words' && '新词学习'}
                  </span>
                  <span className="text-xs text-gray-500">约 {rec.estimatedTime} 分钟</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{rec.reason}</p>
                {rec.words.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {rec.words.slice(0, 8).map(w => (
                      <span key={w.id} className="text-xs bg-white border px-2 py-0.5 rounded">
                        {w.term}
                      </span>
                    ))}
                    {rec.words.length > 8 && (
                      <span className="text-xs text-gray-400">+{rec.words.length - 8} 更多</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

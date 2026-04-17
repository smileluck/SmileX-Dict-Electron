import { useState, useCallback } from 'react'
import type { WordItem } from '../../features/words/wordsSlice'
import Icon from '../Icon'

interface PronunciationExerciseProps {
  word: WordItem
  onComplete?: (score: number) => void
}

interface PronunciationFeedback {
  score: number
  issues: Array<{
    type: 'stress' | 'intonation' | 'phoneme' | 'rhythm'
    position: number
    severity: number
    suggestion: string
  }>
  improvement: string[]
}

const COMMON_MISTAKES: Record<string, string[]> = {
  'th': ['注意咬舌音 /θ/ 和 /ð/ 的区别', '舌尖要放在上下齿之间'],
  'r': ['注意卷舌音的力度', '不要和中文的 r 混淆'],
  'l': ['注意舌尖抵住上齿龈', '不要和 /r/ 混淆'],
  'v': ['上齿要轻咬下唇', '声带振动'],
  'w': ['双唇要收圆', '不要和 /v/ 混淆'],
}

const PHONEME_TIPS: Record<string, string> = {
  'ə': '中央元音，发音最放松',
  'ɪ': '短元音，比 /i:/ 短促',
  'æ': '张口元音，嘴巴张大',
  'ʌ': '短促有力，像"啊"的短版',
  'ʊ': '短促的 /u:/',
  'ʃ': '类似中文的"诗"',
  'ʒ': '类似中文的"日"但声带振动',
  'ŋ': '鼻音，类似"ng"',
  'dʒ': '类似"之"但声带振动',
  'tʃ': '类似"吃"',
}

export default function PronunciationExercise({ word, onComplete }: PronunciationExerciseProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [, setHasRecorded] = useState(false)
  const [feedback, setFeedback] = useState<PronunciationFeedback | null>(null)
  const [showTips, setShowTips] = useState(false)
  const [attempts, setAttempts] = useState(0)

  const getRelevantTips = useCallback((): string[] => {
    const tips: string[] = []
    const ipa = word.ipa || ''

    Object.entries(PHONEME_TIPS).forEach(([phoneme, tip]) => {
      if (ipa.includes(phoneme)) {
        tips.push(`${phoneme}: ${tip}`)
      }
    })

    Object.entries(COMMON_MISTAKES).forEach(([key, mistakes]) => {
      if (word.term.toLowerCase().includes(key)) {
        tips.push(...mistakes)
      }
    })

    return tips
  }, [word])

  const simulateRecording = useCallback(() => {
    setIsRecording(true)
    setHasRecorded(false)
    setFeedback(null)

    setTimeout(() => {
      setIsRecording(false)
      setHasRecorded(true)
      setAttempts(prev => prev + 1)

      const score = Math.floor(Math.random() * 30) + 70
      const issues: PronunciationFeedback['issues'] = []

      if (word.ipa?.includes('θ') || word.ipa?.includes('ð')) {
        issues.push({
          type: 'phoneme',
          position: word.ipa.indexOf('θ') >= 0 ? word.ipa.indexOf('θ') : word.ipa.indexOf('ð'),
          severity: 0.3,
          suggestion: '注意 th 发音，舌尖要放在上下齿之间',
        })
      }

      if (word.term.length > 3) {
        issues.push({
          type: 'stress',
          position: Math.floor(word.term.length / 2),
          severity: 0.2,
          suggestion: '注意重音位置',
        })
      }

      const improvement: string[] = []
      if (score < 80) {
        improvement.push('多听标准发音，模仿语调')
        improvement.push('注意音节划分和重音位置')
      }
      if (score < 90) {
        improvement.push('放慢语速，逐音节练习')
      }

      setFeedback({
        score,
        issues,
        improvement,
      })

      onComplete?.(score)
    }, 2000)
  }, [word, onComplete])

  const tips = getRelevantTips()

  return (
    <div className="glass-card p-4 space-y-4">
      <div className="text-center">
        <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">{word.term}</div>
        {word.ipa && <div className="text-lg text-gray-500 dark:text-gray-400 mb-2">{word.ipa}</div>}
        <div className="text-sm text-gray-600 dark:text-gray-400">{word.meaning}</div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">音节划分</h4>
        <div className="flex items-center justify-center gap-1">
          {word.term.split(/(?<=[aeiou])/i).map((syllable, idx) => (
            <span
              key={idx}
              className={`px-2 py-1 rounded text-lg font-medium ${
                idx === 0 ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              {syllable}
            </span>
          ))}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
          高亮部分为重读音节
        </p>
      </div>

      <div className="flex flex-col items-center gap-3">
        <button
          onClick={simulateRecording}
          disabled={isRecording}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
            isRecording
              ? 'bg-red-500 text-white animate-pulse'
              : 'bg-gradient-to-br from-brand-400 to-brand-600 text-white hover:opacity-90'
          }`}
        >
          {isRecording ? (
            <div className="flex flex-col items-center">
              <Icon name="mic" size={24} />
              <span className="text-xs mt-1">录音中...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Icon name="mic" size={24} />
              <span className="text-xs mt-1">开始发音</span>
            </div>
          )}
        </button>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {isRecording ? '正在录音，请朗读单词...' : '点击按钮开始发音练习'}
        </span>
        {attempts > 0 && (
          <span className="text-xs text-gray-400 dark:text-gray-500">已练习 {attempts} 次</span>
        )}
      </div>

      {feedback && (
        <div className="space-y-3">
          <div className={`rounded-lg p-4 text-center ${
            feedback.score >= 90 ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50' :
            feedback.score >= 80 ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50' :
            'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50'
          }`}>
            <div className={`text-4xl font-bold ${
              feedback.score >= 90 ? 'text-green-600 dark:text-green-400' :
              feedback.score >= 80 ? 'text-yellow-600 dark:text-yellow-400' :
              'text-red-600 dark:text-red-400'
            }`}>
              {feedback.score}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {feedback.score >= 90 ? '发音优秀！' :
               feedback.score >= 80 ? '发音良好，继续加油！' :
               '需要多加练习'}
            </div>
          </div>

          {feedback.issues.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">需要注意的问题</h4>
              <div className="space-y-2">
                {feedback.issues.map((issue, idx) => (
                  <div key={idx} className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2">
                    <span className="text-amber-500 text-sm">⚠</span>
                    <div>
                      <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                        {issue.type === 'stress' ? '重音' :
                         issue.type === 'phoneme' ? '音素' :
                         issue.type === 'intonation' ? '语调' : '节奏'}
                      </span>
                      <p className="text-sm text-amber-800 dark:text-amber-300">{issue.suggestion}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {feedback.improvement.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800/50">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">改进建议</h4>
              <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                {feedback.improvement.map((tip, idx) => (
                  <li key={idx}>• {tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {tips.length > 0 && (
        <div>
          <button
            onClick={() => setShowTips(!showTips)}
            className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium flex items-center gap-1"
          >
            <Icon name="info" size={14} />
            {showTips ? '收起发音提示' : '展开发音提示'}
          </button>
          {showTips && (
            <div className="mt-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3 border border-gray-200 dark:border-gray-700/50 space-y-1">
              {tips.map((tip, idx) => (
                <p key={idx} className="text-xs text-gray-600 dark:text-gray-400">• {tip}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from '../store'
import { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { reviewWord, toggleCollect, markWrong } from '../features/words/wordsSlice'
import Icon from '../components/Icon'
import SpeakButton from '../components/SpeakButton'
import { statsApi, learningApi } from '../services/api'
import { getLearningQueue, getFatigueWarning, getLearningSuggestion } from '../utils/priorityQueue'

type Mode = 'type' | 'confirm'

export default function PracticeWords() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const words = useSelector((s: RootState) => s.words.items)
  const dicts = useSelector((s: RootState) => s.dicts)
  const [mode, setMode] = useState<Mode>('type')
  const [selectedDictId, setSelectedDictId] = useState<string | undefined>(dicts.activeId)
  const responseTimeRef = useRef(performance.now())
  const [index, setIndex] = useState(0)
  const [input, setInput] = useState('')
  const [result, setResult] = useState<'correct' | 'wrong' | undefined>(undefined)

  const allDicts = useMemo(() => {
    const special = dicts.mine.filter(d => ['collected', 'wrong', 'mastered'].includes(d.id))
    const custom = dicts.mine.filter(d => !['collected', 'wrong', 'mastered'].includes(d.id))
    return [...special, ...custom, ...dicts.recommend]
  }, [dicts.mine, dicts.recommend])

  const queue = useMemo(() => {
    let filtered = words

    if (selectedDictId) {
      if (selectedDictId === 'collected') {
        filtered = words.filter(w => w.status === 'collected')
      } else if (selectedDictId === 'wrong') {
        filtered = words.filter(w => w.status === 'wrong')
      } else if (selectedDictId === 'mastered') {
        filtered = words.filter(w => w.status === 'mastered')
      } else {
        filtered = words.filter(w => w.dictId === selectedDictId)
      }
    }

    const pendingQueue = getLearningQueue(filtered)
    
    return pendingQueue
  }, [words, selectedDictId])

  const current = queue[index] ?? queue[0]

  useEffect(() => {
    responseTimeRef.current = performance.now()
  }, [index])

  const next = useCallback(() => {
    setInput('')
    setResult(undefined)
    setIndex(i => (i + 1) % queue.length)
    responseTimeRef.current = performance.now()
  }, [queue.length])

  const handleDictChange = (dictId: string) => {
    setSelectedDictId(dictId || undefined)
    setIndex(0)
    setInput('')
    setResult(undefined)
  }

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode)
    setInput('')
    setResult(undefined)
  }

  const sendEvent = (type: 'new' | 'review' | 'dictation' | 'wrong') => {
    statsApi.addEvent({ type }).catch(() => {})
  }

  const calculateSimilarity = (s1: string, s2: string): number => {
    if (s1 === s2) return 1.0
    if (s1.length === 0 || s2.length === 0) return 0.0

    const matrix: number[][] = []
    for (let i = 0; i <= s2.length; i++) {
      matrix[i] = [i]
    }
    for (let j = 0; j <= s1.length; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= s2.length; i++) {
      for (let j = 1; j <= s1.length; j++) {
        const cost = s2.charAt(i - 1) === s1.charAt(j - 1) ? 0 : 1
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        )
      }
    }

    const distance = matrix[s2.length][s1.length]
    const maxLength = Math.max(s1.length, s2.length)
    return 1 - distance / maxLength
  }

  const submitType = () => {
    if (!current) return

    const wasNew = current.status === 'new'
    const userInput = input.trim().toLowerCase()
    const correctTerm = current.term.toLowerCase()
    const ok = userInput === correctTerm

    let quality: number

    if (!ok) {
      const similarity = calculateSimilarity(userInput, correctTerm)
      if (similarity < 0.3) {
        quality = 0
      } else if (similarity < 0.7) {
        quality = 1
      } else {
        quality = 2
      }
    } else {
      quality = 4
    }

    const responseTime = responseTimeRef.current > 0 ? Math.round(performance.now() - responseTimeRef.current) : undefined

    dispatch(reviewWord({ 
      wordId: current.id, 
      quality,
      responseTime,
      learningContext: 'typing'
    }))
    learningApi.reviewWord(current.id, quality, responseTime, 'typing').catch(() => {})
    sendEvent('dictation')

    if (wasNew && ok) {
      sendEvent('new')
    }
    if (!ok) {
      sendEvent('wrong')
    }

    setResult(ok ? 'correct' : 'wrong')
  }

  const submitConfirm = (ok: boolean) => {
    if (!current) return

    const wasNew = current.status === 'new'
    const quality = ok ? 4 : 2

    dispatch(reviewWord({ wordId: current.id, quality }))
    learningApi.reviewWord(current.id, quality, undefined, 'recall').catch(() => {})
    sendEvent('review')

    if (wasNew && ok) {
      sendEvent('new')
    }
    if (!ok) {
      sendEvent('wrong')
    }

    next()
  }

  const handleToggleCollect = () => {
    if (!current) return
    dispatch(toggleCollect(current.id))
  }

  const handleMarkWrong = () => {
    if (!current) return
    dispatch(markWrong(current.id))
  }

  const handleNextFromResult = () => {
    next()
  }

  const modeButtons: { key: Mode; label: string }[] = [
    { key: 'type', label: t('practice.typingMode') },
    { key: 'confirm', label: t('practice.confirmMode') },
  ]

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === 'Enter') {
          if (result) {
            handleNextFromResult()
          }
        }
        return
      }
      if (mode === 'confirm' && current) {
        if (e.key === '1') submitConfirm(true)
        if (e.key === '2') submitConfirm(false)
        if (e.key === '3') next()
      }
      if (result && e.key === 'Enter') {
        handleNextFromResult()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mode, result, current])

  const isCollected = current?.status === 'collected'
  const isWrong = current?.status === 'wrong'
  
  const fatigueWarning = current ? getFatigueWarning(current) : null
  const learningSuggestion = current ? getLearningSuggestion(current) : null

  if (queue.length === 0) {
    return (
      <div className="space-y-4 page-enter">
        <div className="glass-card p-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('practice.selectDict')}</label>
          <select
            className="w-full input-glass"
            value={selectedDictId || ''}
            onChange={e => handleDictChange(e.target.value)}
          >
            <option value="">{t('practice.allWords')}</option>
            {allDicts.map(d => (
              <option key={d.id} value={d.id}>{d.name} ({t('practice.wordsUnit', { count: d.wordCount })})</option>
            ))}
          </select>
        </div>

        <div className="glass-card p-8 text-center">
          <Icon name="book-open" size={40} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <div className="text-gray-500 dark:text-gray-400 mb-2">{t('practice.noWordsTitle')}</div>
          <div className="text-sm text-gray-400 dark:text-gray-500">{t('practice.noWordsHint')}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 page-enter">
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-gradient-brand rounded-full h-1.5 transition-all duration-500 ease-out"
          style={{ width: `${queue.length > 0 ? ((index + 1) / queue.length) * 100 : 0}%` }}
        />
      </div>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <select
            className="w-full input-glass"
            value={selectedDictId || ''}
            onChange={e => handleDictChange(e.target.value)}
          >
            <option value="">{t('practice.allWords')}</option>
            {allDicts.map(d => (
              <option key={d.id} value={d.id}>{d.name} ({t('practice.wordsUnit', { count: d.wordCount })})</option>
            ))}
          </select>
        </div>
        <div className="flex gap-1 flex-wrap">
          {modeButtons.map(m => (
            <button
              key={m.key}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${mode === m.key ? 'bg-brand-500/10 dark:bg-brand-400/15 border-brand-400 dark:border-brand-500 text-brand-700 dark:text-brand-400' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
              onClick={() => handleModeChange(m.key)}
            >
              {m.label}
            </button>
          ))}
        </div>
        <span className="text-sm text-gray-600 dark:text-gray-400">{index + 1} / {queue.length}</span>
      </div>

      {current && (
        <div className="space-y-2">
          {fatigueWarning && fatigueWarning.isFatigued && (
            <div className={`rounded-xl p-3 border text-sm ${
              fatigueWarning.level === 'high' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400' :
              fatigueWarning.level === 'medium' ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400' :
              'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400'
            }`}>
              <div className="flex items-center gap-2">
                <span>⚠️</span>
                <span>{fatigueWarning.message}</span>
              </div>
            </div>
          )}
          {learningSuggestion && (
            <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 text-sm text-blue-700 dark:text-blue-400">
              <div className="flex items-center gap-2">
                <span>💡</span>
                <span>{learningSuggestion}</span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="glass-card p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <>
              <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Icon name="dict" /> <span>{current?.term}</span>
                <SpeakButton text={current?.term || ''} />
              </div>
              <div className="text-gray-600 dark:text-gray-400">{current?.ipa}</div>
              <div className="mt-2 text-gray-900 dark:text-gray-100">{current?.meaning}</div>
              {current?.example && <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">{t('practice.example')}{current.example}</div>}
              {current?.synonyms && current.synonyms.length > 0 && <div className="mt-1 text-sm text-gray-700 dark:text-gray-300">{t('practice.synonyms')}{current.synonyms.join(', ')}</div>}
              {current?.synonymsNote && <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('practice.difference')}{current.synonymsNote}</div>}
            </>
          </div>

          <div className="flex gap-1 ml-3">
            <button
              className={`p-2 rounded-lg border transition-all duration-200 ${isCollected ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-400 dark:border-amber-600 text-amber-600 dark:text-amber-400' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700'}`}
              onClick={handleToggleCollect}
              title={isCollected ? t('practice.uncollect') : t('practice.collect')}
            >
              <Icon name="star" size={16} className={isCollected ? 'text-amber-500 dark:text-amber-400' : 'text-gray-400 dark:text-gray-500'} />
            </button>
            <button
              className={`p-2 rounded-lg border transition-all duration-200 ${isWrong ? 'bg-red-100 dark:bg-red-900/30 border-red-400 dark:border-red-600 text-red-600 dark:text-red-400' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700'}`}
              onClick={handleMarkWrong}
              title={t('practice.addToWrongBook')}
            >
              <Icon name="wrong" size={16} className={isWrong ? 'text-red-500 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'} />
            </button>
          </div>
        </div>

        {mode === 'type' ? (
          <div className="mt-4">
            <input className="w-full input-glass" placeholder={t('practice.inputPlaceholder')} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !result && submitType()} />
            <div className="mt-3 flex gap-2">
              <button className="btn-primary" onClick={submitType} disabled={!!result}>{t('practice.confirm')}</button>
              <button className="btn-secondary" onClick={handleNextFromResult}>{t('practice.skip')}</button>
            </div>
            {result && (
              <div className={`mt-3 text-sm font-medium ${result === 'correct' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg px-3 py-2' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg px-3 py-2'}`}>
                {result === 'correct' ? t('practice.correct') : t('practice.wrong', { term: current?.term })}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 flex gap-2">
            <button className="px-3 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-all duration-200" onClick={() => submitConfirm(true)}>{t('practice.mastered')}</button>
            <button className="px-3 py-2 bg-red-600 dark:bg-red-500 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-all duration-200" onClick={() => submitConfirm(false)}>{t('practice.notMastered')}</button>
            <button className="btn-secondary" onClick={next}>{t('practice.next')}</button>
          </div>
        )}

        <div className="mt-3 flex gap-3 text-xs text-gray-400 dark:text-gray-500">
          <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">{t('practice.shortcuts')}</span>
          {mode === 'type' && <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">{t('practice.shortcutType')}</span>}
          {mode === 'confirm' && <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">{t('practice.shortcutConfirm')}</span>}
        </div>
      </div>
    </div>
  )
}

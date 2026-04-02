import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from '../store'
import { useMemo, useState, useCallback } from 'react'
import { reviewWord, toggleCollect, markWrong } from '../features/words/wordsSlice'
import Icon from '../components/Icon'
import { API_BASE } from '../config'

type Mode = 'type' | 'confirm' | 'zh-en' | 'en-en'

export default function PracticeWords() {
  const dispatch = useDispatch()
  const words = useSelector((s: RootState) => s.words.items)
  const dicts = useSelector((s: RootState) => s.dicts)
  const [mode, setMode] = useState<Mode>('type')
  const [selectedDictId, setSelectedDictId] = useState<string | undefined>(dicts.activeId)
  const [index, setIndex] = useState(0)
  const [input, setInput] = useState('')
  const [result, setResult] = useState<'correct' | 'wrong' | undefined>(undefined)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [options, setOptions] = useState<string[]>([])

  // All available dictionaries for selection
  const allDicts = useMemo(() => {
    const special = dicts.mine.filter(d => ['collected', 'wrong', 'mastered'].includes(d.id))
    const custom = dicts.mine.filter(d => !['collected', 'wrong', 'mastered'].includes(d.id))
    return [...special, ...custom, ...dicts.recommend]
  }, [dicts.mine, dicts.recommend])

  // Filter words by selected dictionary
  const queue = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
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

    return filtered.filter(w =>
      w.status !== 'mastered' &&
      w.nextReviewDate.split('T')[0] <= today
    )
  }, [words, selectedDictId])

  const current = queue[index] ?? queue[0]

  // Generate options for en-en mode
  const generateOptions = useCallback((correctMeaning: string) => {
    const otherWords = words.filter(w => w.id !== current?.id && w.meaning && w.meaning !== correctMeaning)
    const shuffled = [...otherWords].sort(() => Math.random() - 0.5)
    const distractors = shuffled.slice(0, 3).map(w => w.meaning)
    // If not enough distractors, add placeholder
    while (distractors.length < 3) {
      distractors.push('—')
    }
    const allOptions = [correctMeaning, ...distractors].sort(() => Math.random() - 0.5)
    setOptions(allOptions)
    setSelectedOption(null)
  }, [words, current])

  const next = useCallback(() => {
    setInput('')
    setResult(undefined)
    setSelectedOption(null)
    setOptions([])
    setIndex(i => (i + 1) % queue.length)
  }, [queue.length])

  const handleDictChange = (dictId: string) => {
    setSelectedDictId(dictId || undefined)
    setIndex(0)
    setInput('')
    setResult(undefined)
    setSelectedOption(null)
    setOptions([])
  }

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode)
    setInput('')
    setResult(undefined)
    setSelectedOption(null)
    setOptions([])
    // Generate options when switching to en-en mode
    if (newMode === 'en-en' && current) {
      generateOptions(current.meaning)
    }
  }

  // Send stats event helper
  const sendEvent = (type: 'new' | 'review' | 'dictation' | 'wrong') => {
    fetch(`${API_BASE}/api/stats/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type })
    })
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

    dispatch(reviewWord({ wordId: current.id, quality }))
    sendEvent('dictation')

    if (wasNew && ok) {
      sendEvent('new')
    }
    if (!ok) {
      sendEvent('wrong')
    }

    setResult(ok ? 'correct' : 'wrong')
  }

  const submitZhEn = () => {
    if (!current) return

    const wasNew = current.status === 'new'
    const userInput = input.trim().toLowerCase()
    const correctTerm = current.term.toLowerCase()
    const ok = userInput === correctTerm

    const quality = ok ? 4 : 1

    dispatch(reviewWord({ wordId: current.id, quality }))
    sendEvent('review')

    if (wasNew && ok) {
      sendEvent('new')
    }
    if (!ok) {
      sendEvent('wrong')
    }

    setResult(ok ? 'correct' : 'wrong')
  }

  const submitEnEn = (optionIdx: number) => {
    if (!current || result) return

    const selected = options[optionIdx]
    const ok = selected === current.meaning
    const wasNew = current.status === 'new'
    const quality = ok ? 4 : 1

    dispatch(reviewWord({ wordId: current.id, quality }))
    sendEvent('review')

    if (wasNew && ok) {
      sendEvent('new')
    }
    if (!ok) {
      sendEvent('wrong')
    }

    setSelectedOption(optionIdx)
    setResult(ok ? 'correct' : 'wrong')
  }

  const submitConfirm = (ok: boolean) => {
    if (!current) return

    const wasNew = current.status === 'new'
    const quality = ok ? 4 : 2

    dispatch(reviewWord({ wordId: current.id, quality }))
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

  // Generate options when current word changes in en-en mode
  const handleNextFromResult = () => {
    next()
    if (mode === 'en-en' && queue[(index + 1) % queue.length]) {
      generateOptions(queue[(index + 1) % queue.length].meaning)
    }
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

  const isCollected = current?.status === 'collected'
  const isWrong = current?.status === 'wrong'

  const modeButtons: { key: Mode; label: string }[] = [
    { key: 'type', label: '打字拼写' },
    { key: 'confirm', label: '快速确认' },
    { key: 'zh-en', label: '中→英' },
    { key: 'en-en', label: '英→英' },
  ]

  if (queue.length === 0) {
    return (
      <div className="space-y-4">
        {/* Dictionary selector */}
        <div className="rounded-xl border bg-white p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">选择词典</label>
          <select
            className="w-full border rounded px-3 py-2 text-sm"
            value={selectedDictId || ''}
            onChange={e => handleDictChange(e.target.value)}
          >
            <option value="">全部单词</option>
            {allDicts.map(d => (
              <option key={d.id} value={d.id}>{d.name} ({d.wordCount}词)</option>
            ))}
          </select>
        </div>

        <div className="rounded-xl border bg-white p-8 text-center">
          <div className="text-gray-400 text-4xl mb-3">📚</div>
          <div className="text-gray-500 mb-2">暂无需要复习的单词</div>
          <div className="text-sm text-gray-400">请在词典页面选择一个词库开始学习，或切换到其他词典</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Dictionary selector + mode toggle */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <select
            className="w-full border rounded px-3 py-1.5 text-sm"
            value={selectedDictId || ''}
            onChange={e => handleDictChange(e.target.value)}
          >
            <option value="">全部单词</option>
            {allDicts.map(d => (
              <option key={d.id} value={d.id}>{d.name} ({d.wordCount}词)</option>
            ))}
          </select>
        </div>
        <div className="flex gap-1 flex-wrap">
          {modeButtons.map(m => (
            <button
              key={m.key}
              className={`px-3 py-1 rounded border transition-colors text-sm ${mode === m.key ? 'bg-brand-100 border-brand-400 font-medium' : 'hover:bg-gray-50'}`}
              onClick={() => handleModeChange(m.key)}
            >
              {m.label}
            </button>
          ))}
        </div>
        <span className="text-sm text-gray-500">{index + 1} / {queue.length}</span>
      </div>

      {/* Practice card */}
      <div className="rounded-xl border bg-white p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* zh-en mode: show Chinese meaning, hide English term */}
            {mode === 'zh-en' ? (
              <>
                <div className="text-lg font-semibold text-gray-700">
                  {current?.meaning}
                </div>
                {current?.ipa && <div className="text-gray-500 text-sm mt-1">{current.ipa}</div>}
                {result && (
                  <div className="mt-2">
                    <div className="text-2xl font-semibold flex items-center gap-2">
                      <Icon name="dict" /> <span>{current?.term}</span>
                    </div>
                    {current?.example && <div className="mt-1 text-sm text-gray-700">例句：{current.example}</div>}
                    {current?.synonyms && current.synonyms.length > 0 && <div className="mt-1 text-sm text-gray-700">同义：{current.synonyms.join(', ')}</div>}
                  </div>
                )}
              </>
            ) : mode === 'en-en' ? (
              <>
                {/* en-en mode: show English term + example, hide meaning */}
                <div className="text-2xl font-semibold flex items-center gap-2">
                  <Icon name="dict" /> <span>{current?.term}</span>
                </div>
                {current?.ipa && <div className="text-gray-500">{current.ipa}</div>}
                {current?.example && <div className="mt-2 text-sm text-gray-700">例句：{current.example}</div>}
                {result && (
                  <div className="mt-2 p-2 rounded bg-gray-50">
                    <div className="text-sm font-medium text-gray-700">释义：{current?.meaning}</div>
                    {current?.synonymsNote && <div className="mt-1 text-xs text-gray-500">区别：{current.synonymsNote}</div>}
                  </div>
                )}
              </>
            ) : (
              <>
                {/* type / confirm mode: show everything */}
                <div className="text-2xl font-semibold flex items-center gap-2">
                  <Icon name="dict" /> <span>{current?.term}</span>
                </div>
                <div className="text-gray-600">{current?.ipa}</div>
                <div className="mt-2">{current?.meaning}</div>
                {current?.example && <div className="mt-2 text-sm text-gray-700">例句：{current.example}</div>}
                {current?.synonyms && current.synonyms.length > 0 && <div className="mt-1 text-sm text-gray-700">同义：{current.synonyms.join(', ')}</div>}
                {current?.synonymsNote && <div className="mt-1 text-xs text-gray-500">区别：{current.synonymsNote}</div>}
              </>
            )}
          </div>

          {/* Quick action buttons: collect & wrong */}
          <div className="flex gap-1 ml-3">
            <button
              className={`p-2 rounded border transition-colors ${isCollected ? 'bg-amber-100 border-amber-400 text-amber-600' : 'hover:bg-gray-50 text-gray-400'}`}
              onClick={handleToggleCollect}
              title={isCollected ? '取消收藏' : '收藏'}
            >
              <Icon name="star" size={16} className={isCollected ? 'text-amber-500' : 'text-gray-400'} />
            </button>
            <button
              className={`p-2 rounded border transition-colors ${isWrong ? 'bg-red-100 border-red-400 text-red-600' : 'hover:bg-gray-50 text-gray-400'}`}
              onClick={handleMarkWrong}
              title="加入错词本"
            >
              <Icon name="wrong" size={16} className={isWrong ? 'text-red-500' : 'text-gray-400'} />
            </button>
          </div>
        </div>

        {/* Mode-specific input area */}
        {mode === 'type' ? (
          <div className="mt-4">
            <input className="w-full border rounded px-3 py-2" placeholder="输入拼写" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !result && submitType()} />
            <div className="mt-3 flex gap-2">
              <button className="px-3 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors" onClick={submitType} disabled={!!result}>确认</button>
              <button className="px-3 py-2 border rounded hover:bg-gray-50 transition-colors" onClick={handleNextFromResult}>跳过</button>
            </div>
            {result && (
              <div className={`mt-3 text-sm font-medium ${result === 'correct' ? 'text-green-600' : 'text-red-600'}`}>
                {result === 'correct' ? '✓ 正确' : `✗ 错误，正确答案：${current?.term}`}
              </div>
            )}
          </div>
        ) : mode === 'zh-en' ? (
          <div className="mt-4">
            <input
              className="w-full border rounded px-3 py-2"
              placeholder="输入对应的英文单词"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !result && submitZhEn()}
              disabled={!!result}
            />
            <div className="mt-3 flex gap-2">
              {!result ? (
                <button className="px-3 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors" onClick={submitZhEn}>确认</button>
              ) : (
                <button className="px-3 py-2 bg-brand-500 text-white rounded hover:bg-brand-600 transition-colors" onClick={handleNextFromResult}>下一个</button>
              )}
              {!result && (
                <button className="px-3 py-2 border rounded hover:bg-gray-50 transition-colors" onClick={handleNextFromResult}>跳过</button>
              )}
            </div>
            {result && (
              <div className={`mt-3 text-sm font-medium ${result === 'correct' ? 'text-green-600' : 'text-red-600'}`}>
                {result === 'correct' ? '✓ 正确' : `✗ 错误，正确答案：${current?.term}`}
              </div>
            )}
          </div>
        ) : mode === 'en-en' ? (
          <div className="mt-4">
            {options.length >= 4 ? (
              <div className="grid grid-cols-1 gap-2">
                {options.map((opt, idx) => {
                  const isSelected = selectedOption === idx
                  const isCorrect = opt === current?.meaning
                  let btnClass = 'border rounded-lg p-3 text-left transition-colors text-sm '
                  if (result) {
                    if (isCorrect) {
                      btnClass += 'bg-green-50 border-green-400 text-green-700'
                    } else if (isSelected && !isCorrect) {
                      btnClass += 'bg-red-50 border-red-400 text-red-700'
                    } else {
                      btnClass += 'bg-gray-50 border-gray-200 text-gray-400'
                    }
                  } else {
                    btnClass += 'hover:bg-brand-50 hover:border-brand-300 cursor-pointer'
                  }
                  return (
                    <button
                      key={idx}
                      className={btnClass}
                      onClick={() => submitEnEn(idx)}
                      disabled={!!result}
                    >
                      <span className="font-medium mr-2 text-gray-400">{String.fromCharCode(65 + idx)}.</span>
                      {opt}
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="text-sm text-gray-400 text-center py-2">词库中单词不足，无法生成选项</div>
            )}
            {result && (
              <div className="mt-3 flex gap-2">
                <button className="px-3 py-2 bg-brand-500 text-white rounded hover:bg-brand-600 transition-colors" onClick={handleNextFromResult}>下一个</button>
              </div>
            )}
          </div>
        ) : (
          /* confirm mode */
          <div className="mt-4 flex gap-2">
            <button className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors" onClick={() => submitConfirm(true)}>掌握</button>
            <button className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors" onClick={() => submitConfirm(false)}>不掌握</button>
            <button className="px-3 py-2 border rounded hover:bg-gray-50 transition-colors" onClick={next}>下一条</button>
          </div>
        )}
      </div>
    </div>
  )
}

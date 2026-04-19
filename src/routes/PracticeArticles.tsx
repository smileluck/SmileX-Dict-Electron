import { useSelector } from 'react-redux'
import type { RootState } from '../store'
import { useMemo, useState } from 'react'
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { statsApi } from '../services/api'

type Mode = 'type' | 'read'

function renderDiff(expected: string, actual: string) {
  const len = Math.max(expected.length, actual.length)
  const spans: ReactElement[] = []
  for (let i = 0; i < len; i++) {
    const e = expected[i] ?? ''
    const a = actual[i] ?? ''
    const ok = e === a
    const ch = a || ' '
    spans.push(<span key={i} className={ok ? '' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}>{ch}</span>)
  }
  return <span className="font-mono break-all">{spans}</span>
}

export default function PracticeArticles() {
  const { t } = useTranslation()
  const articles = useSelector((s: RootState) => s.articles.items)
  const queue = useMemo(() => articles.filter(a=>a.type==='article' || a.type==='book'), [articles])
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<Mode>('type')
  const [showZh, setShowZh] = useState(true)
  const current = queue[index]

  const enLines = useMemo(() => (current?.content ?? '').split(/\r?\n/).filter(l => l.trim().length > 0), [current])
  const zhLines = useMemo(() => (current?.contentZh ?? '').split(/\r?\n/).filter(l => l.trim().length > 0), [current])
  const [lineIndex, setLineIndex] = useState(0)
  const [typed, setTyped] = useState('')
  const expected = enLines[lineIndex] ?? ''
  const isCorrect = typed === expected

  const nextLine = () => {
    if (isCorrect) {
      statsApi.addEvent({ type: 'dictation' }).catch(() => {})
    }
    setTyped('')
    setLineIndex(i => {
      const next = i + 1
      if (next < enLines.length) return next
      setIndex(a => (a + 1) % queue.length)
      return 0
    })
  }

  if (queue.length === 0) {
    return (
      <div className="space-y-4 page-enter">
        <div className="glass-card p-8 text-center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 text-gray-300 dark:text-gray-600"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          <div className="text-gray-500 dark:text-gray-400 mb-2">{t('practice.noArticles')}</div>
          <div className="text-sm text-gray-400 dark:text-gray-500">{t('practice.addArticlesFirst')}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 page-enter">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-2">
          <button className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${mode==='type'?'bg-brand-500/10 dark:bg-brand-400/15 border-brand-400 dark:border-brand-500 text-brand-700 dark:text-brand-400':'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`} onClick={()=>setMode('type')}>{t('practice.typingPractice')}</button>
          <button className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${mode==='read'?'bg-brand-500/10 dark:bg-brand-400/15 border-brand-400 dark:border-brand-500 text-brand-700 dark:text-brand-400':'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`} onClick={()=>setMode('read')}>{t('practice.readingMode')}</button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 dark:text-gray-400">{index + 1} / {queue.length}</span>
          <label className="text-sm inline-flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <input type="checkbox" className="accent-brand-600" checked={showZh} onChange={e=>setShowZh(e.target.checked)} /> {t('practice.showChinese')}
          </label>
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{current?.title}</div>
        {mode==='read' ? (
          <div className="space-y-3">
            {showZh && current?.contentZh && <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{current.contentZh}</div>}
            <div className="whitespace-pre-wrap text-gray-900 dark:text-gray-100">{current?.content}</div>
            <div className="mt-3">
              <button className="btn-secondary" onClick={() => { statsApi.addEvent({ type: 'review' }).catch(() => {}); setIndex(i=> (i+1) % queue.length) }}>{t('practice.nextArticle')}</button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-gray-500 dark:text-gray-400">{t('practice.line', { current: lineIndex + 1, total: enLines.length })}</div>
            {showZh && zhLines[lineIndex] && (
              <div className="text-sm text-gray-700 dark:text-gray-300">{t('practice.chineseLabel')}<span className="font-mono">{zhLines[lineIndex]}</span></div>
            )}
            <div className="text-gray-900 dark:text-gray-100">{t('practice.originalLabel')}<span className="font-mono">{expected}</span></div>
            <input className={`w-full input-glass font-mono transition-colors ${isCorrect?'border-green-500 dark:border-green-400':'border-gray-300 dark:border-gray-600'}`} placeholder={t('practice.inputLinePlaceholder')} value={typed} onChange={e=>setTyped(e.target.value)} onKeyDown={e=>e.key==='Enter'&&nextLine()} />
            <div className="text-sm text-gray-900 dark:text-gray-100">{t('practice.resultLabel')}{renderDiff(expected, typed)}</div>
            <div className="mt-3 flex gap-2">
              <button className={`px-3 py-2 rounded-lg transition-all duration-200 ${isCorrect?'bg-green-600 dark:bg-green-500 text-white hover:bg-green-700 dark:hover:bg-green-600':'bg-gray-900 dark:bg-gray-700 text-white hover:bg-gray-800 dark:hover:bg-gray-600'}`} onClick={nextLine}>{isCorrect ? t('practice.correctNextLine') : t('practice.nextLine')}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

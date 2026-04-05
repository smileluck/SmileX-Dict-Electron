import { useSelector } from 'react-redux'
import type { RootState } from '../store'
import { useMemo, useState } from 'react'
import type { ReactElement } from 'react'
import { API_BASE } from '../config'
import { useTranslation } from 'react-i18next'

type Mode = 'type' | 'read'

function renderDiff(expected: string, actual: string) {
  const len = Math.max(expected.length, actual.length)
  const spans: ReactElement[] = []
  for (let i = 0; i < len; i++) {
    const e = expected[i] ?? ''
    const a = actual[i] ?? ''
    const ok = e === a
    const ch = a || ' '
    spans.push(<span key={i} className={ok ? '' : 'bg-red-100 text-red-700'}>{ch}</span>)
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
      fetch(`${API_BASE}/api/stats/event`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'dictation'})})
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
      <div className="space-y-4">
        <div className="rounded-xl border bg-white p-8 text-center">
          <div className="text-gray-400 text-4xl mb-3">📖</div>
          <div className="text-gray-500 mb-2">{t('practice.noArticles')}</div>
          <div className="text-sm text-gray-400">{t('practice.addArticlesFirst')}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-2">
          <button className={`px-3 py-1 rounded border transition-colors ${mode==='type'?'bg-brand-100 border-brand-400':''}`} onClick={()=>setMode('type')}>{t('practice.typingPractice')}</button>
          <button className={`px-3 py-1 rounded border transition-colors ${mode==='read'?'bg-brand-100 border-brand-400':''}`} onClick={()=>setMode('read')}>{t('practice.readingMode')}</button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{index + 1} / {queue.length}</span>
          <label className="text-sm inline-flex items-center gap-2">
            <input type="checkbox" className="accent-brand-600" checked={showZh} onChange={e=>setShowZh(e.target.checked)} /> {t('practice.showChinese')}
          </label>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <div className="text-lg font-semibold mb-2">{current?.title}</div>
        {mode==='read' ? (
          <div className="space-y-3">
            {showZh && current?.contentZh && <div className="text-sm text-gray-700 whitespace-pre-wrap">{current.contentZh}</div>}
            <div className="whitespace-pre-wrap">{current?.content}</div>
            <div className="mt-3">
              <button className="px-3 py-2 border rounded hover:bg-gray-50 transition-colors" onClick={()=>{fetch(`${API_BASE}/api/stats/event`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'review'})}); setIndex(i=> (i+1) % queue.length)}}>{t('practice.nextArticle')}</button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-gray-500">{t('practice.line', { current: lineIndex + 1, total: enLines.length })}</div>
            {showZh && zhLines[lineIndex] && (
              <div className="text-sm text-gray-700">{t('practice.chineseLabel')}<span className="font-mono">{zhLines[lineIndex]}</span></div>
            )}
            <div>{t('practice.originalLabel')}<span className="font-mono">{expected}</span></div>
            <input className={`w-full border rounded px-3 py-2 font-mono transition-colors ${isCorrect?'border-green-500':'border-gray-300'}`} placeholder={t('practice.inputLinePlaceholder')} value={typed} onChange={e=>setTyped(e.target.value)} onKeyDown={e=>e.key==='Enter'&&nextLine()} />
            <div className="text-sm">{t('practice.resultLabel')}{renderDiff(expected, typed)}</div>
            <div className="mt-3 flex gap-2">
              <button className={`px-3 py-2 rounded transition-colors ${isCorrect?'bg-green-600 text-white hover:bg-green-700':'bg-gray-900 text-white hover:bg-gray-800'}`} onClick={nextLine}>{isCorrect ? t('practice.correctNextLine') : t('practice.nextLine')}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
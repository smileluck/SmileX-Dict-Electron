import { useSelector } from 'react-redux'
import type { RootState } from '../store'
import { useMemo, useState } from 'react'
import type { ReactElement } from 'react'
import { API_BASE } from '../config'

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
      // 下一篇文章
      setIndex(a => (a + 1) % queue.length)
      return 0
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button className={`px-3 py-1 rounded border ${mode==='type'?'bg-brand-100 border-brand-400':''}`} onClick={()=>setMode('type')}>打字拼写</button>
        <button className={`px-3 py-1 rounded border ${mode==='read'?'bg-brand-100 border-brand-400':''}`} onClick={()=>setMode('read')}>阅读文章</button>
        <label className="ml-2 text-sm inline-flex items-center gap-2">
          <input type="checkbox" className="accent-brand-600" checked={showZh} onChange={e=>setShowZh(e.target.checked)} /> 显示中文
        </label>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <div className="text-lg font-semibold mb-2">{current?.title}</div>
        {mode==='read' ? (
          <div className="space-y-3">
            {showZh && current?.contentZh && <div className="text-sm text-gray-700 whitespace-pre-wrap">{current.contentZh}</div>}
            <div className="whitespace-pre-wrap">{current?.content}</div>
            <div className="mt-3">
              <button className="px-3 py-2 border rounded" onClick={()=>{fetch(`${API_BASE}/api/stats/event`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'review'})}); setIndex(i=> (i+1) % queue.length)}}>下一篇</button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {showZh && zhLines[lineIndex] && (
              <div className="text-sm text-gray-700">中文：<span className="font-mono">{zhLines[lineIndex]}</span></div>
            )}
            <div>原文：<span className="font-mono">{expected}</span></div>
            <input className={`w-full border rounded px-3 py-2 font-mono ${isCorrect?'border-green-500':'border-gray-300'}`} placeholder="输入该行英文" value={typed} onChange={e=>setTyped(e.target.value)} />
            <div className="text-sm">结果：{renderDiff(expected, typed)}</div>
            <div className="mt-3 flex gap-2">
              <button className={`px-3 py-2 rounded ${isCorrect?'bg-green-600 text-white':'bg-gray-900 text-white'}`} onClick={nextLine}>{isCorrect?'正确，下一行':'下一行'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
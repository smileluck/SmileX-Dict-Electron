import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from '../store'
import { useMemo, useState } from 'react'
import { reviewWord } from '../features/words/wordsSlice'
import Icon from '../components/Icon'
import { API_BASE } from '../config'

type Mode = 'type' | 'confirm'

export default function PracticeWords() {
  const dispatch = useDispatch()
  const words = useSelector((s: RootState) => s.words.items)
  const [mode, setMode] = useState<Mode>('type')
  
  // 只包含需要复习的单词：未掌握且下次复习日期 <= 今天
  const queue = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    return words.filter(w => 
      w.status !== 'mastered' && 
      w.nextReviewDate.split('T')[0] <= today
    )
  }, [words])
  
  const [index, setIndex] = useState(0)
  const current = queue[index] ?? words[0]
  const [input, setInput] = useState('')
  const [result, setResult] = useState<'correct'|'wrong'|undefined>(undefined)

  const next = () => {
    setInput('')
    setResult(undefined)
    setIndex(i => (i + 1) % queue.length)
  }

  const submitType = () => {
    if (!current) return
    
    const wasNew = current.status === 'new'
    const userInput = input.trim().toLowerCase()
    const correctTerm = current.term.toLowerCase()
    const ok = userInput === correctTerm
    
    // 根据回答情况计算质量评分 (0-5)
    // 0: 完全错误
    // 1: 错误但有部分正确
    // 2: 错误但有提示
    // 3: 正确但困难
    // 4: 正确且顺利
    // 5: 正确且非常容易
    let quality: number
    if (!ok) {
      // 计算输入与正确答案的相似度
      const similarity = calculateSimilarity(userInput, correctTerm)
      if (similarity < 0.3) {
        quality = 0 // 完全错误
      } else if (similarity < 0.7) {
        quality = 1 // 部分正确
      } else {
        quality = 2 // 接近正确
      }
    } else {
      // 正确回答，根据输入速度和是否需要思考给出评分
      // 这里简化处理，统一给4分
      quality = 4
    }
    
    // 使用新的reviewWord action处理复习结果
    dispatch(reviewWord({ wordId: current.id, quality }))
    
    fetch(`${API_BASE}/api/stats/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'dictation' })
    })
    
    if (wasNew && ok) {
      fetch(`${API_BASE}/api/stats/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'new' })
      })
    }
    
    setResult(ok ? 'correct' : 'wrong')
  }

  const submitConfirm = (ok: boolean) => {
    if (!current) return
    
    const wasNew = current.status === 'new'
    
    // 根据用户选择计算质量评分
    // 掌握: 4分，不掌握: 2分
    const quality = ok ? 4 : 2
    
    // 使用新的reviewWord action处理复习结果
    dispatch(reviewWord({ wordId: current.id, quality }))
    
    fetch(`${API_BASE}/api/stats/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'review' })
    })
    
    if (wasNew && ok) {
      fetch(`${API_BASE}/api/stats/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'new' })
      })
    }
    
    next()
  }
  
  // 计算字符串相似度的辅助函数 (Levenshtein距离算法)
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
          matrix[i - 1][j] + 1,      // 删除
          matrix[i][j - 1] + 1,      // 插入
          matrix[i - 1][j - 1] + cost // 替换
        )
      }
    }
    
    const distance = matrix[s2.length][s1.length]
    const maxLength = Math.max(s1.length, s2.length)
    return 1 - distance / maxLength
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button className={`px-3 py-1 rounded border ${mode==='type'?'bg-brand-100 border-brand-400':''}`} onClick={()=>setMode('type')}>打字拼写</button>
        <button className={`px-3 py-1 rounded border ${mode==='confirm'?'bg-brand-100 border-brand-400':''}`} onClick={()=>setMode('confirm')}>快速确认</button>
      </div>
      <div className="rounded-xl border bg-white p-4">
        <div className="text-2xl font-semibold flex items-center gap-2">
          <Icon name="dict"/> <span>{current?.term}</span>
        </div>
        <div className="text-gray-600">{current?.ipa}</div>
        <div className="mt-2">{current?.meaning}</div>
        {current?.example && <div className="mt-2 text-sm text-gray-700">例句：{current.example}</div>}
        {current?.synonyms && <div className="mt-1 text-sm text-gray-700">同义：{current.synonyms.join(', ')}</div>}
        {current?.synonymsNote && <div className="mt-1 text-xs text-gray-500">区别：{current.synonymsNote}</div>}

        {mode==='type' ? (
          <div className="mt-4">
            <input className="w-full border rounded px-3 py-2" placeholder="输入拼写" value={input} onChange={e=>setInput(e.target.value)} />
            <div className="mt-3 flex gap-2">
              <button className="px-3 py-2 bg-gray-900 text-white rounded" onClick={submitType}>确认</button>
              <button className="px-3 py-2 border rounded" onClick={next}>跳过</button>
            </div>
            {result && (
              <div className={`mt-3 text-sm ${result==='correct'?'text-green-600':'text-red-600'}`}>{result==='correct'?'正确':'错误'}</div>
            )}
          </div>
        ) : (
          <div className="mt-4 flex gap-2">
            <button className="px-3 py-2 bg-green-600 text-white rounded" onClick={()=>submitConfirm(true)}>掌握</button>
            <button className="px-3 py-2 bg-red-600 text-white rounded" onClick={()=>submitConfirm(false)}>不掌握</button>
            <button className="px-3 py-2 border rounded" onClick={next}>下一条</button>
          </div>
        )}
      </div>
    </div>
  )
}
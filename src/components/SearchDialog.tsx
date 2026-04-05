import { useState, useEffect, useRef, useCallback } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '../store'
import { wordsApi } from '../services/api'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

interface SearchDialogProps {
  open: boolean
  onClose: () => void
}

interface SearchResult {
  id: string
  term: string
  meaning: string
  ipa?: string
  status?: string
  dictId?: string
}

export default function SearchDialog({ open, onClose }: SearchDialogProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const words = useSelector((s: RootState) => s.words.items)

  useEffect(() => {
    if (open) {
      setQuery('')
      setResults([])
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([])
      return
    }
    setLoading(true)
    try {
      const remote = await wordsApi.search(q)
      setResults(remote)
    } catch {
      const lower = q.toLowerCase()
      const local = words.filter(w =>
        w.term.toLowerCase().includes(lower) || w.meaning.toLowerCase().includes(lower)
      ).slice(0, 20)
      setResults(local)
    } finally {
      setLoading(false)
    }
  }, [words])

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300)
    return () => clearTimeout(timer)
  }, [query, search])

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(i => Math.min(i + 1, results.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(i => Math.max(i - 1, 0))
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        navigate(`/vocab-analysis?word=${results[selectedIndex].id}`)
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, results, selectedIndex, navigate, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-lg mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input
              ref={inputRef}
              className="flex-1 outline-none text-lg"
              placeholder={t('search.placeholder')}
              value={query}
              onChange={e => { setQuery(e.target.value); setSelectedIndex(0) }}
            />
            <kbd className="px-2 py-0.5 text-xs bg-gray-100 border rounded text-gray-500">ESC</kbd>
          </div>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {loading && <div className="p-4 text-center text-gray-400 text-sm">{t('search.searching')}</div>}
          {!loading && query && results.length === 0 && (
            <div className="p-4 text-center text-gray-400 text-sm">{t('search.noResults')}</div>
          )}
          {results.map((r, i) => (
            <button
              key={r.id}
              className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                i === selectedIndex ? 'bg-brand-50' : 'hover:bg-gray-50'
              }`}
              onClick={() => { navigate(`/vocab-analysis?word=${r.id}`); onClose() }}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium">{r.term} {r.ipa && <span className="text-gray-400 text-sm font-normal">{r.ipa}</span>}</div>
                <div className="text-sm text-gray-500 truncate">{r.meaning}</div>
              </div>
              {r.status && (
                <span className={`text-xs px-2 py-0.5 rounded flex-shrink-0 ${
                  r.status === 'mastered' ? 'bg-green-100 text-green-700' :
                  r.status === 'wrong' ? 'bg-red-100 text-red-700' :
                  r.status === 'collected' ? 'bg-amber-100 text-amber-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {r.status === 'mastered' ? t('vocabAnalysis.mastered') : r.status === 'wrong' ? t('vocabAnalysis.wrong') : r.status === 'collected' ? t('collections.title') : t('vocabAnalysis.learning')}
                </span>
              )}
            </button>
          ))}
        </div>
        {results.length > 0 && (
          <div className="p-3 border-t text-xs text-gray-400 flex gap-4">
            <span>{t('search.navigate')}</span>
            <span>{t('search.select')}</span>
          </div>
        )}
      </div>
    </div>
  )
}

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
    <div className="glass-modal-overlay flex items-start justify-center pt-20" onClick={onClose}>
      <div className="glass-modal w-full max-w-lg mx-4 animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-200/60 dark:border-gray-700/50">
          <div className="flex items-center gap-3">
            <svg className="text-gray-400 dark:text-gray-500" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input
              ref={inputRef}
              className="flex-1 outline-none bg-transparent text-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              placeholder={t('search.placeholder')}
              value={query}
              onChange={e => { setQuery(e.target.value); setSelectedIndex(0) }}
            />
            <kbd className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-gray-500 dark:text-gray-400 font-mono">ESC</kbd>
          </div>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {loading && <div className="p-4 text-center text-gray-400 dark:text-gray-500 text-sm">{t('search.searching')}</div>}
          {!loading && query && results.length === 0 && (
            <div className="p-4 text-center text-gray-400 dark:text-gray-500 text-sm">{t('search.noResults')}</div>
          )}
          {results.map((r, i) => (
            <button
              key={r.id}
              className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-all duration-200 ${
                i === selectedIndex
                  ? 'bg-brand-500/10 dark:bg-brand-400/15'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
              }`}
              onClick={() => { navigate(`/vocab-analysis?word=${r.id}`); onClose() }}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {r.term} {r.ipa && <span className="text-gray-400 dark:text-gray-500 text-sm font-normal">{r.ipa}</span>}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{r.meaning}</div>
              </div>
              {r.status && (
                <span className={`badge flex-shrink-0 ${
                  r.status === 'mastered' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                  r.status === 'wrong' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                  r.status === 'collected' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                  'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  {r.status === 'mastered' ? t('vocabAnalysis.mastered') : r.status === 'wrong' ? t('vocabAnalysis.wrong') : r.status === 'collected' ? t('collections.title') : t('vocabAnalysis.learning')}
                </span>
              )}
            </button>
          ))}
        </div>
        {results.length > 0 && (
          <div className="p-3 border-t border-gray-200/60 dark:border-gray-700/50 text-xs text-gray-400 dark:text-gray-500 flex gap-4">
            <span>{t('search.navigate')}</span>
            <span>{t('search.select')}</span>
          </div>
        )}
      </div>
    </div>
  )
}

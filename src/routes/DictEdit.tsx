import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { dictsApi, wordsApi, lookupApi } from '../services/api'
import type { WordItem, WordLookupResult } from '../services/api'
import { useToast } from '../components/Toast'
import Loading from '../components/Loading'

interface DictInfo {
  id: string
  name: string
  description?: string
  wordCount: number
  source: string
}

export default function DictEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { showToast } = useToast()

  const [dict, setDict] = useState<DictInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [words, setWords] = useState<WordItem[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingWords, setLoadingWords] = useState(false)
  const [search, setSearch] = useState('')
  const [filteredWords, setFilteredWords] = useState<WordItem[]>([])

  const [editingName, setEditingName] = useState(false)
  const [editingDesc, setEditingDesc] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const [descValue, setDescValue] = useState('')
  const [saving, setSaving] = useState(false)

  const [showAddWord, setShowAddWord] = useState(false)
  const [showLookupAdd, setShowLookupAdd] = useState(false)
  const [editWord, setEditWord] = useState<WordItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<WordItem | null>(null)

  const PAGE_SIZE = 50

  const loadDict = useCallback(async () => {
    if (!id) return
    try {
      const dicts = await dictsApi.list()
      const found = dicts.find(d => d.id === id)
      if (!found || found.source !== 'custom') {
        showToast(t('dictEdit.dictNotFound'), 'error')
        navigate('/dicts')
        return
      }
      const serverDict = found as DictInfo
      serverDict.description = (found as Record<string, unknown>).description as string | undefined
      setDict(serverDict)
      setNameValue(serverDict.name)
      setDescValue(serverDict.description || '')
    } catch {
      showToast(t('common.error'), 'error')
      navigate('/dicts')
    } finally {
      setLoading(false)
    }
  }, [id, navigate, showToast, t])

  const loadWords = useCallback(async (pageNum: number, append: boolean = false) => {
    if (!id) return
    setLoadingWords(true)
    try {
      const result = await wordsApi.list(id, pageNum, PAGE_SIZE)
      if (append) {
        setWords(prev => [...prev, ...result])
      } else {
        setWords(result)
      }
      setHasMore(result.length === PAGE_SIZE)
      setPage(pageNum)
    } catch {
      showToast(t('common.error'), 'error')
    } finally {
      setLoadingWords(false)
    }
  }, [id, showToast, t])

  useEffect(() => {
    loadDict()
  }, [loadDict])

  useEffect(() => {
    if (dict) {
      loadWords(1)
    }
  }, [dict]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!search.trim()) {
      setFilteredWords(words)
    } else {
      const q = search.toLowerCase()
      setFilteredWords(
        words.filter(
          w =>
            w.term.toLowerCase().includes(q) ||
            w.meaning.toLowerCase().includes(q)
        )
      )
    }
  }, [words, search])

  const handleSaveName = async () => {
    if (!dict || !nameValue.trim()) return
    setSaving(true)
    try {
      await dictsApi.update(dict.id, { name: nameValue.trim() })
      setDict(prev => prev ? { ...prev, name: nameValue.trim() } : prev)
      setEditingName(false)
      showToast(t('dictEdit.saveSuccess'), 'success')
    } catch {
      showToast(t('common.error'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveDesc = async () => {
    if (!dict) return
    setSaving(true)
    try {
      await dictsApi.update(dict.id, { description: descValue })
      setDict(prev => prev ? { ...prev, description: descValue } : prev)
      setEditingDesc(false)
      showToast(t('dictEdit.saveSuccess'), 'success')
    } catch {
      showToast(t('common.error'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteWord = async () => {
    if (!deleteTarget) return
    try {
      await wordsApi.delete(deleteTarget.id)
      setWords(prev => prev.filter(w => w.id !== deleteTarget.id))
      showToast(t('dictEdit.deleteSuccess'), 'success')
    } catch {
      showToast(t('common.error'), 'error')
    }
    setDeleteTarget(null)
  }

  if (loading) {
    return (
      <div className="page-enter flex justify-center py-20">
        <Loading text={t('common.loading')} />
      </div>
    )
  }

  return (
    <div className="page-enter space-y-4">
      <div className="glass-card p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dicts')}
            className="px-2.5 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-700/50 flex items-center gap-1.5 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            {t('dictEdit.back')}
          </button>
        </div>

        <div className="mt-3">
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                className="input-glass flex-1 text-lg font-bold"
                value={nameValue}
                onChange={e => setNameValue(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false) }}
                autoFocus
                disabled={saving}
              />
              <button className="btn-primary px-3 py-1.5 text-sm" onClick={handleSaveName} disabled={saving}>{t('common.save')}</button>
              <button className="btn-secondary px-3 py-1.5 text-sm" onClick={() => { setEditingName(false); setNameValue(dict?.name || '') }}>{t('common.cancel')}</button>
            </div>
          ) : (
            <h2
              className="text-xl font-bold text-gray-900 dark:text-gray-100 cursor-pointer hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
              onClick={() => setEditingName(true)}
              title={t('dictEdit.clickToEdit')}
            >
              {dict?.name}
              <svg className="inline w-4 h-4 ml-2 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
            </h2>
          )}
        </div>

        <div className="mt-2">
          {editingDesc ? (
            <div className="flex items-center gap-2">
              <input
                className="input-glass flex-1 text-sm"
                value={descValue}
                onChange={e => setDescValue(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSaveDesc(); if (e.key === 'Escape') setEditingDesc(false) }}
                placeholder={t('dictEdit.dictDescPlaceholder')}
                autoFocus
                disabled={saving}
              />
              <button className="btn-primary px-3 py-1.5 text-sm" onClick={handleSaveDesc} disabled={saving}>{t('common.save')}</button>
              <button className="btn-secondary px-3 py-1.5 text-sm" onClick={() => { setEditingDesc(false); setDescValue(dict?.description || '') }}>{t('common.cancel')}</button>
            </div>
          ) : (
            <p
              className="text-sm text-gray-500 dark:text-gray-400 cursor-pointer hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
              onClick={() => setEditingDesc(true)}
              title={t('dictEdit.clickToEdit')}
            >
              {dict?.description || t('dictEdit.dictDescPlaceholder')}
              <svg className="inline w-3.5 h-3.5 ml-1.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
            </p>
          )}
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="px-3 py-1.5 bg-gradient-brand text-white rounded-xl text-sm font-medium flex items-center gap-1.5 transition-all hover:shadow-lg hover:shadow-brand-500/25"
            onClick={() => setShowAddWord(true)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
            {t('dictEdit.addWord')}
          </button>
          <button
            className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl text-sm font-medium flex items-center gap-1.5 transition-all hover:shadow-lg hover:shadow-blue-500/25"
            onClick={() => setShowLookupAdd(true)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
            {t('dictEdit.lookupAdd')}
          </button>
          <div className="flex-1" />
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
            <input
              className="input-glass pl-9 text-sm w-48"
              placeholder={t('dictEdit.search')}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="glass-card p-4 overflow-x-auto">
        {filteredWords.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
            {t('dictEdit.noWords')}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200/60 dark:border-gray-700/40 text-gray-500 dark:text-gray-400 text-xs">
                <th className="py-2 px-2 text-left font-medium w-10">#</th>
                <th className="py-2 px-2 text-left font-medium">{t('dictEdit.term')}</th>
                <th className="py-2 px-2 text-left font-medium hidden sm:table-cell">{t('dictEdit.ipa')}</th>
                <th className="py-2 px-2 text-left font-medium">{t('dictEdit.meaning')}</th>
                <th className="py-2 px-2 text-right font-medium w-20">{t('dictEdit.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredWords.map((w, i) => (
                <tr key={w.id} className="border-b border-gray-100/60 dark:border-gray-800/40 hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                  <td className="py-2.5 px-2 text-gray-400 text-xs">{i + 1}</td>
                  <td className="py-2.5 px-2 font-medium text-gray-900 dark:text-gray-100">{w.term}</td>
                  <td className="py-2.5 px-2 text-gray-500 dark:text-gray-400 text-xs hidden sm:table-cell">{w.ipa || ''}</td>
                  <td className="py-2.5 px-2 text-gray-600 dark:text-gray-400 max-w-xs truncate">{w.meaning.split('\n')[0]}</td>
                  <td className="py-2.5 px-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        className="p-1 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        onClick={() => setEditWord(w)}
                        title={t('dictEdit.editWord')}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                      </button>
                      <button
                        className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        onClick={() => setDeleteTarget(w)}
                        title={t('dictEdit.deleteWord')}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {hasMore && !search.trim() && (
          <div className="mt-3 text-center">
            <button
              className="btn-secondary px-4 py-2 text-sm"
              onClick={() => loadWords(page + 1, true)}
              disabled={loadingWords}
            >
              {loadingWords ? t('common.loading') : t('dictEdit.loadMore')}
            </button>
          </div>
        )}
      </div>

      {showAddWord && (
        <AddWordModal
          dictId={id!}
          onClose={() => setShowAddWord(false)}
          onAdded={() => { setShowAddWord(false); loadWords(1) }}
        />
      )}

      {showLookupAdd && (
        <LookupAddModal
          dictId={id!}
          onClose={() => setShowLookupAdd(false)}
          onAdded={() => { setShowLookupAdd(false); loadWords(1) }}
        />
      )}

      {editWord && (
        <EditWordModal
          word={editWord}
          onClose={() => setEditWord(null)}
          onSaved={() => { setEditWord(null); loadWords(1) }}
        />
      )}

      {deleteTarget && (
        <div className="glass-modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="glass-modal animate-scale-in max-w-sm p-5 mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('dictEdit.confirmDelete')}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{t('dictEdit.deleteWordConfirm', { term: deleteTarget.term })}</p>
            <div className="flex gap-2 justify-end">
              <button className="btn-secondary px-4 py-2 text-sm" onClick={() => setDeleteTarget(null)}>{t('common.cancel')}</button>
              <button className="px-4 py-2 text-sm bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors" onClick={handleDeleteWord}>{t('common.delete')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AddWordModal({ dictId, onClose, onAdded }: { dictId: string; onClose: () => void; onAdded: () => void }) {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const [term, setTerm] = useState('')
  const [meaning, setMeaning] = useState('')
  const [ipa, setIpa] = useState('')
  const [example, setExample] = useState('')
  const [synonyms, setSynonyms] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!term.trim()) return
    setSubmitting(true)
    try {
      await wordsApi.create({
        id: '',
        term: term.trim(),
        meaning: meaning.trim(),
        ipa: ipa.trim() || undefined,
        example: example.trim() || undefined,
        synonyms: synonyms.trim() ? synonyms.split(/[;,；，]/).map(s => s.trim()).filter(Boolean) : [],
        status: 'new',
        dictId,
      })
      showToast(t('dictEdit.addSuccess'), 'success')
      onAdded()
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('common.error'), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="glass-modal-overlay" onClick={onClose}>
      <div className="glass-modal animate-scale-in max-w-lg p-5 mx-4 max-h-[85vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('dictEdit.addWord')}</h3>
          <button className="btn-secondary px-2 py-1 text-xs cursor-pointer" onClick={onClose}>{t('common.close')}</button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('dictEdit.term')}</label>
            <input className="input-glass w-full" value={term} onChange={e => setTerm(e.target.value)} placeholder="apple" autoFocus />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('dictEdit.meaning')}</label>
            <textarea className="input-glass w-full min-h-[80px]" value={meaning} onChange={e => setMeaning(e.target.value)} placeholder="n. 苹果" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('dictEdit.ipa')}</label>
            <input className="input-glass w-full" value={ipa} onChange={e => setIpa(e.target.value)} placeholder="/ˈæp.əl/" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('dictEdit.example')}</label>
            <textarea className="input-glass w-full min-h-[60px]" value={example} onChange={e => setExample(e.target.value)} placeholder="I eat an apple every day." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('dictEdit.synonyms')}</label>
            <input className="input-glass w-full" value={synonyms} onChange={e => setSynonyms(e.target.value)} placeholder="fruit, berry" />
          </div>
          <button
            className="btn-primary w-full py-2.5 text-sm disabled:opacity-50"
            onClick={handleSubmit}
            disabled={submitting || !term.trim()}
          >
            {submitting ? t('common.saving') : t('common.add')}
          </button>
        </div>
      </div>
    </div>
  )
}

function LookupAddModal({ dictId, onClose, onAdded }: { dictId: string; onClose: () => void; onAdded: () => void }) {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<WordLookupResult | null>(null)
  const [searching, setSearching] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleLookup = async () => {
    if (!query.trim()) return
    setSearching(true)
    setResult(null)
    try {
      const r = await lookupApi.lookup(query.trim())
      setResult(r)
    } catch {
      showToast(t('dicts.lookupFailed'), 'error')
    } finally {
      setSearching(false)
    }
  }

  const handleAdd = async () => {
    if (!result) return
    setSaving(true)
    try {
      await lookupApi.lookup(result.term, true, dictId)
      showToast(t('dictEdit.addSuccess'), 'success')
      onAdded()
    } catch {
      showToast(t('common.error'), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="glass-modal-overlay" onClick={onClose}>
      <div className="glass-modal animate-scale-in max-w-lg p-5 mx-4 max-h-[85vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('dictEdit.lookupAdd')}</h3>
          <button className="btn-secondary px-2 py-1 text-xs cursor-pointer" onClick={onClose}>{t('common.close')}</button>
        </div>
        <div className="flex gap-2 mb-4">
          <input
            className="input-glass flex-1"
            placeholder={t('dicts.enterEnglishWord')}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLookup()}
          />
          <button className="btn-primary disabled:opacity-50" onClick={handleLookup} disabled={searching}>
            {searching ? t('dicts.searching') : t('dicts.search')}
          </button>
        </div>

        {result && (
          <div className="space-y-3">
            <div className="text-xl font-semibold text-gray-900 dark:text-gray-100">{result.term}</div>
            {(result.ipa || result.phonetic_uk || result.phonetic_us) && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {result.ipa && <span>{result.ipa} </span>}
                {result.phonetic_uk && <span>{t('dicts.uk')} {result.phonetic_uk} </span>}
                {result.phonetic_us && <span>{t('dicts.us')} {result.phonetic_us}</span>}
              </div>
            )}
            {result.meaning && (
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-3">
                <div className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-line">{result.meaning}</div>
              </div>
            )}
            <button
              className="btn-primary w-full py-2.5 text-sm disabled:opacity-50"
              onClick={handleAdd}
              disabled={saving}
            >
              {saving ? t('common.saving') : t('dictEdit.addWord')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function EditWordModal({ word, onClose, onSaved }: { word: WordItem; onClose: () => void; onSaved: () => void }) {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const [meaning, setMeaning] = useState(word.meaning)
  const [ipa, setIpa] = useState(word.ipa || '')
  const [example, setExample] = useState(word.example || '')
  const [synonyms, setSynonyms] = useState((word.synonyms || []).join(', '))
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await wordsApi.update(word.id, {
        meaning: meaning.trim(),
        ipa: ipa.trim() || undefined,
        example: example.trim() || undefined,
        synonyms: synonyms.trim() ? synonyms.split(/[;,；，]/).map(s => s.trim()).filter(Boolean) : [],
      })
      showToast(t('dictEdit.saveSuccess'), 'success')
      onSaved()
    } catch {
      showToast(t('common.error'), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="glass-modal-overlay" onClick={onClose}>
      <div className="glass-modal animate-scale-in max-w-lg p-5 mx-4 max-h-[85vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('dictEdit.editWord')} — {word.term}</h3>
          <button className="btn-secondary px-2 py-1 text-xs cursor-pointer" onClick={onClose}>{t('common.close')}</button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('dictEdit.term')}</label>
            <input className="input-glass w-full bg-gray-50 dark:bg-gray-700/30" value={word.term} disabled />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('dictEdit.meaning')}</label>
            <textarea className="input-glass w-full min-h-[80px]" value={meaning} onChange={e => setMeaning(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('dictEdit.ipa')}</label>
            <input className="input-glass w-full" value={ipa} onChange={e => setIpa(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('dictEdit.example')}</label>
            <textarea className="input-glass w-full min-h-[60px]" value={example} onChange={e => setExample(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('dictEdit.synonyms')}</label>
            <input className="input-glass w-full" value={synonyms} onChange={e => setSynonyms(e.target.value)} />
          </div>
          <button
            className="btn-primary w-full py-2.5 text-sm disabled:opacity-50"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  )
}

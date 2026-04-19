import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from '../store'
import { setActive, updateSpecialCounts, setDicts, removeDict } from '../features/dicts/dictsSlice'
import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import { useToast } from '../components/Toast'
import { lookupApi, importApi, dictsApi } from '../services/api'
import type { WordLookupResult, ImportTaskInfo } from '../services/api'
import Loading from '../components/Loading'
import { useTranslation } from 'react-i18next'

export default function Dicts() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { t } = useTranslation()
  const dicts = useSelector((s: RootState) => s.dicts)
  const words = useSelector((s: RootState) => s.words.items)
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated)
  const [name, setName] = useState('')
  const [dictsLoading, setDictsLoading] = useState(false)
  const [creatingDict, setCreatingDict] = useState(false)

  const [lookupQuery, setLookupQuery] = useState('')
  const [lookupResult, setLookupResult] = useState<WordLookupResult | null>(null)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupSaving, setLookupSaving] = useState(false)
  const [showLookup, setShowLookup] = useState(false)

  const txtFileRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [importTask, setImportTask] = useState<ImportTaskInfo | null>(null)
  const [importMode, setImportMode] = useState<'quick' | 'batch'>('quick')
  const [selectedDictForImport, setSelectedDictForImport] = useState<string>('')
  const [showImport, setShowImport] = useState(false)
  const [deleteDictId, setDeleteDictId] = useState<string | null>(null)

  useEffect(() => {
    const collected = words.filter(w => w.status === 'collected').length
    const wrong = words.filter(w => w.status === 'wrong').length
    const mastered = words.filter(w => w.status === 'mastered').length
    dispatch(updateSpecialCounts({ collected, wrong, mastered }))
  }, [words, dispatch])

  useEffect(() => {
    if (isAuthenticated && !dictsLoading) {
      setDictsLoading(true)
      dictsApi.list()
        .then(serverDicts => {
          dispatch(setDicts(serverDicts))
        })
        .catch(err => {
          console.warn('Failed to load dicts:', err)
        })
        .finally(() => setDictsLoading(false))
    }
  }, [isAuthenticated, dispatch])

  const onCreate = async () => {
    if (!name.trim()) return
    
    if (!isAuthenticated) {
      showToast(t('dicts.loginToCreate'), 'error')
      return
    }

    setCreatingDict(true)
    try {
      const newDict = await dictsApi.create({ name })
      dispatch(setDicts([newDict]))
      setName('')
      showToast(t('dicts.dictCreated'), 'success')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('dicts.createFailed')
      showToast(errorMessage, 'error')
    } finally {
      setCreatingDict(false)
    }
  }

  const active = dicts.mine.concat(dicts.recommend).find(d => d.id === dicts.activeId)

  const [viewId, setViewId] = useState<string | undefined>(undefined)
  const [reviewIds, setReviewIds] = useState<string[] | undefined>(undefined)
  const [reviewIndex, setReviewIndex] = useState(0)

  const itemsByDict = (id: string) => {
    if (id === 'collected') return words.filter(w => w.status === 'collected')
    if (id === 'wrong') return words.filter(w => w.status === 'wrong')
    if (id === 'mastered') return words.filter(w => w.status === 'mastered')
    return []
  }

  const quickReview = (id: string) => {
    const list = itemsByDict(id)
    const shuffled = [...list].sort(() => Math.random() - 0.5).slice(0, 40)
    setReviewIds(shuffled.map(w => w.id))
    setReviewIndex(0)
  }

  const handleLookup = async () => {
    if (!lookupQuery.trim()) return
    setLookupLoading(true)
    setLookupResult(null)
    try {
      const result = await lookupApi.lookup(lookupQuery.trim())
      setLookupResult(result)
    } catch (error) {
      showToast(t('dicts.lookupFailed') + ': ' + (error instanceof Error ? error.message : t('dicts.notFound')), 'error')
    } finally {
      setLookupLoading(false)
    }
  }

  const handleSaveLookupWord = async () => {
    if (!lookupResult) return
    setLookupSaving(true)
    try {
      await lookupApi.lookup(lookupResult.term, true, dicts.activeId)
      showToast(t('dicts.addedToLib', { term: lookupResult.term }), 'success')
    } catch (error) {
      showToast(t('dicts.saveFailed') + ': ' + (error instanceof Error ? error.message : t('dicts.unknownError')), 'error')
    } finally {
      setLookupSaving(false)
    }
  }

  const handleTxtImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (!isAuthenticated) {
      showToast(t('dicts.loginToImport'), 'error')
      e.target.value = ''
      return
    }

    if (!selectedDictForImport) {
      showToast(t('dicts.selectDictToImport'), 'error')
      e.target.value = ''
      return
    }

    const selectedDict = dicts.mine.find(d => d.id === selectedDictForImport)
    if (!selectedDict || ['collected', 'wrong', 'mastered'].includes(selectedDictForImport)) {
      showToast(t('dicts.selectValidDict'), 'error')
      e.target.value = ''
      return
    }

    setImporting(true)
    setImportTask(null)

    try {
      if (importMode === 'quick') {
        const result = await importApi.quickImportTxt(file, selectedDictForImport)
        showToast(result.detail, 'success')
        const serverDicts = await dictsApi.list()
        dispatch(setDicts(serverDicts))
      } else {
        const result = await importApi.importTxt(file, selectedDictForImport)
        showToast(t('dicts.importStarted', { total: result.total }), 'success')

        const poll = setInterval(async () => {
          try {
            const status = await importApi.getStatus(result.task_id)
            setImportTask(status)
            if (status.status === 'completed') {
              clearInterval(poll)
              showToast(t('dicts.importComplete', { imported: status.imported, skipped: status.skipped, failed: status.failed }), 'success')
              setImporting(false)
              const serverDicts = await dictsApi.list()
              dispatch(setDicts(serverDicts))
            } else if (status.status === 'failed') {
              clearInterval(poll)
              showToast(t('dicts.importFailed') + `: ${status.error}`, 'error')
              setImporting(false)
            }
          } catch {
            clearInterval(poll)
            setImporting(false)
          }
        }, 2000)
      }
    } catch (error) {
      showToast(t('dicts.importFailed') + ': ' + (error instanceof Error ? error.message : t('dicts.unknownError')), 'error')
    } finally {
      if (importMode === 'quick') {
        setImporting(false)
      }
      e.target.value = ''
    }
  }

  return (
    <>
    <div className="page-enter space-y-6">
      {!isAuthenticated && (
        <div className="rounded-2xl bg-amber-50/80 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-700/40 p-4 backdrop-blur-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-sm flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
          </div>
          <div className="flex-1">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <span dangerouslySetInnerHTML={{ __html: t('dicts.guestWarning') }} />
              <span className="text-amber-900 dark:text-amber-100 font-medium cursor-pointer hover:underline ml-1" onClick={() => navigate('/login')}>{t('dicts.loginNow')}</span>
            </p>
          </div>
        </div>
      )}

      <div className="glass-card p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            className="px-4 py-2 bg-gradient-brand text-white rounded-xl font-medium text-sm flex items-center gap-1.5 transition-all duration-300 hover:shadow-lg hover:shadow-brand-500/25 hover:-translate-y-0.5"
            onClick={() => setShowLookup(true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
            {t('dicts.onlineLookup')}
          </button>
          <button
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium text-sm flex items-center gap-1.5 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/25 hover:-translate-y-0.5"
            onClick={() => setShowImport(true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
            {t('dicts.importWordList')}
          </button>
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="flex items-center gap-2">
          <span className="text-blue-600 dark:text-blue-400">{active ? t('dicts.currentDict') : t('dicts.noCurrentDict')}</span>
          {active && <span className="font-semibold text-gray-900 dark:text-gray-100">{active.name}</span>}
        </div>
        {(() => {
          const today = new Date().toISOString().split('T')[0]
          const filteredWords = active
            ? (['collected','wrong','mastered'].includes(active.id)
              ? words.filter(w => w.status === active.id)
              : words.filter(w => w.dictId === active.id))
            : words
          const newCount = filteredWords.filter(w => w.status === 'new').length
          const reviewCount = filteredWords.filter(w => w.nextReviewDate?.split('T')[0] <= today && w.status !== 'mastered' && w.status !== 'new').length
          const masteredCount = filteredWords.filter(w => w.status === 'mastered').length
          return (
            <div className="mt-3 grid grid-cols-4 gap-2 text-center">
              <div className="rounded-xl border border-gray-200/60 dark:border-gray-700/40 bg-gray-50/80 dark:bg-gray-700/40 p-2">
                <div className="text-xl font-semibold text-brand-600 dark:text-brand-400">{newCount}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{t('dicts.newWords')}</div>
              </div>
              <div className="rounded-xl border border-gray-200/60 dark:border-gray-700/40 bg-gray-50/80 dark:bg-gray-700/40 p-2">
                <div className="text-xl font-semibold text-green-600 dark:text-green-400">{reviewCount}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{t('dicts.reviewCount')}</div>
              </div>
              <div className="rounded-xl border border-gray-200/60 dark:border-gray-700/40 bg-gray-50/80 dark:bg-gray-700/40 p-2">
                <div className="text-xl font-semibold text-purple-600 dark:text-purple-400">{masteredCount}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{t('dicts.dictationCount')}</div>
              </div>
              <button className="rounded-xl bg-brand-500 dark:bg-brand-600 text-white p-2 hover:bg-brand-600 dark:hover:bg-brand-700 transition-colors font-medium text-sm" onClick={() => { if (active) navigate('/practice/words') }}>{t('dicts.startLearning')}</button>
            </div>
          )
        })()}
      </div>

      <div className="glass-card p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t('dicts.myDicts')}</h3>
          {isAuthenticated && (
            <div className="flex items-center gap-2">
              <input 
                className="input-glass" 
                placeholder={t('dicts.createDict')} 
                value={name} 
                onChange={e => setName(e.target.value)}
                disabled={creatingDict}
                onKeyDown={e => e.key === 'Enter' && onCreate()}
              />
              <button 
                className="btn-primary px-2 py-1 text-sm disabled:opacity-50" 
                onClick={onCreate}
                disabled={creatingDict || !name.trim()}
              >
                {creatingDict ? t('dicts.creating') : t('dicts.create')}
              </button>
            </div>
          )}
        </div>
        {dictsLoading ? (
          <div className="mt-3 flex justify-center py-4">
            <Loading text={t('dicts.loadDicts')} />
          </div>
        ) : (
        <div className="mt-3 grid md:grid-cols-4 gap-3">
          {dicts.mine.map(d => (
            <div key={d.id} className="rounded-xl border border-gray-200/60 dark:border-gray-700/40 bg-gray-50/80 dark:bg-gray-700/30 p-3">
              <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-gray-100">
                {d.id === 'collected' && <Icon name="star" className="text-brand-600 dark:text-brand-400" />}
                {d.id === 'wrong' && <Icon name="wrong" className="text-red-600 dark:text-red-400" />}
                {d.id === 'mastered' && <Icon name="check" className="text-green-600 dark:text-green-400" />}
                {d.id !== 'collected' && d.id !== 'wrong' && d.id !== 'mastered' && <Icon name="dict" className="text-gray-700 dark:text-gray-400" />}
                <span>{d.name}</span>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">{t('dicts.wordsCount', { count: d.wordCount })}</div>
              <div className="mt-2 flex gap-2">
                {(['collected', 'wrong', 'mastered'] as const).includes(d.id as 'collected' | 'wrong' | 'mastered') ? (
                  <>
                    <button className="px-2 py-1 border border-gray-200 dark:border-gray-700 rounded-lg text-xs hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-1" onClick={() => quickReview(d.id)}>
                      <Icon name="review" /> <span>{t('dicts.quickReview')}</span>
                    </button>
                    <button className="px-2 py-1 border border-gray-200 dark:border-gray-700 rounded-lg text-xs hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-1" onClick={() => setViewId(d.id)}>
                      <Icon name="eye" /> <span>{t('dicts.view')}</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button className="px-2 py-1 border border-gray-200 dark:border-gray-700 rounded-lg text-xs hover:bg-gray-50 dark:hover:bg-gray-700/50" onClick={() => dispatch(setActive(d.id))}>{t('dicts.setCurrent')}</button>
                    <button className="px-2 py-1 border border-gray-200 dark:border-gray-700 rounded-lg text-xs hover:bg-gray-50 dark:hover:bg-gray-700/50" onClick={() => navigate(`/dicts/${d.id}/edit`)}>{t('common.edit')}</button>
                    <button className="px-2 py-1 border border-gray-200 dark:border-gray-700 rounded-lg text-xs hover:bg-gray-50 dark:hover:bg-gray-700/50" onClick={() => { setSelectedDictForImport(d.id); setShowImport(true) }}>{t('dicts.import')}</button>
                    <button className="px-2 py-1 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => setDeleteDictId(d.id)}>{t('common.delete')}</button>
                  </>
                )}
              </div>
            </div>
          ))}
          <div className="rounded-xl border-dashed border border-gray-300 dark:border-gray-600 p-3 text-center text-gray-500 dark:text-gray-400">+</div>
        </div>
        )}
      </div>

      <div className="glass-card p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t('dicts.recommended')}</h3>
        </div>
        <div className="mt-3 grid md:grid-cols-5 gap-3">
          {dicts.recommend.map(d => (
            <div key={d.id} className="rounded-xl border border-gray-200/60 dark:border-gray-700/40 bg-white/80 dark:bg-gray-700/30 p-3">
              <div className="font-medium text-gray-900 dark:text-gray-100">{d.name}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">{t('dicts.wordsCount', { count: d.wordCount })}</div>
              <div className="mt-2">
                <button className="px-2 py-1 border border-gray-200 dark:border-gray-700 rounded-lg text-xs hover:bg-gray-50 dark:hover:bg-gray-700/50" onClick={() => { dispatch(setActive(d.id)); navigate('/practice/words') }}>{t('dicts.startLearning')}</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

      {showLookup && (
        <div className="glass-modal-overlay" onClick={() => setShowLookup(false)}>
          <div className="glass-modal animate-scale-in max-w-lg p-5 mx-4 max-h-[85vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('dicts.lookupTitle')}</h3>
              <button type="button" className="btn-secondary px-2 py-1 text-xs cursor-pointer" onClick={() => { setShowLookup(false); setLookupResult(null); setLookupQuery('') }}>{t('common.close')}</button>
            </div>

            <div className="flex gap-2 mb-4">
              <input
                className="input-glass flex-1"
                placeholder={t('dicts.enterEnglishWord')}
                value={lookupQuery}
                onChange={e => setLookupQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLookup()}
              />
              <button
                type="button"
                className="btn-primary disabled:opacity-50"
                onClick={handleLookup}
                disabled={lookupLoading}
              >
                {lookupLoading ? t('dicts.searching') : t('dicts.search')}
              </button>
            </div>

            {lookupResult && (
              <div className="space-y-3">
                <div>
                  <div className="text-xl font-semibold text-gray-900 dark:text-gray-100">{lookupResult.term}</div>
                  {lookupResult.ipa && <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{lookupResult.ipa}</div>}
                  {(lookupResult.phonetic_uk || lookupResult.phonetic_us) && (
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {lookupResult.phonetic_uk && <span>{t('dicts.uk')} {lookupResult.phonetic_uk} </span>}
                      {lookupResult.phonetic_us && <span>{t('dicts.us')} {lookupResult.phonetic_us}</span>}
                    </div>
                  )}
                </div>

                {lookupResult.meaning && (
                  <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-3">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('dicts.definition')}</div>
                    <div className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-line">{lookupResult.meaning}</div>
                  </div>
                )}

                {lookupResult.en_meaning && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
                    <div className="text-xs font-medium text-blue-500 dark:text-blue-400 mb-1">{t('dicts.enDefinition')}</div>
                    <div className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-line">{lookupResult.en_meaning}</div>
                  </div>
                )}

                {lookupResult.synonyms.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('dicts.synonyms')}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {lookupResult.synonyms.map((s, i) => (
                        <span key={i} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-700 dark:text-gray-300">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {lookupResult.examples.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('dicts.examples')}</div>
                    <div className="space-y-1.5">
                      {lookupResult.examples.slice(0, 4).map((ex, i) => (
                        <div key={i} className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/30 rounded p-2 whitespace-pre-line">{ex}</div>
                      ))}
                    </div>
                  </div>
                )}

                {lookupResult.phrases.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('dicts.phrases')}</div>
                    <div className="space-y-1">
                      {lookupResult.phrases.slice(0, 5).map((p, i) => (
                        <div key={i} className="text-xs text-gray-700 dark:text-gray-300">{p}</div>
                      ))}
                    </div>
                  </div>
                )}

                {lookupResult.grammar.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('dicts.grammar')}</div>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-400">
                      {lookupResult.grammar.map((g, i) => (
                        <span key={i} className="bg-gray-100 dark:bg-gray-700 rounded px-2 py-0.5">{g}</span>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  className="btn-primary w-full disabled:opacity-50 transition-colors"
                  onClick={handleSaveLookupWord}
                  disabled={lookupSaving}
                >
                  {lookupSaving ? t('dicts.searching') : t('dicts.addToMyDict')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showImport && (
        <div className="glass-modal-overlay" onClick={() => { if (!importing) setShowImport(false) }}>
          <div className="glass-modal animate-scale-in max-w-lg p-5 mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('dicts.importTitle')}</h3>
              <button type="button" className="btn-secondary px-2 py-1 text-xs cursor-pointer" onClick={() => setShowImport(false)}>{t('common.close')}</button>
            </div>

            {!isAuthenticated ? (
              <div className="text-center py-8">
                <div className="text-amber-600 dark:text-amber-400 mb-2">{t('dicts.loginRequired')}</div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{t('dicts.loginRequiredMsg')}</p>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => navigate('/login')}
                >
                  {t('dicts.goLogin')}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('dicts.importToDict')}</label>
                  <select
                    className="input-glass"
                    value={selectedDictForImport}
                    onChange={e => setSelectedDictForImport(e.target.value)}
                    disabled={importing}
                  >
                    <option value="">{t('dicts.selectDict')}</option>
                    {dicts.mine
                      .filter(d => !['collected', 'wrong', 'mastered'].includes(d.id))
                      .filter(d => d.source === 'custom')
                      .map(d => (
                        <option key={d.id} value={d.id}>{d.name} ({t('dicts.wordsCount', { count: d.wordCount })})</option>
                      ))}
                  </select>
                  {dicts.mine.filter(d => d.source === 'custom').length === 0 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">{t('dicts.noCustomDict')}</p>
                  )}
                </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('dicts.importMode')}</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={`flex-1 px-3 py-2 rounded-lg border-2 text-sm transition-colors ${importMode === 'quick' ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300' : 'border-gray-200 dark:border-gray-700'}`}
                    onClick={() => setImportMode('quick')}
                  >
                    <div className="font-medium">{t('dicts.quickImport')}</div>
                    <div className="text-xs mt-0.5 opacity-80">{t('dicts.quickImportDesc')}</div>
                  </button>
                  <button
                    type="button"
                    className={`flex-1 px-3 py-2 rounded-lg border-2 text-sm transition-colors ${importMode === 'batch' ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300' : 'border-gray-200 dark:border-gray-700'}`}
                    onClick={() => setImportMode('batch')}
                  >
                    <div className="font-medium">{t('dicts.smartImport')}</div>
                    <div className="text-xs mt-0.5 opacity-80">{t('dicts.smartImportDesc')}</div>
                  </button>
                </div>
              </div>

              <div>
                <input
                  type="file"
                  accept=".txt"
                  ref={txtFileRef}
                  onChange={handleTxtImport}
                  className="hidden"
                />
                <button
                  type="button"
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-brand-400 dark:hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/10 transition-colors text-sm text-gray-600 dark:text-gray-400 disabled:opacity-50"
                  onClick={() => txtFileRef.current?.click()}
                  disabled={importing || !selectedDictForImport}
                >
                  {!selectedDictForImport ? t('dicts.selectDictFirst') : importing ? t('dicts.importing') : t('dicts.selectTxtFile')}
                </button>
              </div>

              {importTask && importTask.status === 'running' && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-blue-700 dark:text-blue-300">{t('dicts.importing')}</span>
                    <span className="text-blue-600 dark:text-blue-400">{importTask.current}/{importTask.total}</span>
                  </div>
                  <div className="w-full bg-blue-200 dark:bg-blue-900/40 rounded-full h-2">
                    <div
                      className="bg-blue-500 dark:bg-blue-400 rounded-full h-2 transition-all"
                      style={{ width: `${(importTask.current / importTask.total) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">{t('dicts.currentWord')}: {importTask.current_word}</div>
                </div>
              )}

              {importTask && importTask.status === 'completed' && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-sm">
                  <div className="font-medium text-green-700 dark:text-green-300 mb-1">{t('dicts.importComplete')}</div>
                  <div className="text-green-600 dark:text-green-400 text-xs">
                    {t('dicts.importSuccess')} {importTask.imported} | {t('dicts.importSkipped')} {importTask.skipped} | {t('dicts.importFailed')} {importTask.failed}
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-400 dark:text-gray-500">
                <p>{t('dicts.txtSupport')}</p>
                <p className="mt-1">{t('dicts.txtSupportDetail')}</p>
              </div>
            </div>
            )}
          </div>
        </div>
      )}

      {viewId && (
        <div className="glass-modal-overlay" onClick={() => setViewId(undefined)}>
          <div className="glass-modal animate-scale-in max-w-lg p-5 mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-gray-900 dark:text-gray-100">{t('dicts.list')}</div>
              <button type="button" className="btn-secondary px-2 py-1 text-xs cursor-pointer" onClick={() => setViewId(undefined)}>{t('common.close')}</button>
            </div>
            <ul className="max-h-96 overflow-auto space-y-2">
              {itemsByDict(viewId).map(w => (
                <li key={w.id} className="p-2 rounded-xl border border-gray-200/60 dark:border-gray-700/40">
                  <div className="font-medium text-gray-900 dark:text-gray-100">{w.term}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{w.meaning}</div>
                </li>
              ))}
              {itemsByDict(viewId).length === 0 && <div className="text-gray-500 dark:text-gray-400 text-sm">{t('dicts.noEntries')}</div>}
            </ul>
          </div>
        </div>
      )}

      {reviewIds && (
        <div className="glass-modal-overlay" onClick={() => { setReviewIds(undefined); setReviewIndex(0) }}>
          <div className="glass-modal animate-scale-in max-w-lg p-5 mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold text-gray-900 dark:text-gray-100">{t('dicts.quickReviewTitle')} {reviewIndex + 1}/{reviewIds.length}</div>
              <button type="button" className="btn-secondary px-2 py-1 text-xs cursor-pointer" onClick={() => { setReviewIds(undefined); setReviewIndex(0) }}>{t('dicts.exit')}</button>
            </div>
            {(() => {
              const current = words.find(w => w.id === reviewIds[reviewIndex])
              if (!current) return <div className="text-gray-500 dark:text-gray-400">{t('dicts.noEntry')}</div>
              return (
                <div>
                  <div className="text-xl font-semibold text-gray-900 dark:text-gray-100">{current.term}</div>
                  <div className="text-gray-600 dark:text-gray-400">{current.meaning}</div>
                  <div className="mt-4 flex gap-2">
                    <button type="button" className="btn-primary px-3 py-2" onClick={() => setReviewIndex(i => Math.min(i + 1, reviewIds.length - 1))}>{t('common.next')}</button>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}
      {deleteDictId && (() => {
        const d = dicts.mine.find(d => d.id === deleteDictId)
        if (!d) return null
        return (
          <div className="glass-modal-overlay" onClick={() => setDeleteDictId(null)}>
            <div className="glass-modal animate-scale-in max-w-sm p-5 mx-4" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('wordList.deleteConfirm')}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{t('wordList.deleteDictConfirm', { name: d.name })}</p>
              <div className="flex gap-2 justify-end">
                <button className="btn-secondary px-4 py-2 text-sm" onClick={() => setDeleteDictId(null)}>{t('common.cancel')}</button>
                <button className="px-4 py-2 text-sm bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors" onClick={async () => {
                  try {
                    await dictsApi.delete(deleteDictId)
                    dispatch(removeDict(deleteDictId))
                    showToast(t('wordList.deleteSuccess'), 'success')
                  } catch {
                    showToast(t('common.error'), 'error')
                  }
                  setDeleteDictId(null)
                }}>{t('common.delete')}</button>
              </div>
            </div>
          </div>
        )
      })()}
    </>
  )
}

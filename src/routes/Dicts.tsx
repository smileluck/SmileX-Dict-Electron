import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from '../store'
import { addCustom, setActive, updateSpecialCounts, setDicts, updateDict, removeDict } from '../features/dicts/dictsSlice'
import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import { useToast } from '../components/Toast'
import { lookupApi, importApi, dictsApi } from '../services/api'
import type { WordLookupResult, ImportTaskInfo } from '../services/api'
import Loading from '../components/Loading'

export default function Dicts() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const dicts = useSelector((s: RootState) => s.dicts)
  const words = useSelector((s: RootState) => s.words.items)
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated)
  const [name, setName] = useState('')
  const [dictsLoading, setDictsLoading] = useState(false)
  const [creatingDict, setCreatingDict] = useState(false)

  // 在线查词
  const [lookupQuery, setLookupQuery] = useState('')
  const [lookupResult, setLookupResult] = useState<WordLookupResult | null>(null)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupSaving, setLookupSaving] = useState(false)
  const [showLookup, setShowLookup] = useState(false)

  // TXT导入
  const txtFileRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [importTask, setImportTask] = useState<ImportTaskInfo | null>(null)
  const [importMode, setImportMode] = useState<'quick' | 'batch'>('quick')
  const [selectedDictForImport, setSelectedDictForImport] = useState<string>('')
  const [showImport, setShowImport] = useState(false)

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
      showToast('请先登录后再创建词典', 'error')
      return
    }

    setCreatingDict(true)
    try {
      const newDict = await dictsApi.create({ name })
      dispatch(setDicts([newDict]))
      setName('')
      showToast('词典创建成功', 'success')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建失败'
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

  // ── 在线查词 ──
  const handleLookup = async () => {
    if (!lookupQuery.trim()) return
    setLookupLoading(true)
    setLookupResult(null)
    try {
      const result = await lookupApi.lookup(lookupQuery.trim())
      setLookupResult(result)
    } catch (error) {
      showToast('查词失败: ' + (error instanceof Error ? error.message : '未找到该词'), 'error')
    } finally {
      setLookupLoading(false)
    }
  }

  const handleSaveLookupWord = async () => {
    if (!lookupResult) return
    setLookupSaving(true)
    try {
      await lookupApi.lookup(lookupResult.term, true, dicts.activeId)
      showToast(`已将 "${lookupResult.term}" 添加到词库`, 'success')
    } catch (error) {
      showToast('保存失败: ' + (error instanceof Error ? error.message : '未知错误'), 'error')
    } finally {
      setLookupSaving(false)
    }
  }

  // ── TXT导入 ──
  const handleTxtImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (!isAuthenticated) {
      showToast('请先登录后再导入词表', 'error')
      e.target.value = ''
      return
    }

    if (!selectedDictForImport) {
      showToast('请先选择要导入到哪个词典', 'error')
      e.target.value = ''
      return
    }

    // 验证选择的词典是后端词典(不是特殊词典)
    const selectedDict = dicts.mine.find(d => d.id === selectedDictForImport)
    if (!selectedDict || ['collected', 'wrong', 'mastered'].includes(selectedDictForImport)) {
      showToast('请选择一个有效的用户词典', 'error')
      e.target.value = ''
      return
    }

    setImporting(true)
    setImportTask(null)

    try {
      if (importMode === 'quick') {
        const result = await importApi.quickImportTxt(file, selectedDictForImport)
        showToast(result.detail, 'success')
        // 重新加载词典列表以更新wordCount
        const serverDicts = await dictsApi.list()
        dispatch(setDicts(serverDicts))
      } else {
        const result = await importApi.importTxt(file, selectedDictForImport)
        showToast(`已开始导入 ${result.total} 个单词`, 'success')

        const poll = setInterval(async () => {
          try {
            const status = await importApi.getStatus(result.task_id)
            setImportTask(status)
            if (status.status === 'completed') {
              clearInterval(poll)
              showToast(`导入完成：成功 ${status.imported}，跳过 ${status.skipped}，失败 ${status.failed}`, 'success')
              setImporting(false)
              // 重新加载词典列表以更新wordCount
              const serverDicts = await dictsApi.list()
              dispatch(setDicts(serverDicts))
            } else if (status.status === 'failed') {
              clearInterval(poll)
              showToast(`导入失败: ${status.error}`, 'error')
              setImporting(false)
            }
          } catch {
            clearInterval(poll)
            setImporting(false)
          }
        }, 2000)
      }
    } catch (error) {
      showToast('导入失败: ' + (error instanceof Error ? error.message : '未知错误'), 'error')
    } finally {
      if (importMode === 'quick') {
        setImporting(false)
      }
      e.target.value = ''
    }
  }

  return (
    <>
    <div className="space-y-6">
      {!isAuthenticated && (
        <div className="rounded-xl border bg-amber-50 border-amber-200 p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
          </div>
          <div className="flex-1">
            <p className="text-sm text-amber-800">
              您正在以<strong>访客模式</strong>浏览词典。登录后可以创建和管理自己的词典，使用全部功能。
              <span className="text-amber-900 font-medium cursor-pointer hover:underline ml-1" onClick={() => navigate('/login')}>立即登录</span>
            </p>
          </div>
        </div>
      )}

      {/* 在线查词 + TXT导入 快捷操作栏 */}
      <div className="rounded-xl border bg-white p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors text-sm font-medium flex items-center gap-1.5"
            onClick={() => setShowLookup(true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
            在线查词
          </button>
          <button
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-1.5"
            onClick={() => setShowImport(true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
            导入词表
          </button>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <div className="flex items-center gap-2">
          <span className="text-blue-600">当前{active ? '正在学习的词典' : '无正在学习的词典'}</span>
          {active && <span className="font-semibold">{active.name}</span>}
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2 text-center">
          <div className="rounded bg-gray-50 p-2"><div className="text-xl">0</div><div className="text-xs text-gray-500">新词数</div></div>
          <div className="rounded bg-gray-50 p-2"><div className="text-xl">0</div><div className="text-xs text-gray-500">复习次数</div></div>
          <div className="rounded bg-gray-50 p-2"><div className="text-xl">0</div><div className="text-xs text-gray-500">默写次数</div></div>
          <button className="rounded bg-brand-500 text-white p-2 hover:bg-brand-600 transition-colors" onClick={() => { if (active) navigate('/practice/words') }}>开始学习</button>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">我的词典</h3>
          {isAuthenticated && (
            <div className="flex items-center gap-2">
              <input 
                className="border rounded px-2 py-1 text-sm" 
                placeholder="创建个人词典" 
                value={name} 
                onChange={e => setName(e.target.value)}
                disabled={creatingDict}
                onKeyDown={e => e.key === 'Enter' && onCreate()}
              />
              <button 
                className="px-2 py-1 bg-gray-900 text-white rounded text-sm disabled:opacity-50" 
                onClick={onCreate}
                disabled={creatingDict || !name.trim()}
              >
                {creatingDict ? '创建中...' : '创建'}
              </button>
            </div>
          )}
        </div>
        {dictsLoading ? (
          <div className="mt-3 flex justify-center py-4">
            <Loading text="加载词典..." />
          </div>
        ) : (
        <div className="mt-3 grid md:grid-cols-4 gap-3">
          {dicts.mine.map(d => (
            <div key={d.id} className="rounded border bg-gray-50 p-3">
              <div className="flex items-center gap-2 font-medium">
                {d.id === 'collected' && <Icon name="star" className="text-brand-600" />}
                {d.id === 'wrong' && <Icon name="wrong" className="text-red-600" />}
                {d.id === 'mastered' && <Icon name="check" className="text-green-600" />}
                {d.id !== 'collected' && d.id !== 'wrong' && d.id !== 'mastered' && <Icon name="dict" className="text-gray-700" />}
                <span>{d.name}</span>
              </div>
              <div className="text-xs text-gray-600">{d.wordCount}个词</div>
              <div className="mt-2 flex gap-2">
                {(['collected', 'wrong', 'mastered'] as const).includes(d.id as 'collected' | 'wrong' | 'mastered') ? (
                  <>
                    <button className="px-2 py-1 border rounded text-xs flex items-center gap-1" onClick={() => quickReview(d.id)}>
                      <Icon name="review" /> <span>快速回顾</span>
                    </button>
                    <button className="px-2 py-1 border rounded text-xs flex items-center gap-1" onClick={() => setViewId(d.id)}>
                      <Icon name="eye" /> <span>查看</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button className="px-2 py-1 border rounded text-xs" onClick={() => dispatch(setActive(d.id))}>设为当前学习</button>
                    <button className="px-2 py-1 border rounded text-xs" onClick={() => { setSelectedDictForImport(d.id); setShowImport(true) }}>导入</button>
                  </>
                )}
              </div>
            </div>
          ))}
          <div className="rounded border-dashed border p-3 text-center text-gray-500">+</div>
        </div>
        )}
      </div>

      <div className="rounded-xl border bg-white p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">推荐</h3>
        </div>
        <div className="mt-3 grid md:grid-cols-5 gap-3">
          {dicts.recommend.map(d => (
            <div key={d.id} className="rounded border bg-white p-3">
              <div className="font-medium">{d.name}</div>
              <div className="text-xs text-gray-600">{d.wordCount}个词</div>
              <div className="mt-2">
                <button className="px-2 py-1 border rounded text-xs" onClick={() => { dispatch(setActive(d.id)); navigate('/practice/words') }}>开始学习</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

      {/* ── 在线查词弹窗 ── */}
      {showLookup && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowLookup(false)}>
          <div className="bg-white rounded-xl w-full max-w-lg p-5 mx-4 max-h-[85vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">在线查词</h3>
              <button type="button" className="px-2 py-1 border rounded text-xs hover:bg-gray-50 cursor-pointer" onClick={() => { setShowLookup(false); setLookupResult(null); setLookupQuery('') }}>关闭</button>
            </div>

            <div className="flex gap-2 mb-4">
              <input
                className="flex-1 border rounded-lg px-3 py-2 text-sm"
                placeholder="输入英文单词..."
                value={lookupQuery}
                onChange={e => setLookupQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLookup()}
              />
              <button
                type="button"
                className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm hover:bg-brand-600 disabled:opacity-50"
                onClick={handleLookup}
                disabled={lookupLoading}
              >
                {lookupLoading ? '查询中...' : '查询'}
              </button>
            </div>

            {lookupResult && (
              <div className="space-y-3">
                <div>
                  <div className="text-xl font-semibold">{lookupResult.term}</div>
                  {lookupResult.ipa && <div className="text-sm text-gray-500 mt-1">{lookupResult.ipa}</div>}
                  {(lookupResult.phonetic_uk || lookupResult.phonetic_us) && (
                    <div className="text-xs text-gray-400 mt-0.5">
                      {lookupResult.phonetic_uk && <span>英 {lookupResult.phonetic_uk} </span>}
                      {lookupResult.phonetic_us && <span>美 {lookupResult.phonetic_us}</span>}
                    </div>
                  )}
                </div>

                {lookupResult.meaning && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs font-medium text-gray-500 mb-1">释义</div>
                    <div className="text-sm whitespace-pre-line">{lookupResult.meaning}</div>
                  </div>
                )}

                {lookupResult.en_meaning && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-xs font-medium text-blue-500 mb-1">英英释义</div>
                    <div className="text-sm whitespace-pre-line">{lookupResult.en_meaning}</div>
                  </div>
                )}

                {lookupResult.synonyms.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">近义词</div>
                    <div className="flex flex-wrap gap-1.5">
                      {lookupResult.synonyms.map((s, i) => (
                        <span key={i} className="px-2 py-0.5 bg-gray-100 rounded text-xs">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {lookupResult.examples.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">例句</div>
                    <div className="space-y-1.5">
                      {lookupResult.examples.slice(0, 4).map((ex, i) => (
                        <div key={i} className="text-xs text-gray-700 bg-gray-50 rounded p-2 whitespace-pre-line">{ex}</div>
                      ))}
                    </div>
                  </div>
                )}

                {lookupResult.phrases.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">短语</div>
                    <div className="space-y-1">
                      {lookupResult.phrases.slice(0, 5).map((p, i) => (
                        <div key={i} className="text-xs text-gray-700">{p}</div>
                      ))}
                    </div>
                  </div>
                )}

                {lookupResult.grammar.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">词形变化</div>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                      {lookupResult.grammar.map((g, i) => (
                        <span key={i} className="bg-gray-100 rounded px-2 py-0.5">{g}</span>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  className="w-full px-4 py-2 bg-brand-500 text-white rounded-lg text-sm hover:bg-brand-600 disabled:opacity-50 transition-colors"
                  onClick={handleSaveLookupWord}
                  disabled={lookupSaving}
                >
                  {lookupSaving ? '保存中...' : '添加到我的词库'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TXT导入弹窗 ── */}
      {showImport && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => { if (!importing) setShowImport(false) }}>
          <div className="bg-white rounded-xl w-full max-w-md p-5 mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">导入词表</h3>
              <button type="button" className="px-2 py-1 border rounded text-xs hover:bg-gray-50 cursor-pointer" onClick={() => setShowImport(false)}>关闭</button>
            </div>

            {!isAuthenticated ? (
              <div className="text-center py-8">
                <div className="text-amber-600 mb-2">⚠ 需要登录</div>
                <p className="text-sm text-gray-600 mb-4">请先登录后再导入词表</p>
                <button
                  type="button"
                  className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm hover:bg-brand-600"
                  onClick={() => navigate('/login')}
                >
                  去登录
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">导入到词典</label>
                  <select
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    value={selectedDictForImport}
                    onChange={e => setSelectedDictForImport(e.target.value)}
                    disabled={importing}
                  >
                    <option value="">请选择词典</option>
                    {dicts.mine
                      .filter(d => !['collected', 'wrong', 'mastered'].includes(d.id))
                      .filter(d => d.source === 'custom')
                      .map(d => (
                        <option key={d.id} value={d.id}>{d.name} ({d.wordCount}词)</option>
                      ))}
                  </select>
                  {dicts.mine.filter(d => d.source === 'custom').length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">您还没有创建词典，请先创建一个词典</p>
                  )}
                </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">导入模式</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={`flex-1 px-3 py-2 rounded-lg border-2 text-sm transition-colors ${importMode === 'quick' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200'}`}
                    onClick={() => setImportMode('quick')}
                  >
                    <div className="font-medium">快速导入</div>
                    <div className="text-xs mt-0.5 opacity-80">直接导入单词文本（≤200词）</div>
                  </button>
                  <button
                    type="button"
                    className={`flex-1 px-3 py-2 rounded-lg border-2 text-sm transition-colors ${importMode === 'batch' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200'}`}
                    onClick={() => setImportMode('batch')}
                  >
                    <div className="font-medium">智能导入</div>
                    <div className="text-xs mt-0.5 opacity-80">自动从有道词典获取释义</div>
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
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-brand-400 hover:bg-brand-50 transition-colors text-sm text-gray-600 disabled:opacity-50"
                  onClick={() => txtFileRef.current?.click()}
                  disabled={importing || !selectedDictForImport}
                >
                  {!selectedDictForImport ? '请先选择词典' : importing ? '导入中...' : '选择 TXT 文件（每行一个单词）'}
                </button>
              </div>

              {importTask && importTask.status === 'running' && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-blue-700">正在导入...</span>
                    <span className="text-blue-600">{importTask.current}/{importTask.total}</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 rounded-full h-2 transition-all"
                      style={{ width: `${(importTask.current / importTask.total) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-blue-600 mt-1">当前: {importTask.current_word}</div>
                </div>
              )}

              {importTask && importTask.status === 'completed' && (
                <div className="bg-green-50 rounded-lg p-3 text-sm">
                  <div className="font-medium text-green-700 mb-1">导入完成</div>
                  <div className="text-green-600 text-xs">
                    成功 {importTask.imported} | 跳过 {importTask.skipped} | 失败 {importTask.failed}
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-400">
                <p>支持 UTF-8 编码的 TXT 文件，每行一个英文单词。</p>
                <p className="mt-1">快速导入仅导入单词文本；智能导入自动从有道词典获取音标、释义、例句等完整信息。</p>
              </div>
            </div>
            )}
          </div>
        </div>
      )}

      {viewId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setViewId(undefined)}>
          <div className="bg-white rounded-xl w-full max-w-xl p-4 mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">列表</div>
              <button type="button" className="px-2 py-1 border rounded text-xs hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setViewId(undefined)}>关闭</button>
            </div>
            <ul className="max-h-96 overflow-auto space-y-2">
              {itemsByDict(viewId).map(w => (
                <li key={w.id} className="p-2 rounded border">
                  <div className="font-medium">{w.term}</div>
                  <div className="text-xs text-gray-600">{w.meaning}</div>
                </li>
              ))}
              {itemsByDict(viewId).length === 0 && <div className="text-gray-500 text-sm">暂无词条</div>}
            </ul>
          </div>
        </div>
      )}

      {reviewIds && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => { setReviewIds(undefined); setReviewIndex(0) }}>
          <div className="bg-white rounded-xl w-full max-w-md p-4 mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold">快速回顾 {reviewIndex + 1}/{reviewIds.length}</div>
              <button type="button" className="px-2 py-1 border rounded text-xs hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => { setReviewIds(undefined); setReviewIndex(0) }}>退出</button>
            </div>
            {(() => {
              const current = words.find(w => w.id === reviewIds[reviewIndex])
              if (!current) return <div className="text-gray-500">无词条</div>
              return (
                <div>
                  <div className="text-xl font-semibold">{current.term}</div>
                  <div className="text-gray-600">{current.meaning}</div>
                  <div className="mt-4 flex gap-2">
                    <button type="button" className="px-3 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors" onClick={() => setReviewIndex(i => Math.min(i + 1, reviewIds.length - 1))}>{"下一条"}</button>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}
    </>
  )
}

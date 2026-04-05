import { useSelector, useDispatch } from 'react-redux'
import type { RootState, AppDispatch } from '../store'
import { fetchSettings, updateSettings } from '../features/settings/settingsSlice'
import { useEffect, useState, useRef } from 'react'
import { settingsApi, dataApi, wordsApi, lookupApi } from '../services/api'
import type { WordItem as ApiWordItem } from '../services/api'
import { useToast } from '../components/Toast'
import { useTheme } from '../hooks/useTheme'
import { useTranslation } from 'react-i18next'

export default function Settings() {
  const dispatch = useDispatch<AppDispatch>()
  const { showToast } = useToast()
  const { theme, setTheme } = useTheme()
  const { settings, loading } = useSelector((s: RootState) => s.settings)
  const [username, setUsername] = useState('')
  const [dailyNewWordTarget, setDailyNewWordTarget] = useState(20)
  const [saving, setSaving] = useState(false)
  const importFileRef = useRef<HTMLInputElement>(null)
  const csvFileRef = useRef<HTMLInputElement>(null)
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [csvImporting, setCsvImporting] = useState(false)
  const txtFileRef = useRef<HTMLInputElement>(null)
  const [txtImporting, setTxtImporting] = useState(false)
  const [targetDictId, setTargetDictId] = useState('')
  const dicts = useSelector((s: RootState) => s.dicts.mine)
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated)
  const { t, i18n } = useTranslation()

  useEffect(() => {
    if (!settings) {
      dispatch(fetchSettings())
    }
  }, [settings, dispatch])

  useEffect(() => {
    if (settings) {
      setUsername(settings.username)
      setDailyNewWordTarget(settings.dailyNewWordTarget)
    }
  }, [settings])

  const handleSave = async () => {
    if (!settings) return

    setSaving(true)
    try {
      const updated = await settingsApi.update({
        username,
        dailyNewWordTarget,
      })
      dispatch(updateSettings(updated))
      showToast(t('settings.saveSuccess'), 'success')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('settings.saveFailed')
      showToast(errorMessage, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const data = await dataApi.exportAll()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `smilex-dict-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      showToast(t('settings.exportSuccess'), 'success')
    } catch (error) {
      showToast(t('settings.exportFailed', { error: error instanceof Error ? error.message : t('common.error') }), 'error')
    } finally {
      setExporting(false)
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      await dataApi.importAll(data)
      showToast(t('settings.importSuccess'), 'success')
    } catch (error) {
      showToast(t('settings.importFailed', { error: error instanceof Error ? error.message : t('settings.invalidFormat') }), 'error')
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCsvImporting(true)
    try {
      const text = await file.text()
      const lines = text.split('\n').filter(l => l.trim())
      if (lines.length < 2) throw new Error(t('settings.csvMinRows'))
      const header = lines[0].split(',').map(h => h.trim().toLowerCase())
      const words: ApiWordItem[] = []
      for (let i = 1; i < lines.length; i++) {
        const cols = parseCsvLine(lines[i])
        if (cols.length < 2) continue
        const term = cols[header.indexOf('term')] || cols[0] || ''
        const meaning = cols[header.indexOf('meaning')] || cols[1] || ''
        if (!term || !meaning) continue
        words.push({
          id: `import-${Date.now()}-${i}`,
          term: term.trim(),
          meaning: meaning.trim(),
          ipa: (cols[header.indexOf('ipa')] || cols[2] || '').trim() || undefined,
          example: (cols[header.indexOf('example')] || cols[3] || '').trim() || undefined,
          synonyms: (cols[header.indexOf('synonyms')] || cols[4] || '').trim().split(';').filter(Boolean),
          status: 'new',
          dictId: undefined,
        })
      }
      if (words.length === 0) throw new Error(t('settings.csvNoValidWords'))
      await wordsApi.bulkCreate(words)
      showToast(t('settings.csvImportSuccess', { count: words.length }), 'success')
    } catch (error) {
      showToast(t('settings.importFailed', { error: error instanceof Error ? error.message : t('settings.invalidFormat') }), 'error')
    } finally {
      setCsvImporting(false)
      e.target.value = ''
    }
  }

  const parseCsvLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current)
        current = ''
      } else {
        current += char
      }
    }
    result.push(current)
    return result
  }

  const handleTxtImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!isAuthenticated) {
      showToast(t('settings.loginRequiredForImport'), 'error')
      e.target.value = ''
      return
    }

    if (!targetDictId) {
      showToast(t('settings.selectDict'), 'error')
      e.target.value = ''
      return
    }

    setTxtImporting(true)
    try {
      const text = await file.text()
      const lines = text.split(/\r?\n/).map(l => l.replace(/\ufeff/g, '').trim()).filter(Boolean)
      if (lines.length === 0) throw new Error(t('settings.emptyFile'))

      let imported = 0
      let failed = 0
      const batchSize = 5
      for (let i = 0; i < lines.length; i += batchSize) {
        const batch = lines.slice(i, i + batchSize)
        const results = await Promise.allSettled(
          batch.map(async (term) => {
            const result = await lookupApi.lookup(term, true, targetDictId)
            return result
          })
        )
        for (const r of results) {
          if (r.status === 'fulfilled' && r.value) imported++
          else failed++
        }
      }

      showToast(t('settings.txtImportResult', { imported, failed }), imported > 0 ? 'success' : 'error')
    } catch (error) {
      showToast(t('settings.importFailed', { error: error instanceof Error ? error.message : t('settings.invalidFormat') }), 'error')
    } finally {
      setTxtImporting(false)
      e.target.value = ''
    }
  }

  if (!settings && loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">{t('common.loading')}</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-semibold">{t('settings.title')}</h2>

      <div className="rounded-xl border bg-white p-6">
        <h3 className="text-lg font-medium mb-4">{t('settings.userInfo')}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.username')}</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder={t('settings.usernamePlaceholder')}
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6">
        <h3 className="text-lg font-medium mb-4">{t('settings.learningSettings')}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('settings.dailyNewWordTarget')}
            </label>
            <input
              type="number"
              min="1"
              max="100"
              className="w-full border rounded px-3 py-2"
              value={dailyNewWordTarget}
              onChange={e => setDailyNewWordTarget(parseInt(e.target.value) || 20)}
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('settings.dailyNewWordTargetHint')}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6">
        <h3 className="text-lg font-medium mb-4">{t('settings.appearance')}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.themeMode')}</label>
            <div className="flex gap-3">
              {([
                { value: 'light', label: t('settings.themeLight') },
                { value: 'dark', label: t('settings.themeDark') },
                { value: 'system', label: t('settings.themeSystem') },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    theme === opt.value
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setTheme(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.language')}</label>
            <p className="text-xs text-gray-500 mb-2">{t('settings.languageDesc')}</p>
            <div className="flex gap-3">
              {([
                { value: 'zh', label: '中文' },
                { value: 'en', label: 'English' },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    i18n.language === opt.value || (i18n.language?.startsWith('zh') && opt.value === 'zh')
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => i18n.changeLanguage(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6">
        <h3 className="text-lg font-medium mb-4">{t('settings.dataManagement')}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.exportData')}</label>
            <p className="text-xs text-gray-500 mb-2">{t('settings.exportDesc')}</p>
            <button
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors text-sm"
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting ? t('settings.exporting') : t('settings.exportButton')}
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.importData')}</label>
            <p className="text-xs text-gray-500 mb-2">{t('settings.importDesc')}</p>
            <input
              type="file"
              accept=".json"
              ref={importFileRef}
              onChange={handleImport}
              className="hidden"
            />
            <button
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors text-sm"
              onClick={() => importFileRef.current?.click()}
              disabled={importing}
            >
              {importing ? t('settings.importing') : t('settings.importButton')}
            </button>
          </div>
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.csvImport')}</label>
            <p className="text-xs text-gray-500 mb-2">{t('settings.csvImportDesc')}</p>
            <input
              type="file"
              accept=".csv"
              ref={csvFileRef}
              onChange={handleCsvImport}
              className="hidden"
            />
            <button
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors text-sm"
              onClick={() => csvFileRef.current?.click()}
              disabled={csvImporting}
            >
              {csvImporting ? t('settings.importing') : t('settings.csvImportButton')}
            </button>
          </div>
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.txtImport')}</label>
            <p className="text-xs text-gray-500 mb-2">{t('settings.txtImportDesc')}</p>
            
            {!isAuthenticated ? (
              <div className="text-xs text-amber-600 mb-2">
                ⚠ {t('settings.loginRequiredForImport')}
              </div>
            ) : (
              <div className="mb-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('settings.importToDict')}</label>
                <select
                  className="w-full border rounded px-3 py-1.5 text-sm"
                  value={targetDictId}
                  onChange={e => setTargetDictId(e.target.value)}
                  disabled={txtImporting}
                >
                  <option value="">{t('settings.selectDict')}</option>
                  {dicts
                    .filter(d => !['collected', 'wrong', 'mastered'].includes(d.id))
                    .filter(d => d.source === 'custom')
                    .map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.wordCount}{t('common.words')})</option>
                    ))}
                </select>
                {dicts.filter(d => d.source === 'custom').length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">{t('settings.noCustomDict')}</p>
                )}
              </div>
            )}
            
            <input
              type="file"
              accept=".txt"
              ref={txtFileRef}
              onChange={handleTxtImport}
              className="hidden"
            />
            <button
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors text-sm disabled:opacity-50"
              onClick={() => txtFileRef.current?.click()}
              disabled={txtImporting || !isAuthenticated || !targetDictId}
            >
              {txtImporting ? t('settings.importing') : t('settings.txtImportButton')}
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          className={`px-6 py-2 rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition-colors ${
            saving ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? t('common.saving') : t('settings.saveSettings')}
        </button>
      </div>
    </div>
  )
}

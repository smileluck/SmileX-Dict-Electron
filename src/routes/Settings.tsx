import { useSelector, useDispatch } from 'react-redux'
import type { RootState, AppDispatch } from '../store'
import { fetchSettings, updateSettings } from '../features/settings/settingsSlice'
import { useEffect, useState, useRef } from 'react'
import { settingsApi, dataApi, wordsApi } from '../services/api'
import type { WordItem as ApiWordItem } from '../services/api'
import { useToast } from '../components/Toast'
import type { PracticeMode } from '../services/api'
import { useTheme } from '../hooks/useTheme'

export default function Settings() {
  const dispatch = useDispatch<AppDispatch>()
  const { showToast } = useToast()
  const { theme, setTheme } = useTheme()
  const { settings, loading } = useSelector((s: RootState) => s.settings)
  const [username, setUsername] = useState('')
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('zh-en')
  const [dailyNewWordTarget, setDailyNewWordTarget] = useState(20)
  const [saving, setSaving] = useState(false)
  const importFileRef = useRef<HTMLInputElement>(null)
  const csvFileRef = useRef<HTMLInputElement>(null)
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [csvImporting, setCsvImporting] = useState(false)

  useEffect(() => {
    if (!settings) {
      dispatch(fetchSettings())
    }
  }, [settings, dispatch])

  useEffect(() => {
    if (settings) {
      setUsername(settings.username)
      setPracticeMode(settings.practiceMode)
      setDailyNewWordTarget(settings.dailyNewWordTarget)
    }
  }, [settings])

  const handleSave = async () => {
    if (!settings) return

    setSaving(true)
    try {
      const updated = await settingsApi.update({
        username,
        practiceMode,
        dailyNewWordTarget,
      })
      dispatch(updateSettings(updated))
      showToast('设置保存成功', 'success')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '保存失败，请重试'
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
      showToast('数据导出成功', 'success')
    } catch (error) {
      showToast('导出失败: ' + (error instanceof Error ? error.message : '未知错误'), 'error')
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
      showToast('数据导入成功，请刷新页面', 'success')
    } catch (error) {
      showToast('导入失败: ' + (error instanceof Error ? error.message : '文件格式错误'), 'error')
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
      if (lines.length < 2) throw new Error('CSV 文件至少需要包含标题行和一行数据')
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
      if (words.length === 0) throw new Error('未找到有效的单词数据')
      await wordsApi.bulkCreate(words)
      showToast(`成功导入 ${words.length} 个单词`, 'success')
    } catch (error) {
      showToast('导入失败: ' + (error instanceof Error ? error.message : '文件格式错误'), 'error')
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

  if (!settings && loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">加载中...</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-semibold">个人设置</h2>

      <div className="rounded-xl border bg-white p-6">
        <h3 className="text-lg font-medium mb-4">用户信息</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="请输入用户名"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6">
        <h3 className="text-lg font-medium mb-4">学习设置</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">单词背诵模式</label>
            <div className="flex gap-3">
              <button
                className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                  practiceMode === 'zh-en'
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setPracticeMode('zh-en')}
              >
                中英模式
              </button>
              <button
                className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                  practiceMode === 'en-en'
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setPracticeMode('en-en')}
              >
                英英模式
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {practiceMode === 'zh-en' ? '显示中文释义，输入对应的英文单词' : '显示英文单词和例句，选择正确的释义'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              每日新词学习目标
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
              每天学习的新词数量（不包括复习单词）
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6">
        <h3 className="text-lg font-medium mb-4">外观设置</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">主题模式</label>
          <div className="flex gap-3">
            {([
              { value: 'light', label: '浅色' },
              { value: 'dark', label: '深色' },
              { value: 'system', label: '跟随系统' },
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
      </div>

      <div className="rounded-xl border bg-white p-6">
        <h3 className="text-lg font-medium mb-4">数据管理</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">导出学习数据</label>
            <p className="text-xs text-gray-500 mb-2">将所有学习数据导出为 JSON 文件，用于备份</p>
            <button
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors text-sm"
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting ? '导出中...' : '导出数据'}
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">导入学习数据</label>
            <p className="text-xs text-gray-500 mb-2">从 JSON 备份文件恢复学习数据</p>
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
              {importing ? '导入中...' : '导入数据'}
            </button>
          </div>
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">批量导入单词</label>
            <p className="text-xs text-gray-500 mb-2">从 CSV 文件批量导入单词，格式：term,meaning,ipa,example,synonyms</p>
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
              {csvImporting ? '导入中...' : '从 CSV 导入'}
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
          {saving ? '保存中...' : '保存设置'}
        </button>
      </div>
    </div>
  )
}

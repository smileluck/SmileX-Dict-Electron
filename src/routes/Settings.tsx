import { useSelector, useDispatch } from 'react-redux'
import type { RootState, AppDispatch } from '../store'
import { fetchSettings, updateSettings } from '../features/settings/settingsSlice'
import { useEffect, useState } from 'react'
import { settingsApi } from '../services/api'
import { useToast } from '../components/Toast'
import type { PracticeMode } from '../services/api'

export default function Settings() {
  const dispatch = useDispatch<AppDispatch>()
  const { showToast } = useToast()
  const { settings, loading } = useSelector((s: RootState) => s.settings)
  const [username, setUsername] = useState('')
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('zh-en')
  const [dailyNewWordTarget, setDailyNewWordTarget] = useState(20)
  const [saving, setSaving] = useState(false)

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

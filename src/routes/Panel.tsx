import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from '../store'
import { signIn, setHistoryStats, calcStreak } from '../features/panel/panelSlice'
import { useEffect, useState, useMemo } from 'react'
import { statsApi } from '../services/api'
import type { OverviewStat } from '../services/api'
import Loading from '../components/Loading'

export default function Panel() {
  const dispatch = useDispatch()
  const { signinDates, stats, historyStats } = useSelector((s: RootState) => s.panel)
  const words = useSelector((s: RootState) => s.words.items)
  const today = new Date().toISOString().slice(0,10)
  const todayStatStore = stats.find(s=>s.date===today)
  const signed = signinDates.includes(today)

  const [remote, setRemote] = useState<{newCount:number;reviewCount:number;dictationCount:number}|undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [error, setError] = useState<string|null>(null)
  const [overview, setOverview] = useState<OverviewStat|null>(null)

  // Fetch today's stats
  useEffect(()=>{
    setLoading(true)
    statsApi.getToday()
      .then(data => {
        setRemote({ newCount: data.newCount, reviewCount: data.reviewCount, dictationCount: data.dictationCount })
        setError(null)
      })
      .catch(err => {
        console.warn('Failed to fetch stats:', err)
        setError('无法连接到服务器')
      })
      .finally(() => setLoading(false))
  },[])

  // Fetch history stats
  useEffect(() => {
    setHistoryLoading(true)
    statsApi.getHistory(7)
      .then(data => {
        dispatch(setHistoryStats(data))
      })
      .catch(err => {
        console.warn('Failed to fetch history:', err)
      })
      .finally(() => setHistoryLoading(false))
  }, [dispatch])

  // Fetch overview
  useEffect(() => {
    statsApi.getOverview()
      .then(data => setOverview(data))
      .catch(err => console.warn('Failed to fetch overview:', err))
  }, [])

  // Calculate streak
  const streak = useMemo(() => calcStreak(signinDates), [signinDates])

  // Today's learning total
  const todayNew = remote?.newCount ?? todayStatStore?.newCount ?? 0
  const todayReview = remote?.reviewCount ?? todayStatStore?.reviewCount ?? 0
  const todayDictation = remote?.dictationCount ?? todayStatStore?.dictationCount ?? 0
  const todayTotal = todayNew + todayReview + todayDictation

  // Sign-in precondition: must have learning activity today
  const canSignIn = !signed && todayTotal > 0

  // Local overview from Redux words
  const localOverview = useMemo(() => {
    const total = words.length
    const mastered = words.filter(w => w.status === 'mastered').length
    const collected = words.filter(w => w.status === 'collected').length
    const wrong = words.filter(w => w.status === 'wrong').length
    const masteryRate = total > 0 ? Math.round(mastered / total * 100) : 0
    return { total, mastered, collected, wrong, masteryRate }
  }, [words])

  // Use remote overview if available, otherwise local
  const overviewData = overview ? {
    total: overview.totalWords || localOverview.total,
    mastered: overview.masteredWords || localOverview.mastered,
    collected: overview.collectedWords || localOverview.collected,
    wrong: overview.wrongWords || localOverview.wrong,
    masteryRate: overview.masteryRate || localOverview.masteryRate,
  } : localOverview

  // Max value for chart scaling
  const chartMax = useMemo(() => {
    if (historyStats.length === 0) return 1
    return Math.max(...historyStats.map(s => s.newCount + s.reviewCount + s.dictationCount), 1)
  }, [historyStats])

  // Day labels
  const dayLabels = ['日', '一', '二', '三', '四', '五', '六']

  return (
    <div className="space-y-6">
      {/* Sign-in card with streak */}
      <div className="rounded-xl border bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">每日签到</h3>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-4xl font-bold text-brand-600">{streak}</span>
              <span className="text-sm text-gray-500">天连续签到</span>
            </div>
          </div>
          <div className="text-right">
            {signed ? (
              <div className="flex flex-col items-end gap-1">
                <span className="px-4 py-2 rounded-lg bg-green-100 text-green-700 font-medium text-sm">✓ 已签到</span>
              </div>
            ) : todayTotal > 0 ? (
              <button
                className="px-4 py-2 rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition-colors font-medium text-sm"
                onClick={() => dispatch(signIn())}
              >
                签到
              </button>
            ) : (
              <div className="flex flex-col items-end gap-1">
                <span className="px-4 py-2 rounded-lg bg-gray-100 text-gray-400 font-medium text-sm cursor-not-allowed">签到</span>
                <span className="text-xs text-gray-400">请先完成学习后再签到</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Today's stats */}
      <div className="rounded-xl border bg-white p-5">
        <h3 className="font-semibold mb-3">今日学习情况</h3>
        {loading ? (
          <Loading text="加载统计数据..." />
        ) : (
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-brand-50 p-4">
              <div className="text-3xl font-bold text-brand-600">{todayNew}</div>
              <div className="text-xs text-gray-500 mt-1">新词数</div>
            </div>
            <div className="rounded-lg bg-green-50 p-4">
              <div className="text-3xl font-bold text-green-600">{todayReview}</div>
              <div className="text-xs text-gray-500 mt-1">复习次数</div>
            </div>
            <div className="rounded-lg bg-orange-50 p-4">
              <div className="text-3xl font-bold text-orange-600">{todayDictation}</div>
              <div className="text-xs text-gray-500 mt-1">默写次数</div>
            </div>
          </div>
        )}
        {error && <div className="mt-2 text-xs text-amber-600">⚠ {error}（显示本地数据）</div>}
      </div>

      {/* Weekly trend chart */}
      <div className="rounded-xl border bg-white p-5">
        <h3 className="font-semibold mb-3">本周学习趋势</h3>
        {historyLoading ? (
          <Loading text="加载趋势数据..." />
        ) : historyStats.length === 0 ? (
          <div className="text-gray-400 text-sm text-center py-4">暂无历史数据</div>
        ) : (
          <div className="flex items-end gap-2 h-32">
            {historyStats.map((s, i) => {
              const total = s.newCount + s.reviewCount + s.dictationCount
              const height = Math.max((total / chartMax) * 100, 4)
              const date = new Date(s.date)
              const dayLabel = dayLabels[date.getDay()]
              const isToday = s.date === today
              return (
                <div key={s.date} className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-xs text-gray-500">{total}</div>
                  <div
                    className={`w-full rounded-t transition-all ${isToday ? 'bg-brand-500' : 'bg-brand-200'}`}
                    style={{ height: `${height}%`, minHeight: '4px' }}
                  />
                  <div className={`text-xs ${isToday ? 'font-bold text-brand-600' : 'text-gray-400'}`}>{dayLabel}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Learning overview */}
      <div className="rounded-xl border bg-white p-5">
        <h3 className="font-semibold mb-3">学习概览</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <div className="text-2xl font-bold text-gray-700">{overviewData.total}</div>
            <div className="text-xs text-gray-500 mt-1">总词汇</div>
          </div>
          <div className="rounded-lg bg-green-50 p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{overviewData.mastered}</div>
            <div className="text-xs text-gray-500 mt-1">已掌握</div>
          </div>
          <div className="rounded-lg bg-amber-50 p-3 text-center">
            <div className="text-2xl font-bold text-amber-600">{overviewData.collected}</div>
            <div className="text-xs text-gray-500 mt-1">收藏</div>
          </div>
          <div className="rounded-lg bg-red-50 p-3 text-center">
            <div className="text-2xl font-bold text-red-600">{overviewData.wrong}</div>
            <div className="text-xs text-gray-500 mt-1">错词</div>
          </div>
        </div>
        {/* Mastery rate progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">掌握率</span>
            <span className="font-medium text-brand-600">{overviewData.masteryRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-brand-500 rounded-full h-2 transition-all"
              style={{ width: `${overviewData.masteryRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Sign-in history */}
      <div className="rounded-xl border bg-white p-5">
        <h3 className="font-semibold mb-3">签到记录</h3>
        {signinDates.length === 0 ? (
          <div className="text-gray-500 text-sm text-center py-4">暂无签到记录，今天开始签到吧！</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {signinDates.slice().reverse().slice(0, 30).map(d => (
              <span key={d} className="px-2 py-1 rounded bg-brand-100 text-brand-700 text-xs font-medium">{d}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

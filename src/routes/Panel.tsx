import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from '../store'
import { signIn, calcStreak, canSignInToday } from '../features/panel/panelSlice'
import { useEffect, useState, useMemo } from 'react'
import { statsApi } from '../services/api'
import Loading from '../components/Loading'

type TimeRange = 7 | 30 | 180

export default function Panel() {
  const dispatch = useDispatch()
  const { signinDates, stats } = useSelector((s: RootState) => s.panel)
  const words = useSelector((s: RootState) => s.words.items)
  const today = new Date().toISOString().slice(0, 10)
  const todayStatStore = stats.find(s => s.date === today)
  const signed = signinDates.includes(today)

  const [remote, setRemote] = useState<{ newCount: number; reviewCount: number; dictationCount: number; wrongCount: number } | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // History stats for trend chart
  const [historyData, setHistoryData] = useState<{ date: string; newCount: number; reviewCount: number; dictationCount: number; wrongCount: number }[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [timeRange, setTimeRange] = useState<TimeRange>(7)

  // Fetch today's stats
  useEffect(() => {
    setLoading(true)
    statsApi.getToday()
      .then(data => {
        setRemote({ newCount: data.newCount, reviewCount: data.reviewCount, dictationCount: data.dictationCount, wrongCount: data.wrongCount })
        setError(null)
      })
      .catch(err => {
        console.warn('Failed to fetch stats:', err)
        setError('无法连接到服务器')
      })
      .finally(() => setLoading(false))
  }, [])

  // Fetch history stats when time range changes
  useEffect(() => {
    setHistoryLoading(true)
    statsApi.getHistory(timeRange)
      .then(data => {
        setHistoryData(data)
      })
      .catch(err => {
        console.warn('Failed to fetch history:', err)
        // Fallback to local stats for 7-day view
        if (timeRange === 7) {
          setHistoryData(stats.slice(-7))
        }
      })
      .finally(() => setHistoryLoading(false))
  }, [timeRange, stats])

  // Calculate streak
  const streak = useMemo(() => calcStreak(signinDates), [signinDates])

  // Check if user can sign in today (all pending words completed)
  const canSignIn = useMemo(() => canSignInToday(words), [words])

  // Today's learning total
  const todayNew = remote?.newCount ?? todayStatStore?.newCount ?? 0
  const todayReview = remote?.reviewCount ?? todayStatStore?.reviewCount ?? 0
  const todayDictation = remote?.dictationCount ?? todayStatStore?.dictationCount ?? 0
  const todayWrong = remote?.wrongCount ?? todayStatStore?.wrongCount ?? 0

  // Local overview from Redux words
  const overviewData = useMemo(() => {
    const total = words.length
    const mastered = words.filter(w => w.status === 'mastered').length
    const collected = words.filter(w => w.status === 'collected').length
    const wrong = words.filter(w => w.status === 'wrong').length
    const masteryRate = total > 0 ? Math.round(mastered / total * 100) : 0
    return { total, mastered, collected, wrong, masteryRate }
  }, [words])

  // Review forecast for next 7 days
  const reviewForecast = useMemo(() => {
    const forecast: { label: string; count: number; dateStr: string }[] = []
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    for (let i = 0; i < 7; i++) {
      const d = new Date()
      d.setDate(d.getDate() + i)
      const dStr = d.toISOString().slice(0, 10)
      const count = words.filter(w => w.nextReviewDate && w.nextReviewDate.split('T')[0] === dStr && w.status !== 'mastered').length
      forecast.push({
        label: i === 0 ? '今天' : i === 1 ? '明天' : dayNames[d.getDay()],
        count,
        dateStr: dStr.slice(5), // MM-DD
      })
    }
    return forecast
  }, [words])

  const maxForecast = Math.max(...reviewForecast.map(f => f.count), 1)

  // Day labels
  const dayLabels = ['日', '一', '二', '三', '四', '五', '六']

  // Compute max value for trend chart
  const maxTrendVal = useMemo(() => {
    if (historyData.length === 0) return 1
    return Math.max(...historyData.map(s => s.newCount + s.reviewCount + s.dictationCount + s.wrongCount), 1)
  }, [historyData])

  // Determine which labels to show based on time range
  const labelInterval = timeRange <= 7 ? 1 : timeRange <= 30 ? 3 : 14

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
            ) : canSignIn ? (
              <button
                className="px-4 py-2 rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition-colors font-medium text-sm"
                onClick={() => dispatch(signIn())}
              >
                签到
              </button>
            ) : (
              <div className="flex flex-col items-end gap-1">
                <span className="px-4 py-2 rounded-lg bg-gray-100 text-gray-400 font-medium text-sm cursor-not-allowed">签到</span>
                <span className="text-xs text-gray-400">请先完成所有待学习单词</span>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
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
            <div className="rounded-lg bg-red-50 p-4">
              <div className="text-3xl font-bold text-red-600">{todayWrong}</div>
              <div className="text-xs text-gray-500 mt-1">错词数</div>
            </div>
          </div>
        )}
        {error && <div className="mt-2 text-xs text-amber-600">⚠ {error}（显示本地数据）</div>}
      </div>

      {/* Learning trend chart with time range filter */}
      <div className="rounded-xl border bg-white p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">学习趋势</h3>
          <div className="flex gap-1">
            {([7, 30, 180] as TimeRange[]).map(d => (
              <button
                key={d}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  timeRange === d
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                onClick={() => setTimeRange(d)}
              >
                {d === 7 ? '近7天' : d === 30 ? '近1月' : '近半年'}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mb-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-brand-500 inline-block" /> 新词</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-500 inline-block" /> 复习</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-orange-400 inline-block" /> 默写</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-400 inline-block" /> 错词</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-gray-300 inline-block" /> 未学习</span>
        </div>

        {historyLoading ? (
          <Loading text="加载趋势数据..." />
        ) : historyData.length === 0 ? (
          <div className="text-gray-400 text-sm text-center py-4">暂无历史数据</div>
        ) : (
          <div className="relative">
            {/* Chart area with baseline */}
            <div className="flex items-end h-44" style={{ gap: timeRange <= 7 ? '6px' : timeRange <= 30 ? '2px' : '1px' }}>
              {historyData.map((s, idx) => {
                const total = s.newCount + s.reviewCount + s.dictationCount + s.wrongCount
                const showLabel = idx % labelInterval === 0 || s.date === today
                const date = new Date(s.date + 'T00:00:00')
                const dayLabel = dayLabels[date.getDay()]
                const isToday = s.date === today
                const hasData = total > 0

                // Calculate heights for stacked bars (percentages of max)
                const totalH = maxTrendVal > 0 ? (total / maxTrendVal) * 100 : 0
                const newH = maxTrendVal > 0 ? (s.newCount / maxTrendVal) * 100 : 0
                const reviewH = maxTrendVal > 0 ? (s.reviewCount / maxTrendVal) * 100 : 0
                const dictH = maxTrendVal > 0 ? (s.dictationCount / maxTrendVal) * 100 : 0
                const wrongH = maxTrendVal > 0 ? (s.wrongCount / maxTrendVal) * 100 : 0

                return (
                  <div key={s.date} className="flex-1 flex flex-col items-center group relative min-w-0">
                    {/* Tooltip - show for all days */}
                    <div className="absolute -top-20 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg">
                      <div className="font-medium mb-1">{s.date.slice(5)} {timeRange <= 7 ? dayLabel : ''}</div>
                      <div className="space-y-0.5">
                        <div>新词: {s.newCount} · 复习: {s.reviewCount}</div>
                        <div>默写: {s.dictationCount} · 错词: {s.wrongCount}</div>
                        <div className="text-gray-300">合计: {total}</div>
                      </div>
                    </div>

                    {/* Count label */}
                    <div className={`text-xs mb-1 ${hasData ? 'text-gray-500 font-medium' : 'text-gray-300'}`}>
                      {hasData ? total : '—'}
                    </div>

                    {/* Bar area */}
                    <div className="w-full flex items-end" style={{ height: '100px' }}>
                      {hasData ? (
                        <div
                          className="w-full relative rounded-t"
                          style={{ height: `${Math.max(totalH, 6)}%`, minHeight: '6px' }}
                        >
                          {/* Stacked from bottom: wrong, dictation, review, new */}
                          <div className="absolute bottom-0 w-full bg-red-400 rounded-b-sm" style={{ height: `${wrongH}%`, minHeight: s.wrongCount > 0 ? '2px' : '0' }} />
                          <div className="absolute w-full bg-orange-400" style={{ bottom: `${wrongH}%`, height: `${dictH}%`, minHeight: s.dictationCount > 0 ? '2px' : '0' }} />
                          <div className="absolute w-full bg-green-500" style={{ bottom: `${wrongH + dictH}%`, height: `${reviewH}%`, minHeight: s.reviewCount > 0 ? '2px' : '0' }} />
                          <div className="absolute w-full bg-brand-500 rounded-t-sm" style={{ bottom: `${wrongH + dictH + reviewH}%`, height: `${newH}%`, minHeight: s.newCount > 0 ? '2px' : '0' }} />
                        </div>
                      ) : (
                        /* No data: show baseline dash */
                        <div className="w-full flex items-end justify-center" style={{ height: '100%' }}>
                          <div className="w-3/4 border-b-2 border-dashed border-gray-300" />
                        </div>
                      )}
                    </div>

                    {/* Date label */}
                    {showLabel && (
                      <div className={`mt-1 text-xs ${isToday ? 'font-bold text-brand-600' : 'text-gray-400'}`}>
                        {timeRange <= 7 ? dayLabel : s.date.slice(5)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Review forecast */}
      <div className="rounded-xl border bg-white p-5">
        <h3 className="font-semibold mb-3">复习预测</h3>
        <div className="space-y-2">
          {reviewForecast.map(f => (
            <div key={f.dateStr} className="flex items-center gap-3">
              <div className="w-12 text-xs text-gray-500 flex-shrink-0">
                <div>{f.label}</div>
                <div className="text-gray-400">{f.dateStr}</div>
              </div>
              <div className="flex-1 bg-gray-100 rounded-full h-5 relative overflow-hidden">
                <div
                  className="bg-brand-400 rounded-full h-5 transition-all flex items-center justify-end pr-2"
                  style={{ width: `${Math.max((f.count / maxForecast) * 100, f.count > 0 ? 10 : 0)}%` }}
                >
                  {f.count > 0 && <span className="text-xs text-white font-medium">{f.count}</span>}
                </div>
              </div>
              <div className="w-8 text-right text-xs text-gray-500">{f.count}词</div>
            </div>
          ))}
        </div>
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

      {/* SM2 Memory Analytics */}
      <div className="rounded-xl border bg-white p-5">
        <h3 className="font-semibold mb-3">SM2 记忆分析</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg bg-purple-50 p-3 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {words.length > 0 ? (words.reduce((sum, w) => sum + w.efactor, 0) / words.length).toFixed(2) : '—'}
            </div>
            <div className="text-xs text-gray-500 mt-1">平均记忆因子</div>
          </div>
          <div className="rounded-lg bg-indigo-50 p-3 text-center">
            <div className="text-2xl font-bold text-indigo-600">
              {words.length > 0 ? Math.round(words.reduce((sum, w) => sum + w.responseTime, 0) / words.length) : '—'}
            </div>
            <div className="text-xs text-gray-500 mt-1">平均响应(ms)</div>
          </div>
          <div className="rounded-lg bg-cyan-50 p-3 text-center">
            <div className="text-2xl font-bold text-cyan-600">
              {words.length > 0 ? (words.reduce((sum, w) => sum + w.averageQuality, 0) / words.length).toFixed(1) : '—'}
            </div>
            <div className="text-xs text-gray-500 mt-1">平均质量分</div>
          </div>
          <div className="rounded-lg bg-teal-50 p-3 text-center">
            <div className="text-2xl font-bold text-teal-600">
              {words.filter(w => w.fatigueFactor > 0.6).length}
            </div>
            <div className="text-xs text-gray-500 mt-1">疲劳词数</div>
          </div>
        </div>

        {/* Difficulty distribution */}
        <div className="mt-4">
          <div className="text-sm text-gray-600 mb-2">难度分布</div>
          {(() => {
            const dist = [1, 2, 3, 4, 5].map(level => ({
              level,
              count: words.filter(w => w.difficulty === level).length,
              label: ['', '基础', '入门', '中等', '困难', '高级'][level],
              color: ['', 'bg-green-400', 'bg-green-500', 'bg-yellow-400', 'bg-orange-400', 'bg-red-400'][level],
            }))
            const maxCount = Math.max(...dist.map(d => d.count), 1)
            return (
              <div className="space-y-1.5">
                {dist.map(d => (
                  <div key={d.level} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-10">{d.label}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                      <div className={`h-2.5 rounded-full ${d.color}`} style={{ width: `${(d.count / maxCount) * 100}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 w-6 text-right">{d.count}</span>
                  </div>
                ))}
              </div>
            )
          })()}
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

import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from '../store'
import { signIn, calcStreak, canSignInToday } from '../features/panel/panelSlice'
import { useEffect, useState, useMemo } from 'react'
import { statsApi } from '../services/api'
import Loading from '../components/Loading'
import { useTranslation } from 'react-i18next'

type TimeRange = 7 | 30 | 180

export default function Panel() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { signinDates, stats } = useSelector((s: RootState) => s.panel)
  const words = useSelector((s: RootState) => s.words.items)
  const today = new Date().toISOString().slice(0, 10)
  const todayStatStore = stats.find(s => s.date === today)
  const signed = signinDates.includes(today)

  const [remote, setRemote] = useState<{ newCount: number; reviewCount: number; dictationCount: number; wrongCount: number } | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [historyData, setHistoryData] = useState<{ date: string; newCount: number; reviewCount: number; dictationCount: number; wrongCount: number }[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [timeRange, setTimeRange] = useState<TimeRange>(7)

  useEffect(() => {
    setLoading(true)
    statsApi.getToday()
      .then(data => {
        setRemote({ newCount: data.newCount, reviewCount: data.reviewCount, dictationCount: data.dictationCount, wrongCount: data.wrongCount })
        setError(null)
      })
      .catch(err => {
        console.warn('Failed to fetch stats:', err)
        setError(t('panel.serverError'))
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    setHistoryLoading(true)
    statsApi.getHistory(timeRange)
      .then(data => {
        setHistoryData(data)
      })
      .catch(err => {
        console.warn('Failed to fetch history:', err)
        if (timeRange === 7) {
          setHistoryData(stats.slice(-7))
        }
      })
      .finally(() => setHistoryLoading(false))
  }, [timeRange, stats])

  const streak = useMemo(() => calcStreak(signinDates), [signinDates])

  const canSignIn = useMemo(() => canSignInToday(words), [words])

  const todayNew = remote?.newCount ?? todayStatStore?.newCount ?? 0
  const todayReview = remote?.reviewCount ?? todayStatStore?.reviewCount ?? 0
  const todayDictation = remote?.dictationCount ?? todayStatStore?.dictationCount ?? 0
  const todayWrong = remote?.wrongCount ?? todayStatStore?.wrongCount ?? 0

  const overviewData = useMemo(() => {
    const total = words.length
    const mastered = words.filter(w => w.status === 'mastered').length
    const collected = words.filter(w => w.status === 'collected').length
    const wrong = words.filter(w => w.status === 'wrong').length
    const masteryRate = total > 0 ? Math.round(mastered / total * 100) : 0
    return { total, mastered, collected, wrong, masteryRate }
  }, [words])

  const dayNames = t('panel.daysOfWeek', { returnObjects: true }) as string[]

  const reviewForecast = useMemo(() => {
    const forecast: { label: string; count: number; dateStr: string }[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date()
      d.setDate(d.getDate() + i)
      const dStr = d.toISOString().slice(0, 10)
      const count = words.filter(w => w.nextReviewDate && w.nextReviewDate.split('T')[0] === dStr && w.status !== 'mastered').length
      forecast.push({
        label: i === 0 ? t('panel.today') : i === 1 ? t('panel.tomorrow') : dayNames[d.getDay()],
        count,
        dateStr: dStr.slice(5),
      })
    }
    return forecast
  }, [words, dayNames])

  const maxForecast = Math.max(...reviewForecast.map(f => f.count), 1)

  const maxTrendVal = useMemo(() => {
    if (historyData.length === 0) return 1
    return Math.max(...historyData.map(s => s.newCount + s.reviewCount + s.dictationCount + s.wrongCount), 1)
  }, [historyData])

  const labelInterval = timeRange <= 7 ? 1 : timeRange <= 30 ? 3 : 14

  return (
    <div className="space-y-6 page-enter">
      <div className="glass-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{t('panel.dailySignIn')}</h3>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-4xl font-bold text-brand-600 dark:text-brand-400">{streak}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">{t('panel.streakDays')}</span>
            </div>
          </div>
          <div className="text-right">
            {signed ? (
              <div className="flex flex-col items-end gap-1">
                <span className="px-4 py-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium text-sm">{t('panel.signedIn')}</span>
              </div>
            ) : canSignIn ? (
              <button
                className="btn-primary"
                onClick={() => dispatch(signIn())}
              >
                {t('panel.signIn')}
              </button>
            ) : (
              <div className="flex flex-col items-end gap-1">
                <span className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 font-medium text-sm cursor-not-allowed">{t('panel.signIn')}</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">{t('panel.completeAllFirst')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="glass-card p-5">
        <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">{t('panel.todayStats')}</h3>
        {loading ? (
          <Loading text={t('panel.loadStats')} />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <div className="rounded-xl bg-brand-50 dark:bg-brand-900/20 p-4">
              <div className="text-3xl font-bold text-brand-600 dark:text-brand-400">{todayNew}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('panel.newWords')}</div>
            </div>
            <div className="rounded-xl bg-green-50 dark:bg-green-900/20 p-4">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">{todayReview}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('panel.reviewCount')}</div>
            </div>
            <div className="rounded-xl bg-orange-50 dark:bg-orange-900/20 p-4">
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{todayDictation}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('panel.dictationCount')}</div>
            </div>
            <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-4">
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">{todayWrong}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('panel.wrongCount')}</div>
            </div>
          </div>
        )}
        {error && <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">⚠ {error}{t('panel.showLocalData')}</div>}
      </div>

      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t('panel.learningTrend')}</h3>
          <div className="flex gap-1">
            {([7, 30, 180] as TimeRange[]).map(d => (
              <button
                key={d}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  timeRange === d
                    ? 'bg-gradient-brand text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                onClick={() => setTimeRange(d)}
              >
                {d === 7 ? t('panel.last7Days') : d === 30 ? t('panel.last1Month') : t('panel.lastHalfYear')}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 mb-3 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-brand-500 inline-block" /> {t('panel.legendNew')}</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-500 inline-block" /> {t('panel.legendReview')}</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-orange-400 inline-block" /> {t('panel.legendDictation')}</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-400 inline-block" /> {t('panel.legendWrong')}</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-gray-300 dark:bg-gray-600 inline-block" /> {t('panel.legendUnlearned')}</span>
        </div>

        {historyLoading ? (
          <Loading text={t('panel.loadTrend')} />
        ) : historyData.length === 0 ? (
          <div className="text-gray-400 dark:text-gray-500 text-sm text-center py-4">{t('panel.noHistory')}</div>
        ) : (
          <div className="relative">
            <div className="flex items-end h-44" style={{ gap: timeRange <= 7 ? '6px' : timeRange <= 30 ? '2px' : '1px' }}>
              {historyData.map((s, idx) => {
                const total = s.newCount + s.reviewCount + s.dictationCount + s.wrongCount
                const showLabel = idx % labelInterval === 0 || s.date === today
                const date = new Date(s.date + 'T00:00:00')
                const dayLabel = dayNames[date.getDay()]
                const isToday = s.date === today
                const hasData = total > 0

                const totalH = maxTrendVal > 0 ? (total / maxTrendVal) * 100 : 0
                const newH = maxTrendVal > 0 ? (s.newCount / maxTrendVal) * 100 : 0
                const reviewH = maxTrendVal > 0 ? (s.reviewCount / maxTrendVal) * 100 : 0
                const dictH = maxTrendVal > 0 ? (s.dictationCount / maxTrendVal) * 100 : 0
                const wrongH = maxTrendVal > 0 ? (s.wrongCount / maxTrendVal) * 100 : 0

                return (
                  <div key={s.date} className="flex-1 flex flex-col items-center group relative min-w-0">
                    <div className="absolute -top-20 left-1/2 -translate-x-1/2 bg-gray-800 dark:bg-gray-700 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg">
                      <div className="font-medium mb-1">{s.date.slice(5)} {timeRange <= 7 ? dayLabel : ''}</div>
                      <div className="space-y-0.5">
                        <div>{t('panel.tooltipNew')}: {s.newCount} · {t('panel.tooltipReview')}: {s.reviewCount}</div>
                        <div>{t('panel.tooltipDictation')}: {s.dictationCount} · {t('panel.tooltipWrong')}: {s.wrongCount}</div>
                        <div className="text-gray-300 dark:text-gray-400">{t('panel.tooltipTotal')}: {total}</div>
                      </div>
                    </div>

                    <div className={`text-xs mb-1 ${hasData ? 'text-gray-500 dark:text-gray-400 font-medium' : 'text-gray-300 dark:text-gray-600'}`}>
                      {hasData ? total : '—'}
                    </div>

                    <div className="w-full flex items-end" style={{ height: '100px' }}>
                      {hasData ? (
                        <div
                          className="w-full relative rounded-t"
                          style={{ height: `${Math.max(totalH, 6)}%`, minHeight: '6px' }}
                        >
                          <div className="absolute bottom-0 w-full bg-red-400 rounded-b-sm" style={{ height: `${wrongH}%`, minHeight: s.wrongCount > 0 ? '2px' : '0' }} />
                          <div className="absolute w-full bg-orange-400" style={{ bottom: `${wrongH}%`, height: `${dictH}%`, minHeight: s.dictationCount > 0 ? '2px' : '0' }} />
                          <div className="absolute w-full bg-green-500" style={{ bottom: `${wrongH + dictH}%`, height: `${reviewH}%`, minHeight: s.reviewCount > 0 ? '2px' : '0' }} />
                          <div className="absolute w-full bg-brand-500 rounded-t-sm" style={{ bottom: `${wrongH + dictH + reviewH}%`, height: `${newH}%`, minHeight: s.newCount > 0 ? '2px' : '0' }} />
                        </div>
                      ) : (
                        <div className="w-full flex items-end justify-center" style={{ height: '100%' }}>
                          <div className="w-3/4 border-b-2 border-dashed border-gray-300 dark:border-gray-600" />
                        </div>
                      )}
                    </div>

                    {showLabel && (
                      <div className={`mt-1 text-xs ${isToday ? 'font-bold text-brand-600 dark:text-brand-400' : 'text-gray-400 dark:text-gray-500'}`}>
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

      <div className="glass-card p-5">
        <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">{t('panel.reviewForecast')}</h3>
        <div className="space-y-2">
          {reviewForecast.map(f => (
            <div key={f.dateStr} className="flex items-center gap-3">
              <div className="w-12 text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                <div>{f.label}</div>
                <div className="text-gray-400 dark:text-gray-500">{f.dateStr}</div>
              </div>
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-5 relative overflow-hidden">
                <div
                  className="bg-brand-400 rounded-full h-5 transition-all flex items-center justify-end pr-2"
                  style={{ width: `${Math.max((f.count / maxForecast) * 100, f.count > 0 ? 10 : 0)}%` }}
                >
                  {f.count > 0 && <span className="text-xs text-white font-medium">{f.count}</span>}
                </div>
              </div>
              <div className="w-8 text-right text-xs text-gray-500 dark:text-gray-400">{f.count}{t('panel.wordsUnit')}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-5">
        <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">{t('panel.learningOverview')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-3 text-center">
            <div className="text-2xl font-bold text-gray-700 dark:text-gray-200">{overviewData.total}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('panel.totalVocab')}</div>
          </div>
          <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-3 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{overviewData.mastered}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('panel.mastered')}</div>
          </div>
          <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 p-3 text-center">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{overviewData.collected}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('panel.collected')}</div>
          </div>
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{overviewData.wrong}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('panel.wrong')}</div>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-300">{t('panel.masteryRate')}</span>
            <span className="font-medium text-brand-600 dark:text-brand-400">{overviewData.masteryRate}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-brand-500 rounded-full h-2 transition-all"
              style={{ width: `${overviewData.masteryRate}%` }}
            />
          </div>
        </div>
      </div>

      <div className="glass-card p-5">
        <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">{t('panel.sm2Analysis')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg bg-purple-50 dark:bg-purple-900/20 p-3 text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {words.length > 0 ? (words.reduce((sum, w) => sum + w.efactor, 0) / words.length).toFixed(2) : '—'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('panel.avgEfactor')}</div>
          </div>
          <div className="rounded-lg bg-indigo-50 dark:bg-indigo-900/20 p-3 text-center">
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {words.length > 0 ? Math.round(words.reduce((sum, w) => sum + w.responseTime, 0) / words.length) : '—'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('panel.avgResponse')}</div>
          </div>
          <div className="rounded-lg bg-cyan-50 dark:bg-cyan-900/20 p-3 text-center">
            <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
              {words.length > 0 ? (words.reduce((sum, w) => sum + w.averageQuality, 0) / words.length).toFixed(1) : '—'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('panel.avgQuality')}</div>
          </div>
          <div className="rounded-lg bg-teal-50 dark:bg-teal-900/20 p-3 text-center">
            <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
              {words.filter(w => w.fatigueFactor > 0.6).length}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('panel.fatigueCount')}</div>
          </div>
        </div>

        <div className="mt-4">
          <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">{t('panel.difficultyDistribution')}</div>
          {(() => {
            const diffLabels = ['', t('panel.difficultyBasic'), t('panel.difficultyBeginner'), t('panel.difficultyIntermediate'), t('panel.difficultyHard'), t('panel.difficultyAdvanced')]
            const dist = [1, 2, 3, 4, 5].map(level => ({
              level,
              count: words.filter(w => w.difficulty === level).length,
              label: diffLabels[level],
              color: ['', 'bg-green-400', 'bg-green-500', 'bg-yellow-400', 'bg-orange-400', 'bg-red-400'][level],
            }))
            const maxCount = Math.max(...dist.map(d => d.count), 1)
            return (
              <div className="space-y-1.5">
                {dist.map(d => (
                  <div key={d.level} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400 w-10">{d.label}</span>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div className={`h-2.5 rounded-full ${d.color}`} style={{ width: `${(d.count / maxCount) * 100}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 w-6 text-right">{d.count}</span>
                  </div>
                ))}
              </div>
            )
          })()}
        </div>
      </div>

      <div className="glass-card p-5">
        <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">{t('panel.signInHistory')}</h3>
        {signinDates.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">{t('panel.noSignInHistory')}</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {signinDates.slice().reverse().slice(0, 30).map(d => (
              <span key={d} className="px-2 py-1 rounded bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 text-xs font-medium">{d}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

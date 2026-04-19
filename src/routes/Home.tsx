import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { useMemo } from 'react'
import type { RootState } from '../store'

export default function Home() {
  const { t } = useTranslation()
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated)
  const words = useSelector((s: RootState) => s.words.items)
  const signinDates = useSelector((s: RootState) => s.panel.signinDates)
  const settings = useSelector((s: RootState) => s.settings.settings)

  const today = new Date().toISOString().slice(0, 10)

  const stats = useMemo(() => {
    const total = words.length
    const mastered = words.filter(w => w.status === 'mastered').length
    const wrong = words.filter(w => w.status === 'wrong').length
    const collected = words.filter(w => w.status === 'collected').length
    const pending = words.filter(w => w.status !== 'mastered' && w.nextReviewDate?.split('T')[0] <= today).length
    const newWords = words.filter(w => w.status === 'new').length
    const masteryRate = total > 0 ? Math.round(mastered / total * 100) : 0
    return { total, mastered, wrong, collected, pending, newWords, masteryRate }
  }, [words, today])

  const streak = useMemo(() => {
    let count = 0
    const sorted = [...signinDates].sort().reverse()
    const d = new Date()
    for (const date of sorted) {
      const expected = d.toISOString().slice(0, 10)
      if (date === expected) {
        count++
        d.setDate(d.getDate() - 1)
      } else {
        break
      }
    }
    return count
  }, [signinDates])

  const dailyTarget = settings?.dailyNewWordTarget || 20

  if (isAuthenticated) {
    return (
      <div className="space-y-6 page-enter">
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('home.welcomeBack')}</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">{t('home.dailyGoal')}</span>
              <span className="text-sm font-semibold text-brand-600 dark:text-brand-400">{stats.newWords}/{dailyTarget}</span>
            </div>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
            <div
              className="bg-gradient-brand rounded-full h-3 transition-all duration-500"
              style={{ width: `${Math.min((stats.newWords / dailyTarget) * 100, 100)}%` }}
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link to="/practice/words" className="rounded-xl bg-brand-50 dark:bg-brand-900/20 p-3 text-center hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-colors group">
              <div className="text-2xl font-bold text-brand-600 dark:text-brand-400">{stats.pending}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('home.pendingReview')}</div>
            </Link>
            <Link to="/mastered" className="rounded-xl bg-green-50 dark:bg-green-900/20 p-3 text-center hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.mastered}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('home.mastered')}</div>
            </Link>
            <Link to="/wrong-words" className="rounded-xl bg-red-50 dark:bg-red-900/20 p-3 text-center hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.wrong}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('home.wrongWords')}</div>
            </Link>
            <Link to="/panel" className="rounded-xl bg-purple-50 dark:bg-purple-900/20 p-3 text-center hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{streak}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('home.streak')}</div>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Link to="/practice/words" className="glass-card-hover p-5 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white shadow-glow flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h12a4 4 0 0 1 4 4v8H8a4 4 0 0 1-4-4V6z"/><path d="M8 6v12"/></svg>
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">{t('home.startPractice')}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{stats.pending} {t('home.wordsWaiting')}</div>
            </div>
          </Link>
          <Link to="/practice/articles" className="glass-card-hover p-5 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">{t('home.articlePractice')}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t('home.enterArticlePractice')}</div>
            </div>
          </Link>
          <Link to="/collections" className="glass-card-hover p-5 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3l3.09 6.26L22 10l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.87 2 10l6.91-0.74L12 3z"/></svg>
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">{t('home.collections')}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{stats.collected} {t('home.wordsUnit')}</div>
            </div>
          </Link>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t('home.masteryOverview')}</h3>
            <span className="text-sm font-medium text-brand-600 dark:text-brand-400">{stats.masteryRate}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div
              className="bg-gradient-brand rounded-full h-2.5 transition-all duration-500"
              style={{ width: `${stats.masteryRate}%` }}
            />
          </div>
          <div className="mt-3 flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{t('home.totalVocab')}: {stats.total}</span>
            <span>{t('home.mastered')}: {stats.mastered}</span>
            <span>{t('home.wrong')}: {stats.wrong}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 page-enter">
      <div className="rounded-2xl bg-amber-50/80 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-700/40 p-4 flex items-center gap-3 backdrop-blur-sm">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
        </div>
        <div className="flex-1">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <span dangerouslySetInnerHTML={{ __html: t('home.guestWarning') }} />
            <Link to="/login" className="text-amber-900 dark:text-amber-100 font-semibold hover:underline ml-1">{t('home.loginNow')}</Link>
          </p>
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="glass-card-hover p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white shadow-glow">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h12a4 4 0 0 1 4 4v8H8a4 4 0 0 1-4-4V6z"/><path d="M8 6v12"/></svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('home.wordPractice')}</h2>
          </div>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1.5">
            <li className="flex items-start gap-2"><span className="text-brand-500 mt-0.5">&#x2022;</span>{t('home.wordPracticeDesc1')}</li>
            <li className="flex items-start gap-2"><span className="text-brand-500 mt-0.5">&#x2022;</span>{t('home.wordPracticeDesc2')}</li>
            <li className="flex items-start gap-2"><span className="text-brand-500 mt-0.5">&#x2022;</span>{t('home.wordPracticeDesc3')}</li>
          </ul>
          <div className="mt-4">
            <Link className="inline-block px-5 py-2.5 btn-primary text-sm" to="/practice/words">{t('home.startPractice')}</Link>
          </div>
        </div>

        <div className="glass-card-hover p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white shadow-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4V4z"/><path d="M8 4v12"/></svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('home.articlePractice')}</h2>
          </div>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1.5">
            <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">&#x2022;</span>{t('home.articlePracticeDesc1')}</li>
            <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">&#x2022;</span>{t('home.articlePracticeDesc2')}</li>
            <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">&#x2022;</span>{t('home.articlePracticeDesc3')}</li>
          </ul>
          <div className="mt-4">
            <Link className="inline-block px-5 py-2.5 bg-gradient-green text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg hover:shadow-green-500/25 hover:-translate-y-0.5 text-sm" to="/practice/articles">{t('home.enterArticlePractice')}</Link>
          </div>
        </div>

        <div className="glass-card-hover p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white shadow-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3l3.09 6.26L22 10l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.87 2 10l6.91-0.74L12 3z"/></svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('home.vocabManagement')}</h2>
          </div>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1.5">
            <li className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">&#x2022;</span>{t('home.vocabManagementDesc1')}</li>
            <li className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">&#x2022;</span>{t('home.vocabManagementDesc2')}</li>
            <li className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">&#x2022;</span>{t('home.vocabManagementDesc3')}</li>
          </ul>
          <div className="mt-4 flex gap-2 flex-wrap">
            <Link className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl text-sm font-medium transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/25 hover:-translate-y-0.5" to="/collections">{t('home.collections')}</Link>
            <Link className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-sm font-medium transition-all duration-300 hover:shadow-lg hover:shadow-red-500/25 hover:-translate-y-0.5" to="/wrong-words">{t('home.wrongWords')}</Link>
            <Link className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl text-sm font-medium transition-all duration-300 hover:shadow-lg hover:shadow-green-500/25 hover:-translate-y-0.5" to="/mastered">{t('home.mastered')}</Link>
          </div>
        </div>
      </div>

      <div className="glass-card p-5">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('home.quickAccess')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link to="/dicts" className="flex items-center gap-3 p-3 rounded-xl border border-gray-200/60 dark:border-gray-700/40 hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-all duration-200 hover:border-brand-200 dark:hover:border-brand-800 hover:shadow-sm group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white shadow-sm group-hover:shadow-glow transition-shadow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h12a4 4 0 0 1 4 4v8H8a4 4 0 0 1-4-4V6z"/><path d="M8 6v12"/></svg>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{t('home.dicts')}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t('home.dictsDesc')}</div>
            </div>
          </Link>
          <Link to="/panel" className="flex items-center gap-3 p-3 rounded-xl border border-gray-200/60 dark:border-gray-700/40 hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-all duration-200 hover:border-purple-200 dark:hover:border-purple-800 hover:shadow-sm group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white shadow-sm group-hover:shadow-glow transition-shadow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{t('home.panel')}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t('home.panelDesc')}</div>
            </div>
          </Link>
          <Link to="/library" className="flex items-center gap-3 p-3 rounded-xl border border-gray-200/60 dark:border-gray-700/40 hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-all duration-200 hover:border-green-200 dark:hover:border-green-800 hover:shadow-sm group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white shadow-sm group-hover:shadow-glow transition-shadow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4V4z"/><path d="M8 4v12"/></svg>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{t('home.library')}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t('home.libraryDesc')}</div>
            </div>
          </Link>
          <Link to="/about" className="flex items-center gap-3 p-3 rounded-xl border border-gray-200/60 dark:border-gray-700/40 hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white shadow-sm group-hover:shadow-glow transition-shadow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{t('home.about')}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t('home.aboutDesc')}</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import type { RootState } from '../store'

export default function Home() {
  const { t } = useTranslation()
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated)

  return (
    <div className="space-y-6 page-enter">
      {!isAuthenticated && (
        <div className="rounded-xl border bg-amber-50 border-amber-200 p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
          </div>
          <div className="flex-1">
            <p className="text-sm text-amber-800">
              <span dangerouslySetInnerHTML={{ __html: t('home.guestWarning') }} />
              <Link to="/login" className="text-amber-900 font-medium hover:underline ml-1">{t('home.loginNow')}</Link>
            </p>
          </div>
        </div>
      )}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-white p-5 card-hover">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center text-brand-600">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h12a4 4 0 0 1 4 4v8H8a4 4 0 0 1-4-4V6z"/><path d="M8 6v12"/></svg>
            </div>
            <h2 className="text-lg font-semibold">{t('home.wordPractice')}</h2>
          </div>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• {t('home.wordPracticeDesc1')}</li>
            <li>• {t('home.wordPracticeDesc2')}</li>
            <li>• {t('home.wordPracticeDesc3')}</li>
          </ul>
          <div className="mt-4">
            <Link className="inline-block px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors text-sm font-medium" to="/practice/words">{t('home.startPractice')}</Link>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 card-hover">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4V4z"/><path d="M8 4v12"/></svg>
            </div>
            <h2 className="text-lg font-semibold">{t('home.articlePractice')}</h2>
          </div>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• {t('home.articlePracticeDesc1')}</li>
            <li>• {t('home.articlePracticeDesc2')}</li>
            <li>• {t('home.articlePracticeDesc3')}</li>
          </ul>
          <div className="mt-4">
            <Link className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium" to="/practice/articles">{t('home.enterArticlePractice')}</Link>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 card-hover">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3l3.09 6.26L22 10l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.87 2 10l6.91-0.74L12 3z"/></svg>
            </div>
            <h2 className="text-lg font-semibold">{t('home.vocabManagement')}</h2>
          </div>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• {t('home.vocabManagementDesc1')}</li>
            <li>• {t('home.vocabManagementDesc2')}</li>
            <li>• {t('home.vocabManagementDesc3')}</li>
          </ul>
          <div className="mt-4 flex gap-2">
            <Link className="px-3 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium" to="/collections">{t('home.collections')}</Link>
            <Link className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium" to="/wrong-words">{t('home.wrongWords')}</Link>
            <Link className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium" to="/mastered">{t('home.mastered')}</Link>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-5">
        <h3 className="font-semibold mb-3">{t('home.quickAccess')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link to="/dicts" className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center text-brand-600">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h12a4 4 0 0 1 4 4v8H8a4 4 0 0 1-4-4V6z"/><path d="M8 6v12"/></svg>
            </div>
            <div>
              <div className="text-sm font-medium">{t('home.dicts')}</div>
              <div className="text-xs text-gray-500">{t('home.dictsDesc')}</div>
            </div>
          </Link>
          <Link to="/panel" className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>
            </div>
            <div>
              <div className="text-sm font-medium">{t('home.panel')}</div>
              <div className="text-xs text-gray-500">{t('home.panelDesc')}</div>
            </div>
          </Link>
          <Link to="/library" className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4V4z"/><path d="M8 4v12"/></svg>
            </div>
            <div>
              <div className="text-sm font-medium">{t('home.library')}</div>
              <div className="text-xs text-gray-500">{t('home.libraryDesc')}</div>
            </div>
          </Link>
          <Link to="/about" className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            </div>
            <div>
              <div className="text-sm font-medium">{t('home.about')}</div>
              <div className="text-xs text-gray-500">{t('home.aboutDesc')}</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

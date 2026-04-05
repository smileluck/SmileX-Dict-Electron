import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from '../store'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { setArticles } from '../features/articles/articlesSlice'
import { articlesApi } from '../services/api'
import Loading from '../components/Loading'

export default function Library() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const items = useSelector((s: RootState) => s.articles.items)
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string|null>(null)

  useEffect(()=>{
    if (isAuthenticated) {
      setLoading(true)
      articlesApi.list()
        .then(list => {
          dispatch(setArticles(list))
          setError(null)
        })
        .catch(err => {
          console.warn('Failed to fetch articles:', err)
          setError(t('library.serverError'))
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  },[dispatch, isAuthenticated, t])

  return (
    <div className="space-y-6">
      {!isAuthenticated && (
        <div className="rounded-xl border bg-amber-50 border-amber-200 p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
          </div>
          <div className="flex-1">
            <p className="text-sm text-amber-800">
              <span dangerouslySetInnerHTML={{ __html: t('library.guestWarning') }} />
            </p>
          </div>
        </div>
      )}

      <div className="rounded-xl border bg-white p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{t('library.myArticles')}</h3>
          {isAuthenticated && (
            <Link to="/library/new" className="px-3 py-2 bg-brand-500 text-white rounded inline-flex items-center gap-1 hover:bg-brand-600 transition-colors">
              <Icon name="book"/> {t('library.addBook')}
            </Link>
          )}
        </div>

        {loading ? (
          <Loading text={t('library.loadArticles')} />
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-amber-600 text-sm mb-2">⚠ {error}</div>
            <div className="text-gray-500 text-sm">{t('library.showLocalCache')}</div>
          </div>
        ) : null}

        <div className="grid md:grid-cols-2 gap-3 mt-4">
          {items.map(a => (
            <div key={a.id} className="rounded border p-3 hover:shadow-sm transition-shadow">
              <div className="text-xs text-gray-500 mb-1">{a.type==='book'?t('library.book'):t('library.article')}</div>
              <div className="font-medium">{a.title}</div>
              <div className="text-sm text-gray-600 line-clamp-2">{a.content}</div>
            </div>
          ))}
          {items.length===0 && !loading && (
            <div className="text-gray-500 col-span-2 text-center py-8">
              {isAuthenticated ? t('library.emptyAuthenticated') : t('library.emptyGuest')}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

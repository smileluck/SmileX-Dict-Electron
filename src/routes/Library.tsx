import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from '../store'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { setArticles, removeArticle } from '../features/articles/articlesSlice'
import { articlesApi } from '../services/api'
import { useToast } from '../components/Toast'
import Loading from '../components/Loading'

export default function Library() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { showToast } = useToast()
  const items = useSelector((s: RootState) => s.articles.items)
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string|null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

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

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await articlesApi.delete(deleteId)
      dispatch(removeArticle(deleteId))
      showToast(t('wordList.deleteSuccess'), 'success')
    } catch {
      showToast(t('common.error'), 'error')
    }
    setDeleteId(null)
  }

  return (
    <div className="space-y-6 page-enter">
      {!isAuthenticated && (
        <div className="rounded-2xl bg-amber-50/80 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-700/40 p-4 backdrop-blur-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-sm flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
          </div>
          <div className="flex-1">
            <p className="text-sm text-amber-800 dark:text-amber-300">
              <span dangerouslySetInnerHTML={{ __html: t('library.guestWarning') }} />
            </p>
          </div>
        </div>
      )}

      <div className="glass-card p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t('library.myArticles')}</h3>
          {isAuthenticated && (
            <Link to="/library/new" className="btn-primary inline-flex items-center gap-1.5">
              <Icon name="book"/> {t('library.addBook')}
            </Link>
          )}
        </div>

        {loading ? (
          <Loading text={t('library.loadArticles')} />
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-amber-600 dark:text-amber-400 text-sm mb-2">⚠ {error}</div>
            <div className="text-gray-500 dark:text-gray-400 text-sm">{t('library.showLocalCache')}</div>
          </div>
        ) : null}

        <div className="grid md:grid-cols-2 gap-3 mt-4">
          {items.map(a => (
            <div key={a.id} className="glass-card-hover p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{a.type==='book'?t('library.book'):t('library.article')}</div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">{a.title}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">{a.content}</div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Link
                    to="/practice/articles"
                    className="px-2 py-1 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors flex items-center gap-1"
                  >
                    <Icon name="pencil" size={12} /> {t('wordList.practiceNow')}
                  </Link>
                  <button
                    className="p-1.5 rounded-lg text-xs text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    onClick={() => setDeleteId(a.id)}
                    title={t('common.delete')}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
          {items.length===0 && !loading && (
            <div className="text-gray-500 dark:text-gray-400 col-span-2 text-center py-8">
              {isAuthenticated ? t('library.emptyAuthenticated') : t('library.emptyGuest')}
            </div>
          )}
        </div>
      </div>

      {deleteId && (() => {
        const a = items.find(i => i.id === deleteId)
        if (!a) return null
        return (
          <div className="glass-modal-overlay" onClick={() => setDeleteId(null)}>
            <div className="glass-modal animate-scale-in max-w-sm p-5 mx-4" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('wordList.deleteConfirm')}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{t('wordList.deleteArticleConfirm', { title: a.title })}</p>
              <div className="flex gap-2 justify-end">
                <button className="btn-secondary px-4 py-2 text-sm" onClick={() => setDeleteId(null)}>{t('common.cancel')}</button>
                <button className="px-4 py-2 text-sm bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors" onClick={handleDelete}>{t('common.delete')}</button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

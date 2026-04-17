import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from '../store'
import { toggleCollect, markMastered, markWrong } from '../features/words/wordsSlice'
import { useTranslation } from 'react-i18next'
import Icon from './Icon'
import type { WordStatus } from '../features/words/wordsSlice'

interface WordListProps {
  status: WordStatus
  title: string
  emptyText: string
  icon: 'star' | 'wrong' | 'check'
  iconClass: string
}

export default function WordList({ status, title, emptyText, icon, iconClass }: WordListProps) {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const words = useSelector((s: RootState) => s.words.items)
  const filtered = words.filter(w => w.status === status)

  return (
    <div className="page-enter space-y-4">
      <div className="glass-card p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Icon name={icon} className={iconClass} size={24} />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
            {t('wordList.wordsCount', { count: filtered.length })}
          </span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card p-4 text-center py-8 text-gray-400 dark:text-gray-500">
          <div className="text-4xl mb-3">📝</div>
          <div>{emptyText}</div>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(w => (
            <div key={w.id} className="glass-card-hover p-4 border-l-4 border-l-brand-400 dark:border-l-brand-500">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{w.term}</span>
                    {w.ipa && <span className="text-gray-400 dark:text-gray-500">{w.ipa}</span>}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 mt-1">{w.meaning}</div>
                  {w.example && (
                    <div className="text-gray-500 dark:text-gray-400 text-sm italic mt-1">{t('wordList.example', { text: w.example })}</div>
                  )}
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {t('wordList.reviewInfo', { count: w.reviewCount, days: w.interval })}
                  </div>
                </div>
                <div className="flex gap-1 ml-3">
                  {status !== 'collected' && (
                    <button
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 hover:bg-brand-100 dark:hover:bg-brand-900/30"
                      onClick={() => dispatch(toggleCollect(w.id))}
                      title={t('wordList.collect')}
                    >
                      <Icon name="star" size={14} className="text-brand-500 dark:text-brand-400" />
                    </button>
                  )}
                  {status !== 'mastered' && (
                    <button
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30"
                      onClick={() => dispatch(markMastered(w.id))}
                      title={t('wordList.markMastered')}
                    >
                      <Icon name="check" size={14} className="text-green-600 dark:text-green-400" />
                    </button>
                  )}
                  {status !== 'wrong' && (
                    <button
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30"
                      onClick={() => dispatch(markWrong(w.id))}
                      title={t('wordList.addToWrongBook')}
                    >
                      <Icon name="wrong" size={14} className="text-red-600 dark:text-red-400" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

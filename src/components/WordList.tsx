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
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Icon name={icon} className={iconClass} size={24} />
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className="text-sm text-gray-500">({t('wordList.wordsCount', { count: filtered.length })})</span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border bg-white p-8 text-center">
          <div className="text-gray-400 text-4xl mb-3">📝</div>
          <div className="text-gray-500">{emptyText}</div>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(w => (
            <div key={w.id} className="rounded-xl border bg-white p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold">{w.term}</span>
                    {w.ipa && <span className="text-sm text-gray-500">{w.ipa}</span>}
                  </div>
                  <div className="text-gray-700 mt-1">{w.meaning}</div>
                  {w.example && (
                    <div className="text-sm text-gray-500 mt-1">{t('wordList.example', { text: w.example })}</div>
                  )}
                  <div className="text-xs text-gray-400 mt-1">
                    {t('wordList.reviewInfo', { count: w.reviewCount, days: w.interval })}
                  </div>
                </div>
                <div className="flex gap-1 ml-3">
                  {status !== 'collected' && (
                    <button
                      className="px-2 py-1 border rounded text-xs hover:bg-brand-50"
                      onClick={() => dispatch(toggleCollect(w.id))}
                      title={t('wordList.collect')}
                    >
                      <Icon name="star" size={14} className="text-brand-500" />
                    </button>
                  )}
                  {status !== 'mastered' && (
                    <button
                      className="px-2 py-1 border rounded text-xs hover:bg-green-50"
                      onClick={() => dispatch(markMastered(w.id))}
                      title={t('wordList.markMastered')}
                    >
                      <Icon name="check" size={14} className="text-green-600" />
                    </button>
                  )}
                  {status !== 'wrong' && (
                    <button
                      className="px-2 py-1 border rounded text-xs hover:bg-red-50"
                      onClick={() => dispatch(markWrong(w.id))}
                      title={t('wordList.addToWrongBook')}
                    >
                      <Icon name="wrong" size={14} className="text-red-600" />
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

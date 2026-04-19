import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from '../store'
import { toggleCollect, markMastered, markWrong } from '../features/words/wordsSlice'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import Icon from './Icon'
import SpeakButton from './SpeakButton'
import { wordsApi } from '../services/api'
import { useToast } from './Toast'
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
  const { showToast } = useToast()
  const words = useSelector((s: RootState) => s.words.items)
  const filtered = words.filter(w => w.status === status)

  const [editingWord, setEditingWord] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ term: '', meaning: '', ipa: '', example: '', synonyms: '' })
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const startEdit = (w: typeof words[0]) => {
    setEditingWord(w.id)
    setEditForm({
      term: w.term,
      meaning: w.meaning,
      ipa: w.ipa || '',
      example: w.example || '',
      synonyms: (w.synonyms || []).join(';'),
    })
  }

  const handleSaveEdit = async () => {
    if (!editingWord) return
    try {
      await wordsApi.update(editingWord, {
        term: editForm.term,
        meaning: editForm.meaning,
        ipa: editForm.ipa || undefined,
        example: editForm.example || undefined,
        synonyms: editForm.synonyms.split(';').map(s => s.trim()).filter(Boolean),
      })
      showToast(t('wordList.saveSuccess'), 'success')
      setEditingWord(null)
    } catch {
      showToast(t('common.error'), 'error')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await wordsApi.delete(deleteTarget)
      showToast(t('wordList.deleteSuccess'), 'success')
      setDeleteTarget(null)
    } catch {
      showToast(t('common.error'), 'error')
    }
  }

  return (
    <div className="page-enter space-y-4">
      <div className="glass-card p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Icon name={icon} className={iconClass} size={24} />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
            {t('wordList.wordsCount', { count: filtered.length })}
          </span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <Icon name={icon} size={40} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <div className="text-gray-400 dark:text-gray-500">{emptyText}</div>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(w => (
            <div key={w.id} className="glass-card-hover p-4 border-l-4 border-l-brand-400 dark:border-l-brand-500">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{w.term}</span>
                    {w.ipa && <span className="text-gray-400 dark:text-gray-500 text-sm">{w.ipa}</span>}
                    <SpeakButton text={w.term} />
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
                      className="p-2 rounded-lg text-xs transition-all duration-200 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20"
                      onClick={() => dispatch(toggleCollect(w.id))}
                      title={t('wordList.collect')}
                    >
                      <Icon name="star" size={14} className="text-brand-500 dark:text-brand-400" />
                    </button>
                  )}
                  {status !== 'mastered' && (
                    <button
                      className="p-2 rounded-lg text-xs transition-all duration-200 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                      onClick={() => dispatch(markMastered(w.id))}
                      title={t('wordList.markMastered')}
                    >
                      <Icon name="check" size={14} className="text-green-600 dark:text-green-400" />
                    </button>
                  )}
                  {status !== 'wrong' && (
                    <button
                      className="p-2 rounded-lg text-xs transition-all duration-200 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => dispatch(markWrong(w.id))}
                      title={t('wordList.addToWrongBook')}
                    >
                      <Icon name="wrong" size={14} className="text-red-600 dark:text-red-400" />
                    </button>
                  )}
                  <button
                    className="p-2 rounded-lg text-xs transition-all duration-200 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    onClick={() => startEdit(w)}
                    title={t('wordList.editWord')}
                  >
                    <Icon name="pencil" size={14} />
                  </button>
                  <button
                    className="p-2 rounded-lg text-xs transition-all duration-200 text-red-400 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={() => setDeleteTarget(w.id)}
                    title={t('wordList.deleteWord')}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingWord && (() => {
        const w = filtered.find(w => w.id === editingWord)
        if (!w) return null
        return (
          <div className="glass-modal-overlay" onClick={() => setEditingWord(null)}>
            <div className="glass-modal animate-scale-in max-w-md p-5 mx-4" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('wordList.editWordTitle')}</h3>
                <button className="btn-secondary px-2 py-1 text-xs" onClick={() => setEditingWord(null)}>{t('common.close')}</button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('wordList.termLabel')}</label>
                  <input className="input-glass" value={editForm.term} onChange={e => setEditForm(f => ({ ...f, term: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('wordList.meaningLabel')}</label>
                  <input className="input-glass" value={editForm.meaning} onChange={e => setEditForm(f => ({ ...f, meaning: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('wordList.ipaLabel')}</label>
                  <input className="input-glass" value={editForm.ipa} onChange={e => setEditForm(f => ({ ...f, ipa: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('wordList.exampleLabel')}</label>
                  <input className="input-glass" value={editForm.example} onChange={e => setEditForm(f => ({ ...f, example: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('wordList.synonymsLabel')}</label>
                  <input className="input-glass" value={editForm.synonyms} onChange={e => setEditForm(f => ({ ...f, synonyms: e.target.value }))} />
                </div>
              </div>
              <div className="mt-4 flex gap-2 justify-end">
                <button className="btn-secondary px-4 py-2 text-sm" onClick={() => setEditingWord(null)}>{t('common.cancel')}</button>
                <button className="btn-primary px-4 py-2 text-sm" onClick={handleSaveEdit}>{t('common.save')}</button>
              </div>
            </div>
          </div>
        )
      })()}

      {deleteTarget && (() => {
        const w = filtered.find(w => w.id === deleteTarget)
        if (!w) return null
        return (
          <div className="glass-modal-overlay" onClick={() => setDeleteTarget(null)}>
            <div className="glass-modal animate-scale-in max-w-sm p-5 mx-4" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('wordList.deleteConfirm')}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{t('wordList.deleteWordConfirm', { term: w.term })}</p>
              <div className="flex gap-2 justify-end">
                <button className="btn-secondary px-4 py-2 text-sm" onClick={() => setDeleteTarget(null)}>{t('common.cancel')}</button>
                <button className="px-4 py-2 text-sm bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors" onClick={handleDelete}>{t('common.delete')}</button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

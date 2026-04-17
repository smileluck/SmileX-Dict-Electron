import { useDispatch } from 'react-redux'
import { addArticle } from '../features/articles/articlesSlice'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { articlesApi } from '../services/api'

export default function LibraryAdd() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [type, setType] = useState<'article'|'book'>('article')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [contentZh, setContentZh] = useState('')

  const onAdd = (e: FormEvent) => {
    e.preventDefault()
    if (!title || !content) return
    articlesApi.create({ title, content, contentZh, type })
      .then(a => { dispatch(addArticle(a)); navigate('/library') })
      .catch(err => { console.error(err) })
  }

  return (
    <form className="glass-card p-6 max-w-2xl mx-auto page-enter" onSubmit={onAdd}>
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('libraryAdd.title')}</h3>
      <div className="flex gap-2 mb-2">
        <label className={`px-3 py-1.5 rounded-lg border text-sm cursor-pointer transition-all duration-200 ${type==='article'?'bg-brand-500/10 dark:bg-brand-400/15 border-brand-400 dark:border-brand-500 text-brand-700 dark:text-brand-400':'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'}`}>{t('libraryAdd.article')}
          <input type="radio" name="t" className="hidden" checked={type==='article'} onChange={()=>setType('article')} />
        </label>
        <label className={`px-3 py-1.5 rounded-lg border text-sm cursor-pointer transition-all duration-200 ${type==='book'?'bg-brand-500/10 dark:bg-brand-400/15 border-brand-400 dark:border-brand-500 text-brand-700 dark:text-brand-400':'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'}`}>{t('libraryAdd.book')}
          <input type="radio" name="t" className="hidden" checked={type==='book'} onChange={()=>setType('book')} />
        </label>
      </div>
      <input className="input-glass mb-2" placeholder={t('libraryAdd.titleLabel')} value={title} onChange={e=>setTitle(e.target.value)} />
      <textarea className="input-glass h-36" placeholder={t('libraryAdd.contentPlaceholder')} value={content} onChange={e=>setContent(e.target.value)} />
      <textarea className="input-glass h-32 mt-2" placeholder={t('libraryAdd.zhTranslation')} value={contentZh} onChange={e=>setContentZh(e.target.value)} />
      <div className="mt-3 flex gap-2">
        <button className="btn-primary px-4 py-2.5" type="submit">{t('libraryAdd.add')}</button>
        <button type="button" className="btn-secondary px-4 py-2.5" onClick={()=>navigate('/library')}>{t('libraryAdd.back')}</button>
      </div>
    </form>
  )
}

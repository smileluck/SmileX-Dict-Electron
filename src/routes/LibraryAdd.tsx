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
    <form className="rounded-xl border bg-white p-4 max-w-2xl mx-auto" onSubmit={onAdd}>
      <h3 className="font-semibold mb-3">{t('libraryAdd.title')}</h3>
      <div className="flex gap-2 mb-2">
        <label className={`px-2 py-1 rounded border ${type==='article'?'bg-brand-100 border-brand-400':''}`}>{t('libraryAdd.article')}
          <input type="radio" name="t" className="hidden" checked={type==='article'} onChange={()=>setType('article')} />
        </label>
        <label className={`px-2 py-1 rounded border ${type==='book'?'bg-brand-100 border-brand-400':''}`}>{t('libraryAdd.book')}
          <input type="radio" name="t" className="hidden" checked={type==='book'} onChange={()=>setType('book')} />
        </label>
      </div>
      <input className="w-full border rounded px-2 py-1 mb-2" placeholder={t('libraryAdd.titleLabel')} value={title} onChange={e=>setTitle(e.target.value)} />
      <textarea className="w-full border rounded px-2 py-1 h-36" placeholder={t('libraryAdd.contentPlaceholder')} value={content} onChange={e=>setContent(e.target.value)} />
      <textarea className="w-full border rounded px-2 py-1 h-32 mt-2" placeholder={t('libraryAdd.zhTranslation')} value={contentZh} onChange={e=>setContentZh(e.target.value)} />
      <div className="mt-3 flex gap-2">
        <button className="px-3 py-2 bg-brand-500 text-white rounded" type="submit">{t('libraryAdd.add')}</button>
        <button type="button" className="px-3 py-2 border rounded" onClick={()=>navigate('/library')}>{t('libraryAdd.back')}</button>
      </div>
    </form>
  )
}

import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from '../store'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import { useEffect } from 'react'
import { setArticles } from '../features/articles/articlesSlice'
import { API_BASE } from '../config'

export default function Library() {
  const dispatch = useDispatch()
  const items = useSelector((s: RootState) => s.articles.items)
  useEffect(()=>{
    fetch(`${API_BASE}/api/articles`).then(r=>r.json()).then(list=>{
      dispatch(setArticles(list))
    }).catch(()=>{})
  },[dispatch])

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">我的文章/书籍</h3>
          <Link to="/library/new" className="px-3 py-2 bg-brand-500 text-white rounded inline-flex items-center gap-1">
            <Icon name="book"/> 添加书籍/文章
          </Link>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {items.map(a => (
            <div key={a.id} className="rounded border p-3">
              <div className="text-xs text-gray-500 mb-1">{a.type==='book'?'书籍':'文章'}</div>
              <div className="font-medium">{a.title}</div>
              <div className="text-sm text-gray-600 line-clamp-2">{a.content}</div>
            </div>
          ))}
          {items.length===0 && <div className="text-gray-500">暂无内容</div>}
        </div>
      </div>
    </div>
  )
}
import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from '../store'
import { addCustom, setActive, updateSpecialCounts } from '../features/dicts/dictsSlice'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'

export default function Dicts() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const dicts = useSelector((s: RootState) => s.dicts)
  const words = useSelector((s: RootState) => s.words.items)
  const [name, setName] = useState('')

  useEffect(() => {
    const collected = words.filter(w=>w.status==='collected').length
    const wrong = words.filter(w=>w.status==='wrong').length
    const mastered = words.filter(w=>w.status==='mastered').length
    dispatch(updateSpecialCounts({ collected, wrong, mastered }))
  }, [words, dispatch])

  const onCreate = () => {
    if (!name.trim()) return
    dispatch(addCustom({ name }))
    setName('')
  }

  const active = dicts.mine.concat(dicts.recommend).find(d=>d.id===dicts.activeId)

  const [viewId, setViewId] = useState<string | undefined>(undefined)
  const [reviewIds, setReviewIds] = useState<string[] | undefined>(undefined)
  const [reviewIndex, setReviewIndex] = useState(0)

  const itemsByDict = (id: string) => {
    if (id==='collected') return words.filter(w=>w.status==='collected')
    if (id==='wrong') return words.filter(w=>w.status==='wrong')
    if (id==='mastered') return words.filter(w=>w.status==='mastered')
    return []
  }

  const quickReview = (id: string) => {
    const list = itemsByDict(id)
    const shuffled = [...list].sort(()=>Math.random()-0.5).slice(0, 40)
    setReviewIds(shuffled.map(w=>w.id))
    setReviewIndex(0)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-4">
        <div className="flex items-center gap-2">
          <span className="text-blue-600">当前{active? '正在学习的词典':'无正在学习的词典'}</span>
          {active && <span className="font-semibold">{active.name}</span>}
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2 text-center">
          <div className="rounded bg-gray-50 p-2"><div className="text-xl">0</div><div className="text-xs text-gray-500">新词数</div></div>
          <div className="rounded bg-gray-50 p-2"><div className="text-xl">0</div><div className="text-xs text-gray-500">复习次数</div></div>
          <div className="rounded bg-gray-50 p-2"><div className="text-xl">0</div><div className="text-xs text-gray-500">默写次数</div></div>
          <button className="rounded bg-brand-500 text-white p-2 hover:bg-brand-600 transition-colors" onClick={() => { if (active) navigate('/practice/words') }}>开始学习</button>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">我的词典</h3>
          <div className="flex items-center gap-2">
            <input className="border rounded px-2 py-1 text-sm" placeholder="创建个人词典" value={name} onChange={e=>setName(e.target.value)} />
            <button className="px-2 py-1 bg-gray-900 text-white rounded text-sm" onClick={onCreate}>创建</button>
          </div>
        </div>
        <div className="mt-3 grid md:grid-cols-4 gap-3">
          {dicts.mine.map(d => (
            <div key={d.id} className="rounded border bg-gray-50 p-3">
              <div className="flex items-center gap-2 font-medium">
                {d.id==='collected' && <Icon name="star" className="text-brand-600"/>}
                {d.id==='wrong' && <Icon name="wrong" className="text-red-600"/>}
                {d.id==='mastered' && <Icon name="check" className="text-green-600"/>}
                {d.id!=='collected' && d.id!=='wrong' && d.id!=='mastered' && <Icon name="dict" className="text-gray-700"/>}
                <span>{d.name}</span>
              </div>
              <div className="text-xs text-gray-600">{d.wordCount}个词</div>
              <div className="mt-2 flex gap-2">
                {(['collected','wrong','mastered'] as const).includes(d.id as any) ? (
                  <>
                    <button className="px-2 py-1 border rounded text-xs flex items-center gap-1" onClick={()=>quickReview(d.id)}>
                      <Icon name="review"/> <span>快速回顾</span>
                    </button>
                    <button className="px-2 py-1 border rounded text-xs flex items-center gap-1" onClick={()=>setViewId(d.id)}>
                      <Icon name="eye"/> <span>查看</span>
                    </button>
                  </>
                ) : (
                  <button className="px-2 py-1 border rounded text-xs" onClick={()=>dispatch(setActive(d.id))}>设为当前学习</button>
                )}
              </div>
            </div>
          ))}
          <div className="rounded border-dashed border p-3 text-center text-gray-500">+</div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">推荐</h3>
        </div>
        <div className="mt-3 grid md:grid-cols-5 gap-3">
          {dicts.recommend.map(d => (
            <div key={d.id} className="rounded border bg-white p-3">
              <div className="font-medium">{d.name}</div>
              <div className="text-xs text-gray-600">{d.wordCount}个词</div>
              <div className="mt-2">
                <button className="px-2 py-1 border rounded text-xs" onClick={()=>{ dispatch(setActive(d.id)); navigate('/practice/words') }}>开始学习</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {viewId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={()=>setViewId(undefined)}>
          <div className="bg-white rounded-xl w-full max-w-xl p-4 mx-4" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">列表</div>
              <button className="px-2 py-1 border rounded text-xs hover:bg-gray-50 transition-colors" onClick={()=>setViewId(undefined)}>关闭</button>
            </div>
            <ul className="max-h-96 overflow-auto space-y-2">
              {itemsByDict(viewId).map(w => (
                <li key={w.id} className="p-2 rounded border">
                  <div className="font-medium">{w.term}</div>
                  <div className="text-xs text-gray-600">{w.meaning}</div>
                </li>
              ))}
              {itemsByDict(viewId).length===0 && <div className="text-gray-500 text-sm">暂无词条</div>}
            </ul>
          </div>
        </div>
      )}

      {reviewIds && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={()=>{setReviewIds(undefined); setReviewIndex(0)}}>
          <div className="bg-white rounded-xl w-full max-w-md p-4 mx-4" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold">快速回顾 {reviewIndex+1}/{reviewIds.length}</div>
              <button className="px-2 py-1 border rounded text-xs hover:bg-gray-50 transition-colors" onClick={()=>{setReviewIds(undefined); setReviewIndex(0)}}>退出</button>
            </div>
            {(() => {
              const current = words.find(w=>w.id===reviewIds[reviewIndex])
              if (!current) return <div className="text-gray-500">无词条</div>
              return (
                <div>
                  <div className="text-xl font-semibold">{current.term}</div>
                  <div className="text-gray-600">{current.meaning}</div>
                  <div className="mt-4 flex gap-2">
                    <button className="px-3 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors" onClick={()=>setReviewIndex(i=>Math.min(i+1, reviewIds.length-1))}>下一条</button>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
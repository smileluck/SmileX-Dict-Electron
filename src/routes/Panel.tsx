import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from '../store'
import { signIn } from '../features/panel/panelSlice'
import { useEffect, useState } from 'react'
import { API_BASE } from '../config'

export default function Panel() {
  const dispatch = useDispatch()
  const { signinDates, stats } = useSelector((s: RootState) => s.panel)
  const today = new Date().toISOString().slice(0,10)
  const todayStatStore = stats.find(s=>s.date===today)
  const signed = signinDates.includes(today)
  const [remote, setRemote] = useState<{newCount:number;reviewCount:number;dictationCount:number}|undefined>(undefined)

  useEffect(()=>{
    fetch(`${API_BASE}/api/stats/today`).then(r=>r.json()).then(data=>{
      setRemote({newCount:data.newCount, reviewCount:data.reviewCount, dictationCount:data.dictationCount})
    }).catch(()=>{})
  },[])

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">今日学习情况</h3>
          <button className={`px-3 py-1 rounded ${signed?'bg-gray-200 text-gray-600':'bg-brand-500 text-white'}`} onClick={()=>dispatch(signIn())}>{signed?'已签到':'签到'}</button>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3 text-center">
          <div className="rounded bg-gray-50 p-3"><div className="text-2xl">{remote?.newCount ?? todayStatStore?.newCount ?? 0}</div><div className="text-xs text-gray-500">新词数</div></div>
          <div className="rounded bg-gray-50 p-3"><div className="text-2xl">{remote?.reviewCount ?? todayStatStore?.reviewCount ?? 0}</div><div className="text-xs text-gray-500">复习次数</div></div>
          <div className="rounded bg-gray-50 p-3"><div className="text-2xl">{remote?.dictationCount ?? todayStatStore?.dictationCount ?? 0}</div><div className="text-xs text-gray-500">默写次数</div></div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <h3 className="font-semibold mb-2">签到记录</h3>
        <div className="flex flex-wrap gap-2">
          {signinDates.map(d => (
            <span key={d} className="px-2 py-1 rounded bg-brand-100 text-brand-700 text-xs">{d}</span>
          ))}
          {signinDates.length===0 && <span className="text-gray-500 text-sm">暂无记录</span>}
        </div>
      </div>
    </div>
  )
}
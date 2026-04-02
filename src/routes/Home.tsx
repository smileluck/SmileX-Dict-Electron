import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import type { RootState } from '../store'

export default function Home() {
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated)

  return (
    <div className="space-y-6 page-enter">
      {!isAuthenticated && (
        <div className="rounded-xl border bg-amber-50 border-amber-200 p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
          </div>
          <div className="flex-1">
            <p className="text-sm text-amber-800">
              您正在以<strong>访客模式</strong>浏览。部分功能需要登录后才能使用，如开始练习、管理词库等。
              <Link to="/login" className="text-amber-900 font-medium hover:underline ml-1">立即登录</Link>
            </p>
          </div>
        </div>
      )}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-white p-5 card-hover">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center text-brand-600">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h12a4 4 0 0 1 4 4v8H8a4 4 0 0 1-4-4V6z"/><path d="M8 6v12"/></svg>
            </div>
            <h2 className="text-lg font-semibold">单词练习</h2>
          </div>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• 三种输入模式：跟打 / 复习 / 默写</li>
            <li>• 智能模式：SM-2 算法规划复习</li>
            <li>• 自由模式：不受限制，自行规划</li>
          </ul>
          <div className="mt-4">
            <Link className="inline-block px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors text-sm font-medium" to="/practice/words">开始练习</Link>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 card-hover">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4V4z"/><path d="M8 4v12"/></svg>
            </div>
            <h2 className="text-lg font-semibold">文章练习</h2>
          </div>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• 内置常见书籍，也可自行添加文章</li>
            <li>• 跟打 + 默写双模式，让背诵更高效</li>
            <li>• 支持边听边默写，强化记忆</li>
          </ul>
          <div className="mt-4">
            <Link className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium" to="/practice/articles">进入文章练习</Link>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 card-hover">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3l3.09 6.26L22 10l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.87 2 10l6.91-0.74L12 3z"/></svg>
            </div>
            <h2 className="text-lg font-semibold">词汇管理</h2>
          </div>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• 输入错误自动加入到错词本</li>
            <li>• 主动添加到已掌握，后续自动跳过</li>
            <li>• 主动加入收藏，便于巩固复习</li>
          </ul>
          <div className="mt-4 flex gap-2">
            <Link className="px-3 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium" to="/collections">收藏</Link>
            <Link className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium" to="/wrong-words">错词本</Link>
            <Link className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium" to="/mastered">已掌握</Link>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="rounded-xl border bg-white p-5">
        <h3 className="font-semibold mb-3">快速入口</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link to="/dicts" className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center text-brand-600">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h12a4 4 0 0 1 4 4v8H8a4 4 0 0 1-4-4V6z"/><path d="M8 6v12"/></svg>
            </div>
            <div>
              <div className="text-sm font-medium">词典</div>
              <div className="text-xs text-gray-500">管理词库</div>
            </div>
          </Link>
          <Link to="/panel" className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>
            </div>
            <div>
              <div className="text-sm font-medium">面板</div>
              <div className="text-xs text-gray-500">学习统计</div>
            </div>
          </Link>
          <Link to="/library" className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4V4z"/><path d="M8 4v12"/></svg>
            </div>
            <div>
              <div className="text-sm font-medium">书籍</div>
              <div className="text-xs text-gray-500">文章管理</div>
            </div>
          </Link>
          <Link to="/about" className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            </div>
            <div>
              <div className="text-sm font-medium">关于</div>
              <div className="text-xs text-gray-500">项目信息</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

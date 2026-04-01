import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      <div className="rounded-xl border bg-white p-4">
        <h2 className="text-lg font-semibold mb-2">单词练习</h2>
        <ul className="text-sm list-disc pl-5 space-y-1">
          <li>三种输入模式：跟打 / 复习 / 默写</li>
          <li>智能模式：智能规划复习与默写</li>
          <li>自由模式：不受限制，自行规划</li>
        </ul>
        <div className="mt-3">
          <Link className="inline-block px-3 py-2 bg-brand-500 text-white rounded" to="/practice/words">开始练习</Link>
        </div>
      </div>
      <div className="rounded-xl border bg-white p-4">
        <h2 className="text-lg font-semibold mb-2">文章练习</h2>
        <ul className="text-sm list-disc pl-5 space-y-1">
          <li>内置常见书籍，也可自行添加文章</li>
          <li>跟打 + 默写双模式，让背诵更高效</li>
          <li>支持边听边默写，强化记忆</li>
        </ul>
        <div className="mt-3">
          <Link className="inline-block px-3 py-2 bg-brand-500 text-white rounded" to="/practice/articles">进入文章练习</Link>
        </div>
      </div>
      <div className="rounded-xl border bg-white p-4">
        <h2 className="text-lg font-semibold mb-2">收藏、错词本、已掌握</h2>
        <ul className="text-sm list-disc pl-5 space-y-1">
          <li>输入错误自动加入到错词本</li>
          <li>主动添加到已掌握，后续自动跳过</li>
          <li>主动加入收藏，便于巩固复习</li>
        </ul>
        <div className="mt-3 flex gap-2">
          <Link className="px-3 py-2 bg-gray-900 text-white rounded" to="/collections">收藏</Link>
          <Link className="px-3 py-2 bg-gray-900 text-white rounded" to="/wrong-words">错词本</Link>
          <Link className="px-3 py-2 bg-gray-900 text-white rounded" to="/mastered">已掌握</Link>
        </div>
      </div>
    </div>
  )
}
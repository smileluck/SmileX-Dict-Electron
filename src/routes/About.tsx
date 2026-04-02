export default function About() {
  return (
    <div className="space-y-6 page-enter">
      <div className="rounded-xl border bg-white p-6">
        <div className="flex items-center gap-3 mb-4">
          <img src="/smilex.svg" alt="SmileX" className="w-10 h-10" />
          <div>
            <h2 className="text-lg font-semibold">SmileX Dict</h2>
            <p className="text-sm text-gray-500">v1.0.0</p>
          </div>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">
          一个基于 React + Redux + Tailwind + React Router 的多端（Web/PWA/移动端/桌面端）背单词与文章练习项目。
        </p>
      </div>

      <div className="rounded-xl border bg-white p-6">
        <h3 className="font-semibold mb-3">功能特性</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="flex items-start gap-2">
            <span className="text-brand-500 mt-0.5">●</span>
            <div>
              <div className="text-sm font-medium">单词练习</div>
              <div className="text-xs text-gray-500">跟打、复习、默写与 SM-2 智能规划</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">●</span>
            <div>
              <div className="text-sm font-medium">文章/书籍练习</div>
              <div className="text-xs text-gray-500">添加与管理，支持跟打与默写</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-amber-500 mt-0.5">●</span>
            <div>
              <div className="text-sm font-medium">词典管理</div>
              <div className="text-xs text-gray-500">收藏、错词本、已掌握与自定义词典</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-purple-500 mt-0.5">●</span>
            <div>
              <div className="text-sm font-medium">学习面板</div>
              <div className="text-xs text-gray-500">每日学习统计与签到记录</div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6">
        <h3 className="font-semibold mb-3">技术栈</h3>
        <div className="flex flex-wrap gap-2">
          {['React 19', 'Redux Toolkit', 'Tailwind CSS', 'React Router', 'Vite', 'Electron', 'Capacitor', 'FastAPI'].map(tech => (
            <span key={tech} className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-600 font-medium">{tech}</span>
          ))}
        </div>
      </div>

      <div className="text-center text-xs text-gray-400">
        本项目采用 Apache License 2.0 开源协议
      </div>
    </div>
  )
}

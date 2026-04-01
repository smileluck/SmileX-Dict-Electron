export default function About() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">关于 SmileX Dict</h2>
      <p className="text-sm text-gray-700">一个基于 React + Redux + Tailwind + React Router 的多端（Web/PWA/移动端/桌面端）背单词与文章练习项目。</p>
      <ul className="list-disc pl-5 text-sm text-gray-700">
        <li>单词练习：跟打、复习、默写与智能规划</li>
        <li>文章/书籍练习：添加与管理，支持跟打与默写</li>
        <li>词典管理：收藏、错词本、已掌握与自定义词典</li>
        <li>面板：每日学习统计与签到记录</li>
      </ul>
    </div>
  )
}
export default function StudyGuide() {
  return (
    <div className="space-y-6 page-enter">
      <div className="rounded-xl border bg-white p-5">
        <h3 className="font-semibold text-lg mb-3">🧠 SM-2 间隔重复算法</h3>
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          SmileX Dict 使用 <strong>SM-2（SuperMemo 2）</strong>算法作为核心记忆调度引擎。该算法由 Piotr Woźniak 于1987年提出，
          是目前最广泛使用的间隔重复算法之一，Anki 等主流记忆软件均基于此算法或其改进版本。
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-sm mb-2">核心原理</h4>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex gap-2">
              <span className="text-brand-500 font-bold">1.</span>
              <span><strong>记忆因子（E-Factor）</strong>：每个单词都有一个 1.3~2.5 的记忆因子，反映该单词的记忆难度。记忆因子越高，复习间隔增长越快。</span>
            </li>
            <li className="flex gap-2">
              <span className="text-brand-500 font-bold">2.</span>
              <span><strong>自适应间隔</strong>：首次正确后 1 天复习，第二次正确后 6 天，之后按 <code className="bg-gray-200 px-1 rounded text-xs">间隔 × 记忆因子</code> 递增。</span>
            </li>
            <li className="flex gap-2">
              <span className="text-brand-500 font-bold">3.</span>
              <span><strong>错误重置</strong>：回答错误时，记忆因子降低，间隔归零，从头开始复习。连续正确 5 次标记为"已掌握"。</span>
            </li>
          </ul>
        </div>

        <div className="bg-brand-50 rounded-lg p-4">
          <h4 className="font-medium text-sm mb-2">间隔示例</h4>
          <div className="flex items-center gap-2 text-sm overflow-x-auto pb-2">
            {[
              { day: '第1次', label: '1天后' },
              { day: '第2次', label: '6天后' },
              { day: '第3次', label: '15天后' },
              { day: '第4次', label: '37天后' },
              { day: '第5次', label: '掌握 ✓' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 flex-shrink-0">
                <div className="bg-white rounded-lg px-3 py-2 border text-center">
                  <div className="font-medium text-brand-600">{item.day}</div>
                  <div className="text-xs text-gray-500">{item.label}</div>
                </div>
                {i < 4 && <span className="text-gray-300">→</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-5">
        <h3 className="font-semibold text-lg mb-3">📉 艾宾浩斯遗忘曲线</h3>
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          德国心理学家赫尔曼·艾宾浩斯（Hermann Ebbinghaus）在1885年通过实验发现了人类遗忘的规律。
          遗忘在学习之后立即开始，且遗忘的速度是"先快后慢"。
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-sm mb-3">遗忘曲线示意</h4>
          <div className="relative h-40">
            <div className="absolute left-0 top-0 bottom-6 w-8 flex flex-col justify-between text-xs text-gray-400">
              <span>100%</span>
              <span>50%</span>
              <span>0%</span>
            </div>
            <div className="ml-10 h-full relative">
              <div className="absolute inset-0 bottom-6">
                <div className="absolute top-0 w-full border-t border-dashed border-gray-200" />
                <div className="absolute top-1/2 w-full border-t border-dashed border-gray-200" />
                <div className="absolute bottom-0 w-full border-t border-gray-300" />
              </div>
              <svg className="absolute inset-0 bottom-6 w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
                <path
                  d="M 0 5 C 20 10, 40 50, 80 70 C 120 82, 200 90, 300 93"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                  strokeDasharray="4,4"
                />
                <path
                  d="M 0 5 L 30 8 L 30 5 C 50 8, 80 20, 120 25 C 160 28, 200 30, 240 31 L 300 32"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="2"
                />
                <circle cx="30" cy="8" r="3" fill="#3b82f6" />
                <circle cx="120" cy="25" r="3" fill="#3b82f6" />
                <circle cx="240" cy="31" r="3" fill="#3b82f6" />
              </svg>
              <div className="absolute bottom-0 w-full flex justify-between text-xs text-gray-400">
                <span>刚学</span>
                <span>20分钟</span>
                <span>1小时</span>
                <span>1天</span>
                <span>2天</span>
                <span>7天</span>
                <span>30天</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs">
            <span className="flex items-center gap-1"><span className="w-4 h-0 border-t-2 border-dashed border-red-400 inline-block" /> 无复习</span>
            <span className="flex items-center gap-1"><span className="w-4 h-0 border-t-2 border-green-500 inline-block" /> 及时复习</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-brand-500 inline-block" /> 复习点</span>
          </div>
        </div>

        <div className="bg-amber-50 rounded-lg p-4">
          <h4 className="font-medium text-sm mb-2">艾宾浩斯固定复习周期</h4>
          <p className="text-xs text-gray-600 mb-2">
            传统艾宾浩斯记忆法建议在以下间隔复习：<strong>5分钟 → 30分钟 → 12小时 → 1天 → 2天 → 4天 → 7天 → 15天 → 30天</strong>
          </p>
          <p className="text-xs text-gray-500">
            SmileX Dict 使用的 SM-2 算法是艾宾浩斯理论的升级版，它会根据你的回答质量自动调整复习间隔，比固定周期更高效。
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-5">
        <h3 className="font-semibold text-lg mb-3">💡 推荐记忆方法</h3>

        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🎯</span>
              <h4 className="font-medium">主动回忆法（Active Recall）</h4>
            </div>
            <p className="text-sm text-gray-600">
              不要只是反复阅读单词，而是主动尝试回忆。使用"中→英"模式，看到中文释义后努力回忆英文单词，
              这种"提取练习"比被动阅读效率高 300%。当你费力回忆起一个单词时，记忆会变得更加牢固。
            </p>
            <div className="mt-2 text-xs text-brand-600">→ 推荐使用"中→英"模式练习</div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">📖</span>
              <h4 className="font-medium">语境记忆法（Context Learning）</h4>
            </div>
            <p className="text-sm text-gray-600">
              在语境中学习单词比孤立记忆效果好得多。使用"英→英"模式，通过例句理解单词含义，
              建立英文思维。同时关注同义词的区别，理解单词的使用场景。
            </p>
            <div className="mt-2 text-xs text-brand-600">→ 推荐使用"英→英"模式练习</div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">✍️</span>
              <h4 className="font-medium">拼写强化法</h4>
            </div>
            <p className="text-sm text-gray-600">
              通过打字拼写强化肌肉记忆。"打字拼写"模式要求你准确输入每个字母，
              这不仅能检验你是否真正记住了拼写，还能通过手指的运动加深记忆。
              对于容易混淆的拼写（如 -tion/-sion）特别有效。
            </p>
            <div className="mt-2 text-xs text-brand-600">→ 推荐使用"打字拼写"模式练习</div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🔄</span>
              <h4 className="font-medium">间隔重复法（Spaced Repetition）</h4>
            </div>
            <p className="text-sm text-gray-600">
              SmileX Dict 内置的 SM-2 算法会自动为你安排最优复习时间。你不需要手动规划复习计划，
              只需每天打开应用，系统会自动推送需要复习的单词。关键是<strong>坚持每天学习</strong>，
              即使每天只学 10-20 个单词，长期积累效果也非常显著。
            </p>
            <div className="mt-2 text-xs text-brand-600">→ 系统自动调度，坚持每日学习即可</div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-5">
        <h3 className="font-semibold text-lg mb-3">📌 学习建议</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-medium text-sm text-green-700 mb-2">✅ 推荐做法</h4>
            <ul className="text-sm text-gray-600 space-y-1.5">
              <li>• 每天固定时间学习（建议早晨或睡前）</li>
              <li>• 每天新词 10-30 个，不宜过多</li>
              <li>• 优先完成复习任务再学新词</li>
              <li>• 结合多种模式交替练习</li>
              <li>• 注意例句和同义词的用法</li>
              <li>• 错词本定期回顾</li>
            </ul>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <h4 className="font-medium text-sm text-red-700 mb-2">❌ 常见误区</h4>
            <ul className="text-sm text-gray-600 space-y-1.5">
              <li>• 一次性背太多单词</li>
              <li>• 只看不练（被动阅读）</li>
              <li>• 忽略复习，只追求新词</li>
              <li>• 长时间不学习后突击</li>
              <li>• 只关注拼写，忽略发音和用法</li>
              <li>• 遇到错词不总结原因</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
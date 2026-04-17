import { useState } from 'react'
import type { WordItem } from '../../features/words/wordsSlice'
import Icon from '../Icon'

interface Collocation {
  type: 'verb' | 'adjective' | 'noun' | 'adverb' | 'preposition'
  words: string[]
}

interface UsageExample {
  sentence: string
  context: string
  register: 'formal' | 'informal' | 'academic' | 'colloquial'
}

interface SynonymDetail {
  word: string
  nuance: string
  interchangeability: number
  examples: string[]
}

interface EnhancedCardProps {
  word: WordItem
  onMarkMastered?: () => void
  onMarkWrong?: () => void
}

const REGISTER_LABELS: Record<string, { label: string; color: string }> = {
  formal: { label: '正式', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' },
  informal: { label: '非正式', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' },
  academic: { label: '学术', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
  colloquial: { label: '口语', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' },
}

const COLLOCATION_TYPE_LABELS: Record<string, string> = {
  verb: '动词搭配',
  adjective: '形容词搭配',
  noun: '名词搭配',
  adverb: '副词搭配',
  preposition: '介词搭配',
}

const SAMPLE_COLLOCATIONS: Collocation[] = [
  { type: 'verb', words: ['make a decision', 'take into account', 'bear in mind'] },
  { type: 'adjective', words: ['significant', 'considerable', 'substantial'] },
  { type: 'noun', words: ['decision', 'conclusion', 'resolution'] },
  { type: 'adverb', words: ['deliberately', 'carefully', 'thoughtfully'] },
  { type: 'preposition', words: ['about', 'of', 'on'] },
]

const SAMPLE_USAGE_EXAMPLES: UsageExample[] = [
  {
    sentence: 'The committee made a deliberate decision to postpone the project.',
    context: 'Business meeting',
    register: 'formal',
  },
  {
    sentence: "I've decided to go ahead with the plan.",
    context: 'Daily conversation',
    register: 'informal',
  },
  {
    sentence: 'The decision-making process was thoroughly analyzed in the study.',
    context: 'Research paper',
    register: 'academic',
  },
]

const SAMPLE_SYNONYMS: SynonymDetail[] = [
  {
    word: 'choice',
    nuance: '强调从多个选项中选择的权利或机会',
    interchangeability: 0.6,
    examples: ['She had no choice but to accept the offer.'],
  },
  {
    word: 'resolution',
    nuance: '更正式，常指经过深思熟虑后的决心或决定',
    interchangeability: 0.4,
    examples: ['The board passed a resolution to increase funding.'],
  },
  {
    word: 'verdict',
    nuance: '法律用语，指陪审团的裁决',
    interchangeability: 0.2,
    examples: ['The jury reached a verdict after three days.'],
  },
]

export default function EnhancedCard({ word, onMarkMastered, onMarkWrong }: EnhancedCardProps) {
  const [activeTab, setActiveTab] = useState<'collocations' | 'usage' | 'synonyms' | 'formation'>('collocations')

  const tabs = [
    { key: 'collocations' as const, label: '搭配用法', icon: 'link' },
    { key: 'usage' as const, label: '语域分析', icon: 'chat-bubble' },
    { key: 'synonyms' as const, label: '近义辨析', icon: 'arrows-split' },
    { key: 'formation' as const, label: '构词法', icon: 'puzzle' },
  ]

  return (
    <div className="glass-card overflow-hidden">
      <div className="bg-gradient-to-r from-brand-50 to-blue-50 dark:from-brand-900/30 dark:to-blue-900/30 p-4 border-b border-gray-200/60 dark:border-gray-700/50">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{word.term}</span>
              {word.ipa && <span className="text-sm text-gray-500 dark:text-gray-400">{word.ipa}</span>}
            </div>
            <p className="text-gray-700 dark:text-gray-300 mt-1">{word.meaning}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex gap-1">
              <span className={`text-xs px-2 py-0.5 rounded ${
                word.difficulty >= 4 ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                word.difficulty >= 3 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
              }`}>
                {word.difficulty >= 4 ? '高难度' : word.difficulty >= 3 ? '中等' : '基础'}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded ${
                word.importance === 3 ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' :
                word.importance === 2 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
              }`}>
                {word.importance === 3 ? '核心' : word.importance === 2 ? '常用' : '基础'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span>EF: {word.efactor.toFixed(2)}</span>
              <span>间隔: {word.interval}天</span>
              <span>连续: {word.repetitions}次</span>
            </div>
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>记忆进度</span>
            <span>{Math.min(100, Math.round((word.repetitions / 5) * 100))}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all ${
                word.repetitions >= 5 ? 'bg-green-500' :
                word.repetitions >= 3 ? 'bg-blue-500' :
                'bg-brand-500'
              }`}
              style={{ width: `${Math.min(100, (word.repetitions / 5) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm transition-colors ${
              activeTab === tab.key
                ? 'text-brand-600 dark:text-brand-400 border-b-2 border-brand-500 dark:border-brand-400 font-medium bg-white dark:bg-gray-800'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Icon name={tab.icon as any} size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {activeTab === 'collocations' && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">常见搭配</h4>
            {SAMPLE_COLLOCATIONS.map(col => (
              <div key={col.type}>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{COLLOCATION_TYPE_LABELS[col.type]}</div>
                <div className="flex flex-wrap gap-1.5">
                  {col.words.map(w => (
                    <span key={w} className="text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2 py-1 rounded border border-blue-200 dark:border-blue-800/50">
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {word.example && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">例句中的搭配</div>
                <p className="text-sm text-gray-700 dark:text-gray-300 italic">{word.example}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'usage' && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">语域分析</h4>
            <div className="space-y-2">
              {SAMPLE_USAGE_EXAMPLES.map((ex, idx) => (
                <div key={idx} className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3 border border-gray-200 dark:border-gray-700/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">{ex.context}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${REGISTER_LABELS[ex.register].color}`}>
                      {REGISTER_LABELS[ex.register].label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{ex.sentence}</p>
                </div>
              ))}
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800/50">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                <span className="font-medium">语域提示：</span>
                在学术写作中应使用 formal/academic register 的表达，避免口语化用词。
              </p>
            </div>
          </div>
        )}

        {activeTab === 'synonyms' && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">近义辨析</h4>
            {word.synonyms && word.synonyms.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {word.synonyms.map(s => (
                  <span key={s} className="text-sm bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 px-2 py-1 rounded border border-brand-200 dark:border-brand-800/50">
                    {s}
                  </span>
                ))}
              </div>
            )}
            <div className="space-y-2">
              {SAMPLE_SYNONYMS.map(syn => (
                <div key={syn.word} className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3 border border-gray-200 dark:border-gray-700/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900 dark:text-gray-100">{syn.word}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">可互换度</span>
                      <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${
                            syn.interchangeability >= 0.7 ? 'bg-green-500' :
                            syn.interchangeability >= 0.4 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${syn.interchangeability * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{syn.nuance}</p>
                  {syn.examples.map((ex, idx) => (
                    <p key={idx} className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">{ex}</p>
                  ))}
                </div>
              ))}
            </div>
            {word.synonymsNote && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800/50">
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  <span className="font-medium">辨析说明：</span>{word.synonymsNote}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'formation' && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">构词法</h4>
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3 border border-gray-200 dark:border-gray-700/50">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{word.term}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">名词形式：</span>
                  <span className="text-gray-900 dark:text-gray-100 font-medium">decision</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">形容词形式：</span>
                  <span className="text-gray-900 dark:text-gray-100 font-medium">decisive</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">副词形式：</span>
                  <span className="text-gray-900 dark:text-gray-100 font-medium">decisively</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">反义词：</span>
                  <span className="text-gray-900 dark:text-gray-100 font-medium">indecisive</span>
                </div>
              </div>
            </div>
            <div className="bg-brand-50 dark:bg-brand-900/20 rounded-lg p-3 border border-brand-200 dark:border-brand-800/50">
              <p className="text-xs text-brand-700 dark:text-brand-400">
                <span className="font-medium">构词提示：</span>
                -ion 是常见的名词后缀，-ive 是常见的形容词后缀。掌握这些规律可以帮助你快速扩展词汇量。
              </p>
            </div>
          </div>
        )}
      </div>

      {(onMarkMastered || onMarkWrong) && (
        <div className="flex gap-2 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          {onMarkWrong && (
            <button
              onClick={onMarkWrong}
              className="flex-1 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800/50 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-sm font-medium"
            >
              不认识
            </button>
          )}
          {onMarkMastered && (
            <button
              onClick={onMarkMastered}
              className="flex-1 px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg border border-green-200 dark:border-green-800/50 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors text-sm font-medium"
            >
              已掌握
            </button>
          )}
        </div>
      )}
    </div>
  )
}

import { useState, useMemo } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '../../store'
import type { WordItem } from '../../features/words/wordsSlice'
import Icon from '../Icon'

interface VocabNode {
  id: string
  word: string
  type: 'synonym' | 'antonym' | 'related' | 'category'
  strength: number
  x: number
  y: number
}

interface VocabEdge {
  source: string
  target: string
  type: string
  weight: number
}

interface SemanticCluster {
  theme: string
  words: string[]
  strength: number
}

interface ErrorPattern {
  pattern: string
  description: string
  frequency: number
  affectedWords: string[]
  suggestions: string[]
}

export default function VocabularyNetwork() {
  const words = useSelector((s: RootState) => s.words.items)
  const [selectedWord, setSelectedWord] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'network' | 'clusters' | 'errors'>('network')

  const semanticClusters = useMemo((): SemanticCluster[] => {
    const categories: Record<string, WordItem[]> = {}
    words.forEach(w => {
      const cat = w.category || 'general'
      if (!categories[cat]) categories[cat] = []
      categories[cat].push(w)
    })

    return Object.entries(categories).map(([theme, items]) => ({
      theme,
      words: items.map(w => w.term),
      strength: items.length,
    })).sort((a, b) => b.strength - a.strength)
  }, [words])

  const errorPatterns = useMemo((): ErrorPattern[] => {
    const wrongWords = words.filter(w => w.status === 'wrong')
    const patterns: Record<string, { words: string[]; count: number }> = {}

    wrongWords.forEach(w => {
      const key = `difficulty_${w.difficulty}`
      if (!patterns[key]) patterns[key] = { words: [], count: 0 }
      patterns[key].words.push(w.term)
      patterns[key].count++

      const catKey = `category_${w.category}`
      if (!patterns[catKey]) patterns[catKey] = { words: [], count: 0 }
      patterns[catKey].words.push(w.term)
      patterns[catKey].count++
    })

    return Object.entries(patterns).map(([pattern, data]) => ({
      pattern,
      description: getPatternDescription(pattern),
      frequency: data.count,
      affectedWords: data.words,
      suggestions: getPatternSuggestions(pattern),
    })).sort((a, b) => b.frequency - a.frequency)
  }, [words])

  const networkData = useMemo(() => {
    if (!selectedWord) return { nodes: [], edges: [] }

    const target = words.find(w => w.term === selectedWord)
    if (!target) return { nodes: [], edges: [] }

    const nodes: VocabNode[] = []
    const edges: VocabEdge[] = []

    nodes.push({ id: target.id, word: target.term, type: 'category', strength: 1, x: 200, y: 200 })

    if (target.synonyms) {
      target.synonyms.forEach((syn, idx) => {
        const angle = (2 * Math.PI * idx) / target.synonyms!.length
        const r = 100
        nodes.push({
          id: `syn_${idx}`,
          word: syn,
          type: 'synonym',
          strength: 0.8,
          x: 200 + r * Math.cos(angle),
          y: 200 + r * Math.sin(angle),
        })
        edges.push({ source: target.id, target: `syn_${idx}`, type: 'synonym', weight: 0.8 })
      })
    }

    const related = words
      .filter(w => w.id !== target.id && w.category === target.category)
      .slice(0, 6)
    related.forEach((w, idx) => {
      const angle = (2 * Math.PI * idx) / related.length + Math.PI / 4
      const r = 150
      nodes.push({
        id: w.id,
        word: w.term,
        type: 'related',
        strength: 0.5,
        x: 200 + r * Math.cos(angle),
        y: 200 + r * Math.sin(angle),
      })
      edges.push({ source: target.id, target: w.id, type: 'related', weight: 0.5 })
    })

    return { nodes, edges }
  }, [selectedWord, words])

  const masteryStats = useMemo(() => {
    const total = words.length
    const mastered = words.filter(w => w.status === 'mastered').length
    const byCategory: Record<string, { total: number; mastered: number }> = {}
    words.forEach(w => {
      const cat = w.category || 'general'
      if (!byCategory[cat]) byCategory[cat] = { total: 0, mastered: 0 }
      byCategory[cat].total++
      if (w.status === 'mastered') byCategory[cat].mastered++
    })
    return { total, mastered, byCategory }
  }, [words])

  const tabs = [
    { key: 'network' as const, label: '词汇网络', icon: 'share' },
    { key: 'clusters' as const, label: '语义聚类', icon: 'grid' },
    { key: 'errors' as const, label: '错词分析', icon: 'warning' },
  ]

  return (
    <div className="space-y-4 page-enter">
      <div className="glass-card p-4">
        <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-3">
          <Icon name="chart" size={20} className="text-brand-600 dark:text-brand-400" />
          词汇网络分析
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {Object.entries(masteryStats.byCategory).map(([cat, stat]) => (
            <div key={cat} className="rounded-lg bg-gray-50 dark:bg-gray-700/30 p-2 text-center">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{cat}</div>
              <div className="text-lg font-bold text-brand-600 dark:text-brand-400">
                {stat.total > 0 ? Math.round((stat.mastered / stat.total) * 100) : 0}%
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{stat.mastered}/{stat.total}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm transition-colors ${
              activeTab === tab.key
                ? 'text-brand-600 dark:text-brand-400 border-b-2 border-brand-500 dark:border-brand-400 font-medium'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Icon name={tab.icon as any} size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'network' && (
        <div className="glass-card p-4">
          <div className="mb-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">选择单词查看关联</label>
            <select
              className="w-full input-glass border rounded px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700"
              value={selectedWord || ''}
              onChange={e => setSelectedWord(e.target.value)}
            >
              <option value="">请选择...</option>
              {words.map(w => (
                <option key={w.id} value={w.term}>{w.term}</option>
              ))}
            </select>
          </div>

          {selectedWord && networkData.nodes.length > 0 && (
            <div className="border border-gray-200 dark:border-gray-700/50 rounded-lg bg-gray-50 dark:bg-gray-700/20 relative" style={{ height: '400px' }}>
              <svg width="100%" height="100%" viewBox="0 0 400 400">
                {networkData.edges.map((edge, idx) => {
                  const source = networkData.nodes.find(n => n.id === edge.source)
                  const target = networkData.nodes.find(n => n.id === edge.target)
                  if (!source || !target) return null
                  return (
                    <line
                      key={idx}
                      x1={source.x}
                      y1={source.y}
                      x2={target.x}
                      y2={target.y}
                      stroke={edge.type === 'synonym' ? '#3b82f6' : '#9ca3af'}
                      strokeWidth={edge.weight * 2}
                      strokeDasharray={edge.type === 'related' ? '4,4' : undefined}
                      opacity={0.6}
                    />
                  )
                })}
                {networkData.nodes.map(node => (
                  <g key={node.id}>
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={node.type === 'category' ? 30 : 20}
                      fill={
                        node.type === 'category' ? '#3b82f6' :
                        node.type === 'synonym' ? '#10b981' :
                        '#9ca3af'
                      }
                      opacity={0.8}
                    />
                    <text
                      x={node.x}
                      y={node.y + 4}
                      textAnchor="middle"
                      fill="white"
                      fontSize={node.type === 'category' ? 11 : 9}
                      fontWeight={node.type === 'category' ? 'bold' : 'normal'}
                    >
                      {node.word.length > 10 ? node.word.slice(0, 9) + '…' : node.word}
                    </text>
                  </g>
                ))}
              </svg>
              <div className="absolute bottom-2 left-2 flex gap-3 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> 中心词
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> 同义词
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-gray-400 inline-block" /> 相关词
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'clusters' && (
        <div className="glass-card p-4 space-y-4">
          <h4 className="font-medium text-gray-700 dark:text-gray-300">语义聚类分析</h4>
          {semanticClusters.map(cluster => (
            <div key={cluster.theme} className="border border-gray-200 dark:border-gray-700/50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900 dark:text-gray-100">{cluster.theme}</span>
                <span className="text-xs bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 px-2 py-0.5 rounded">
                  {cluster.words.length} 词
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {cluster.words.map(word => {
                  const w = words.find(wi => wi.term === word)
                  const isMastered = w?.status === 'mastered'
                  return (
                    <span
                      key={word}
                      className={`text-xs px-2 py-1 rounded ${
                        isMastered
                          ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/50'
                          : 'bg-gray-50 dark:bg-gray-700/30 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700/50'
                      }`}
                    >
                      {word}
                    </span>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'errors' && (
        <div className="glass-card p-4 space-y-4">
          <h4 className="font-medium text-gray-700 dark:text-gray-300">错词模式分析</h4>
          {errorPatterns.length === 0 ? (
            <div className="text-center text-gray-400 dark:text-gray-500 py-8">
              <Icon name="check" size={32} className="mx-auto mb-2 text-green-400 dark:text-green-500" />
              <p>暂无错词记录，继续保持！</p>
            </div>
          ) : (
            errorPatterns.map((pattern, idx) => (
              <div key={idx} className="border border-red-200 dark:border-red-800/50 rounded-lg p-3 bg-red-50 dark:bg-red-900/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-red-800 dark:text-red-300">{pattern.description}</span>
                  <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded">
                    {pattern.frequency} 次
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {pattern.affectedWords.slice(0, 8).map(word => (
                    <span key={word} className="text-xs bg-white dark:bg-gray-800 text-red-700 dark:text-red-400 px-2 py-0.5 rounded border border-red-200 dark:border-red-800/50">
                      {word}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-red-600 dark:text-red-400">
                  <span className="font-medium">建议：</span>
                  {pattern.suggestions.join('；')}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function getPatternDescription(pattern: string): string {
  if (pattern.startsWith('difficulty_')) {
    const level = pattern.split('_')[1]
    return `难度等级 ${level} 的词汇错误`
  }
  if (pattern.startsWith('category_')) {
    const cat = pattern.split('_')[1]
    return `${cat} 类别词汇错误`
  }
  return pattern
}

function getPatternSuggestions(pattern: string): string[] {
  if (pattern.startsWith('difficulty_4') || pattern.startsWith('difficulty_5')) {
    return ['尝试在语境中记忆', '使用词根词缀法分析', '增加复习频率']
  }
  if (pattern.startsWith('category_academic')) {
    return ['阅读更多学术材料', '注意术语的精确用法', '结合专业语境学习']
  }
  return ['增加复习频率', '使用多种学习模式', '注意拼写和用法']
}

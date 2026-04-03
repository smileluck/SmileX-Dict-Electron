import { useState } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '../store'
import WordAnalysis from '../components/vocabulary/WordAnalysis'
import AcademicCategories from '../components/vocabulary/AcademicCategories'
import EnhancedCard from '../components/vocabulary/EnhancedCard'
import WritingCollection from '../components/vocabulary/WritingCollection'
import LearningPath from '../components/vocabulary/LearningPath'
import VocabularyNetwork from '../components/vocabulary/VocabularyNetwork'
import PronunciationExercise from '../components/vocabulary/PronunciationExercise'
import Icon from '../components/Icon'

type TabKey = 'analysis' | 'writing' | 'path' | 'network'

export default function VocabularyAnalysis() {
  const words = useSelector((s: RootState) => s.words.items)
  const [activeTab, setActiveTab] = useState<TabKey>('analysis')
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null)

  const selectedWord = words.find(w => w.id === selectedWordId)

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'analysis', label: '词汇分析', icon: 'search' },
    { key: 'writing', label: '写作词汇', icon: 'pencil' },
    { key: 'path', label: '学习路径', icon: 'map' },
    { key: 'network', label: '词汇网络', icon: 'share' },
  ]

  return (
    <div className="space-y-4 page-enter">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Icon name="academic-cap" size={24} className="text-brand-600" />
          英语专业学习中心
        </h2>
        <div className="text-sm text-gray-500">
          共 {words.length} 词 | 已掌握 {words.filter(w => w.status === 'mastered').length} 词
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex border-b">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm transition-colors ${
              activeTab === tab.key
                ? 'text-brand-600 border-b-2 border-brand-500 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon name={tab.icon as any} size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'analysis' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Word selector */}
          <div className="lg:col-span-1">
            <div className="rounded-xl border bg-white p-4">
              <h3 className="font-medium text-gray-700 mb-3">选择单词</h3>
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {words.map(word => (
                  <button
                    key={word.id}
                    onClick={() => setSelectedWordId(word.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedWordId === word.id
                        ? 'bg-brand-50 text-brand-700 font-medium'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{word.term}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          word.status === 'mastered'
                            ? 'bg-green-100 text-green-700'
                            : word.status === 'wrong'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {word.status === 'mastered'
                          ? '已掌握'
                          : word.status === 'wrong'
                          ? '错词'
                          : '学习中'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 truncate">{word.meaning}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Analysis content */}
          <div className="lg:col-span-2 space-y-4">
            {selectedWord ? (
              <>
                {/* Enhanced word card */}
                <EnhancedCard word={selectedWord} />

                {/* Pronunciation exercise */}
                <PronunciationExercise word={selectedWord} />

                {/* Word analysis (root/affix) */}
                <WordAnalysis word={selectedWord} />

                {/* Academic categories */}
                <AcademicCategories word={selectedWord} />
              </>
            ) : (
              <div className="rounded-xl border bg-white p-8 text-center">
                <Icon name="search" size={32} className="mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">请从左侧选择一个单词开始分析</p>
                <p className="text-sm text-gray-400 mt-1">
                  支持词根词缀分析、学术分类、发音练习等功能
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'writing' && <WritingCollection />}
      {activeTab === 'path' && <LearningPath />}
      {activeTab === 'network' && <VocabularyNetwork />}
    </div>
  )
}

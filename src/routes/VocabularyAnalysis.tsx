import { useState } from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
  const words = useSelector((s: RootState) => s.words.items)
  const [activeTab, setActiveTab] = useState<TabKey>('analysis')
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null)

  const selectedWord = words.find(w => w.id === selectedWordId)

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'analysis', label: t('vocabAnalysis.analysis'), icon: 'search' },
    { key: 'writing', label: t('vocabAnalysis.writing'), icon: 'pencil' },
    { key: 'path', label: t('vocabAnalysis.path'), icon: 'map' },
    { key: 'network', label: t('vocabAnalysis.network'), icon: 'share' },
  ]

  return (
    <div className="space-y-4 page-enter">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Icon name="academic-cap" size={24} className="text-brand-600 dark:text-brand-400" />
          {t('vocabAnalysis.title')}
        </h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {t('vocabAnalysis.totalWords', { count: words.length })} | {t('vocabAnalysis.masteredWords', { count: words.filter(w => w.status === 'mastered').length })}
        </div>
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm transition-colors ${
              activeTab === tab.key
                ? 'text-brand-600 dark:text-brand-400 border-b-2 border-brand-500 dark:border-brand-400 font-medium'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Icon name={tab.icon as any} size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'analysis' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1">
            <div className="glass-card p-4">
              <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-3">{t('vocabAnalysis.selectWord')}</h3>
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {words.map(word => (
                  <button
                    key={word.id}
                    onClick={() => setSelectedWordId(word.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedWordId === word.id
                        ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 font-medium'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{word.term}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          word.status === 'mastered'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : word.status === 'wrong'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {word.status === 'mastered'
                          ? t('vocabAnalysis.mastered')
                          : word.status === 'wrong'
                          ? t('vocabAnalysis.wrong')
                          : t('vocabAnalysis.learning')}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 truncate">{word.meaning}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            {selectedWord ? (
              <>
                <EnhancedCard word={selectedWord} />
                <PronunciationExercise word={selectedWord} />
                <WordAnalysis word={selectedWord} />
                <AcademicCategories word={selectedWord} />
              </>
            ) : (
              <div className="glass-card p-8 text-center">
                <Icon name="search" size={32} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                <p className="text-gray-500 dark:text-gray-400">{t('vocabAnalysis.selectWordHint')}</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  {t('vocabAnalysis.selectWordDesc')}
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

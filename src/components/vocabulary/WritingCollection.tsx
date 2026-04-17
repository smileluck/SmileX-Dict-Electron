import { useState, useMemo } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '../../store'
import Icon from '../Icon'

interface WritingCollection {
  id: string
  name: string
  description: string
  category: string
  words: WritingWord[]
}

interface WritingWord {
  word: string
  definition: string
  level: 'basic' | 'intermediate' | 'advanced'
  examples: string[]
  synonyms: string[]
  replacements: string[]
}

interface WritingPrompt {
  id: string
  title: string
  description: string
  wordCount: number
  targetVocabulary: string[]
  difficulty: 'easy' | 'medium' | 'hard'
}

const WRITING_COLLECTIONS: WritingCollection[] = [
  {
    id: 'transition_words',
    name: '过渡词与连接词',
    description: '用于连接句子和段落的过渡词，提高文章连贯性',
    category: '连接词',
    words: [
      {
        word: 'Furthermore',
        definition: '此外，而且',
        level: 'intermediate',
        examples: ['Furthermore, the study revealed significant correlations.'],
        synonyms: ['moreover', 'in addition', 'additionally'],
        replacements: ['and', 'also', 'plus'],
      },
      {
        word: 'Nevertheless',
        definition: '然而，不过',
        level: 'advanced',
        examples: ['Nevertheless, the results were inconclusive.'],
        synonyms: ['nonetheless', 'however', 'notwithstanding'],
        replacements: ['but', 'still', 'yet'],
      },
      {
        word: 'Consequently',
        definition: '因此，结果',
        level: 'advanced',
        examples: ['Consequently, the policy was revised.'],
        synonyms: ['therefore', 'hence', 'thus'],
        replacements: ['so', 'because of this'],
      },
    ],
  },
  {
    id: 'academic_phrases',
    name: '学术表达',
    description: '学术论文中常用的高级表达和短语',
    category: '学术短语',
    words: [
      {
        word: 'It is widely acknowledged that',
        definition: '人们普遍认为',
        level: 'advanced',
        examples: ['It is widely acknowledged that climate change poses a significant threat.'],
        synonyms: ['It is generally recognized that', 'There is broad consensus that'],
        replacements: ['Everyone knows', 'People think'],
      },
      {
        word: 'A growing body of evidence',
        definition: '越来越多的证据',
        level: 'advanced',
        examples: ['A growing body of evidence suggests that...'],
        synonyms: ['An increasing amount of research', 'Mounting evidence'],
        replacements: ['A lot of evidence', 'Many studies'],
      },
    ],
  },
  {
    id: 'advanced_adjectives',
    name: '高级形容词',
    description: '替换常用形容词的高级词汇，提升表达精确度',
    category: '形容词',
    words: [
      {
        word: 'Paramount',
        definition: '最重要的，至高无上的',
        level: 'advanced',
        examples: ['Safety is of paramount importance in this industry.'],
        synonyms: ['crucial', 'vital', 'essential'],
        replacements: ['very important', 'really important', 'big'],
      },
      {
        word: 'Nuanced',
        definition: '微妙的，有细微差别的',
        level: 'advanced',
        examples: ['The author presents a nuanced argument.'],
        synonyms: ['subtle', 'detailed', 'sophisticated'],
        replacements: ['detailed', 'careful', 'nice'],
      },
    ],
  },
]

const WRITING_PROMPTS: WritingPrompt[] = [
  {
    id: 'academic_essay',
    title: '学术论文写作',
    description: '使用学术表达写一篇关于科技对教育影响的短文（200词）',
    wordCount: 200,
    targetVocabulary: ['furthermore', 'consequently', 'it is widely acknowledged that'],
    difficulty: 'hard',
  },
  {
    id: 'argumentative',
    title: '议论文练习',
    description: '使用过渡词写一篇关于环保的议论文（150词）',
    wordCount: 150,
    targetVocabulary: ['nevertheless', 'moreover', 'in contrast'],
    difficulty: 'medium',
  },
  {
    id: 'descriptive',
    title: '描述文练习',
    description: '使用高级形容词描述一个你印象深刻的地方（100词）',
    wordCount: 100,
    targetVocabulary: ['paramount', 'nuanced', 'breathtaking'],
    difficulty: 'easy',
  },
]

export default function WritingCollection() {
  const [activeCollection, setActiveCollection] = useState<string>('transition_words')
  const [showPrompts, setShowPrompts] = useState(false)
  const words = useSelector((s: RootState) => s.words.items)

  const currentCollection = useMemo(
    () => WRITING_COLLECTIONS.find(c => c.id === activeCollection),
    [activeCollection]
  )

  const collectionStats = useMemo(() => {
    const allWritingWords = WRITING_COLLECTIONS.flatMap(c => c.words)
    const knownWords = allWritingWords.filter(ww =>
      words.some(w => w.term.toLowerCase() === ww.word.toLowerCase() && w.status === 'mastered')
    )
    return {
      total: allWritingWords.length,
      known: knownWords.length,
      progress: Math.round((knownWords.length / allWritingWords.length) * 100),
    }
  }, [words])

  return (
    <div className="space-y-4 page-enter">
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Icon name="pencil" size={20} className="text-brand-600 dark:text-brand-400" />
            写作词汇积累
          </h3>
          <button
            onClick={() => setShowPrompts(!showPrompts)}
            className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium"
          >
            {showPrompts ? '返回词汇' : '写作练习'}
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-500 dark:text-gray-400">写作词汇掌握度</span>
              <span className="text-brand-600 dark:text-brand-400 font-medium">{collectionStats.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-brand-500 rounded-full h-2 transition-all"
                style={{ width: `${collectionStats.progress}%` }}
              />
            </div>
          </div>
          <div className="text-right text-sm text-gray-500 dark:text-gray-400">
            <span className="text-green-600 dark:text-green-400 font-medium">{collectionStats.known}</span> / {collectionStats.total}
          </div>
        </div>
      </div>

      {!showPrompts ? (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {WRITING_COLLECTIONS.map(col => (
              <button
                key={col.id}
                onClick={() => setActiveCollection(col.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeCollection === col.id
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {col.name}
              </button>
            ))}
          </div>

          {currentCollection && (
            <div className="text-sm text-gray-600 dark:text-gray-400 px-1">{currentCollection.description}</div>
          )}

          {currentCollection && (
            <div className="space-y-3">
              {currentCollection.words.map(word => {
                const isMastered = words.some(
                  w => w.term.toLowerCase() === word.word.toLowerCase() && w.status === 'mastered'
                )
                return (
                  <div
                    key={word.word}
                    className={`rounded-lg border p-4 transition-colors ${
                      isMastered ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50' : 'glass-card'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900 dark:text-gray-100">{word.word}</span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded ${
                              word.level === 'advanced'
                                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                                : word.level === 'intermediate'
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            }`}
                          >
                            {word.level === 'advanced' ? '高级' : word.level === 'intermediate' ? '中级' : '基础'}
                          </span>
                          {isMastered && (
                            <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded">
                              已掌握
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{word.definition}</p>
                        {word.examples.map((ex, idx) => (
                          <p key={idx} className="text-sm text-gray-500 dark:text-gray-400 italic mb-1">{ex}</p>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50 space-y-2">
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">同义表达：</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {word.synonyms.map(syn => (
                            <span key={syn} className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded">
                              {syn}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">可替换：</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {word.replacements.map(rep => (
                            <span key={rep} className="text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded line-through">
                              {rep}
                            </span>
                          ))}
                          <span className="text-xs text-gray-400 dark:text-gray-500">→</span>
                          <span className="text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded font-medium">
                            {word.word}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700 dark:text-gray-300">写作练习题目</h4>
          {WRITING_PROMPTS.map(prompt => (
            <div key={prompt.id} className="glass-card p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h5 className="font-medium text-gray-900 dark:text-gray-100">{prompt.title}</h5>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        prompt.difficulty === 'hard'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          : prompt.difficulty === 'medium'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                          : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      }`}
                    >
                      {prompt.difficulty === 'hard' ? '困难' : prompt.difficulty === 'medium' ? '中等' : '简单'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{prompt.description}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span>目标词数: {prompt.wordCount}词</span>
                    <span>目标词汇: {prompt.targetVocabulary.length}个</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50">
                <span className="text-xs text-gray-500 dark:text-gray-400">需要使用的词汇：</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {prompt.targetVocabulary.map(v => (
                    <span key={v} className="text-xs bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 px-2 py-0.5 rounded">
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

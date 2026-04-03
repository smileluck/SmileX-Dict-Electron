import { useState } from 'react'
import type { WordItem } from '../../features/words/wordsSlice'
import Icon from '../Icon'

interface AcademicCategory {
  id: string
  name: string
  description: string
  icon: 'book' | 'share' | 'grid' | 'chart' | 'mic' | 'info' | 'pencil' | 'chat-bubble'
  color: string
  disciplines: string[]
  difficultyLevels: number[]
}

interface AcademicCategoriesProps {
  word: WordItem
  onCategorySelect?: (categoryId: string) => void
}

const ACADEMIC_CATEGORIES: AcademicCategory[] = [
  {
    id: 'humanities',
    name: '人文学科',
    description: '文学、历史、哲学等领域的词汇',
    icon: 'book',
    color: 'text-purple-600 bg-purple-100',
    disciplines: ['Literature', 'History', 'Philosophy', 'Art'],
    difficultyLevels: [3, 4, 5]
  },
  {
    id: 'social_science',
    name: '社会科学',
    description: '社会学、心理学、政治学等学术词汇',
    icon: 'share',
    color: 'text-blue-600 bg-blue-100',
    disciplines: ['Sociology', 'Psychology', 'Political Science', 'Economics'],
    difficultyLevels: [3, 4, 5]
  },
  {
    id: 'stem',
    name: '理工学科',
    description: '科学、技术、工程、数学领域的术语',
    icon: 'grid',
    color: 'text-green-600 bg-green-100',
    disciplines: ['Science', 'Technology', 'Engineering', 'Mathematics'],
    difficultyLevels: [3, 4, 5]
  },
  {
    id: 'business',
    name: '商务英语',
    description: '商业、金融、管理领域的专业词汇',
    icon: 'chart',
    color: 'text-amber-600 bg-amber-100',
    disciplines: ['Business', 'Finance', 'Management', 'Marketing'],
    difficultyLevels: [2, 3, 4]
  },
  {
    id: 'medical',
    name: '医学词汇',
    description: '医疗、健康、生物医学领域的术语',
    icon: 'mic',
    color: 'text-red-600 bg-red-100',
    disciplines: ['Medicine', 'Healthcare', 'Biology'],
    difficultyLevels: [4, 5]
  },
  {
    id: 'law',
    name: '法律英语',
    description: '法律、法规、司法领域的专业术语',
    icon: 'info',
    color: 'text-gray-600 bg-gray-100',
    disciplines: ['Law', 'Justice', 'Regulation'],
    difficultyLevels: [4, 5]
  },
  {
    id: 'daily',
    name: '日常用语',
    description: '日常生活中常用的基础词汇',
    icon: 'chat-bubble',
    color: 'text-teal-600 bg-teal-100',
    disciplines: ['General', 'Daily Life'],
    difficultyLevels: [1, 2]
  },
  {
    id: 'academic_phrase',
    name: '学术短语',
    description: '学术论文中常用的固定表达和短语',
    icon: 'pencil',
    color: 'text-indigo-600 bg-indigo-100',
    disciplines: ['Academic Writing', 'Research'],
    difficultyLevels: [2, 3, 4]
  }
]

interface DisciplineWord {
  word: string
  definition: string
  examples: string[]
  frequency: number
  register: 'formal' | 'informal' | 'academic' | 'technical'
}

const DISCIPLINE_WORDS: Record<string, DisciplineWord[]> = {
  'Literature': [
    {
      word: 'metaphor',
      definition: '隐喻，一种修辞手法',
      examples: ['Life is a journey metaphor for existence.'],
      frequency: 85,
      register: 'academic'
    },
    {
      word: 'narrative',
      definition: '叙述，故事',
      examples: ['The narrative structure of the novel is complex.'],
      frequency: 78,
      register: 'academic'
    }
  ],
  'Science': [
    {
      word: 'hypothesis',
      definition: '假说，科学假设',
      examples: ['The hypothesis was tested through experiments.'],
      frequency: 92,
      register: 'academic'
    },
    {
      word: 'empirical',
      definition: '经验主义的，基于观察的',
      examples: ['Empirical evidence supports the theory.'],
      frequency: 88,
      register: 'academic'
    }
  ],
  'Business': [
    {
      word: 'revenue',
      definition: '收入，收益',
      examples: ['The company reported record revenue this quarter.'],
      frequency: 95,
      register: 'formal'
    },
    {
      word: 'acquisition',
      definition: '收购，购置',
      examples: ['The acquisition will expand our market share.'],
      frequency: 87,
      register: 'formal'
    }
  ]
}

export default function AcademicCategories({ word, onCategorySelect }: AcademicCategoriesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  
  // Find categories that might match the word
  const matchingCategories = ACADEMIC_CATEGORIES.filter(category => {
    // Simple keyword matching for demonstration
    const categoryKeywords = category.name + category.description
    const wordLower = word.term.toLowerCase()
    const keywordsLower = categoryKeywords.toLowerCase()
    
    // Check if word might belong to this category
    return (
      category.disciplines.some(disc => wordLower.includes(disc.toLowerCase())) ||
      wordLower.includes(category.name.toLowerCase()) ||
      keywordsLower.includes(wordLower) ||
      category.difficultyLevels.includes(word.difficulty)
    )
  })
  
  // Get related words for selected category
  const getRelatedWords = (category: AcademicCategory) => {
    const words: Array<DisciplineWord & { discipline: string }> = []
    
    category.disciplines.forEach(discipline => {
      if (DISCIPLINE_WORDS[discipline]) {
        DISCIPLINE_WORDS[discipline].forEach(word => {
          words.push({ ...word, discipline })
        })
      }
    })
    
    return words.slice(0, 5) // Limit to 5 related words
  }
  
  if (matchingCategories.length === 0) {
    return null
  }
  
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon name="academic-cap" size={16} className="text-brand-600" />
        <h4 className="text-sm font-medium text-gray-700">学术词汇分类</h4>
      </div>
      
      {/* Matching categories */}
      <div className="flex flex-wrap gap-2">
        {matchingCategories.map(category => (
          <button
            key={category.id}
            onClick={() => {
              setSelectedCategory(selectedCategory === category.id ? null : category.id)
              setExpandedCategory(expandedCategory === category.id ? null : category.id)
              onCategorySelect?.(category.id)
            }}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors ${
              selectedCategory === category.id 
                ? `${category.color} border-current font-medium` 
                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <Icon name={category.icon as any} size={14} />
            {category.name}
          </button>
        ))}
      </div>
      
      {/* Category details */}
      {expandedCategory && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          {(() => {
            const category = ACADEMIC_CATEGORIES.find(c => c.id === expandedCategory)
            if (!category) return null
            
            const relatedWords = getRelatedWords(category)
            
            return (
              <div className="space-y-4">
                <div>
                  <h5 className="font-medium text-gray-900 mb-1">{category.name}</h5>
                  <p className="text-sm text-gray-600">{category.description}</p>
                  
                  <div className="mt-2 flex flex-wrap gap-1">
                    {category.disciplines.map(disc => (
                      <span key={disc} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {disc}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Related academic words */}
                {relatedWords.length > 0 && (
                  <div>
                    <h6 className="text-sm font-medium text-gray-700 mb-2">相关学术词汇</h6>
                    <div className="space-y-2">
                      {relatedWords.map((relatedWord, idx) => (
                        <div key={idx} className="bg-white rounded p-3 border border-gray-200">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-900">{relatedWord.word}</span>
                            <span className="text-xs text-gray-500">
                              {relatedWord.discipline} • 词频: {relatedWord.frequency}%
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{relatedWord.definition}</p>
                          <div className="flex items-center justify-between">
                            <span className={`text-xs px-2 py-1 rounded ${
                              relatedWord.register === 'academic' ? 'bg-purple-100 text-purple-700' :
                              relatedWord.register === 'formal' ? 'bg-gray-100 text-gray-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {relatedWord.register === 'academic' ? '学术用语' :
                               relatedWord.register === 'formal' ? '正式用语' : '日常用语'}
                            </span>
                            <button 
                              className="text-xs text-brand-600 hover:text-brand-700"
                              onClick={() => {
                                // Here you could navigate to this word
                                console.log('Navigate to:', relatedWord.word)
                              }}
                            >
                              查看 →
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Learning recommendations */}
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <h6 className="text-sm font-medium text-blue-800 mb-1">学习建议</h6>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• 这类词汇需要在<span className="font-medium">特定语境</span>中学习</li>
                    <li>• 建议阅读<span className="font-medium">相关学科的英文材料</span></li>
                    <li>• 注意<span className="font-medium">术语的精确含义</span>和使用场合</li>
                    <li>• 记住相关的<span className="font-medium">搭配和短语</span></li>
                  </ul>
                </div>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
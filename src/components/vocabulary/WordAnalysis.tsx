import { useState } from 'react'
import type { WordItem } from '../../features/words/wordsSlice'
import Icon from '../Icon'

interface RootAffix {
  id: string
  text: string
  type: 'root' | 'prefix' | 'suffix'
  meaning: string
  examples: string[]
  language: string
}

interface WordBreakdown {
  root: RootAffix[]
  prefixes: RootAffix[]
  suffixes: RootAffix[]
}

interface WordAnalysisProps {
  word: WordItem
}

// Sample root/affix data - in a real app this would be from a database
const ROOTS_DATABASE: RootAffix[] = [
  {
    id: 'phon',
    text: 'phon',
    type: 'root',
    meaning: '声音',
    examples: ['telephone', 'symphony', 'microphone'],
    language: 'Greek'
  },
  {
    id: 'port',
    text: 'port',
    type: 'root',
    meaning: '搬运',
    examples: ['transport', 'import', 'portable'],
    language: 'Latin'
  },
  {
    id: 'spect',
    text: 'spect',
    type: 'root',
    meaning: '看',
    examples: ['inspect', 'spectator', 'retrospect'],
    language: 'Latin'
  },
  {
    id: 'trans',
    text: 'trans',
    type: 'prefix',
    meaning: '横跨，穿过',
    examples: ['transfer', 'transparent', 'translate'],
    language: 'Latin'
  },
  {
    id: 'un',
    text: 'un',
    type: 'prefix',
    meaning: '不，相反',
    examples: ['unable', 'unhappy', 'undo'],
    language: 'Germanic'
  },
  {
    id: 'tion',
    text: 'tion',
    type: 'suffix',
    meaning: '状态，行为',
    examples: ['attention', 'creation', 'solution'],
    language: 'Latin'
  },
  {
    id: 'able',
    text: 'able',
    type: 'suffix',
    meaning: '能够',
    examples: ['acceptable', 'comfortable', 'reliable'],
    language: 'Latin'
  }
]

export default function WordAnalysis({ word }: WordAnalysisProps) {
  const [expanded, setExpanded] = useState(false)
  
  // Analyze the word structure
  const analyzeWord = (): WordBreakdown => {
    const breakdown: WordBreakdown = {
      root: [],
      prefixes: [],
      suffixes: []
    }
    
    const lowerTerm = word.term.toLowerCase()
    
    // Find roots that match part of the word
    ROOTS_DATABASE.filter(root => 
      root.type === 'root' && lowerTerm.includes(root.text)
    ).forEach(root => {
      // Check if this is actually a root (not just part of a larger word)
      const regex = new RegExp(`\\b${root.text}\\w*\\b`)
      if (regex.test(lowerTerm)) {
        breakdown.root.push(root)
      }
    })
    
    // Find prefixes
    ROOTS_DATABASE.filter(root => 
      root.type === 'prefix' && lowerTerm.startsWith(root.text)
    ).forEach(prefix => {
      breakdown.prefixes.push(prefix)
    })
    
    // Find suffixes
    ROOTS_DATABASE.filter(root => 
      root.type === 'suffix' && lowerTerm.endsWith(root.text)
    ).forEach(suffix => {
      breakdown.suffixes.push(suffix)
    })
    
    return breakdown
  }
  
  const breakdown = analyzeWord()
  
  if (!expanded && breakdown.root.length === 0 && breakdown.prefixes.length === 0 && breakdown.suffixes.length === 0) {
    return null // Don't show if no analysis available
  }
  
  return (
    <div className="space-y-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 font-medium"
      >
        <Icon name="book-open" size={16} />
        {expanded ? '收起' : '展开'}词根词缀分析
        {expanded ? <Icon name="chevron-up" size={14} /> : <Icon name="chevron-down" size={14} />}
      </button>
      
      {expanded && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="space-y-4">
            {/* Root analysis */}
            {breakdown.root.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-brand-500 rounded-full"></span>
                  词根
                </h4>
                <div className="space-y-2">
                  {breakdown.root.map(root => (
                    <div key={root.id} className="bg-white rounded p-3 border">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900">{root.text}</span>
                        <span className="text-xs bg-brand-100 text-brand-700 px-2 py-1 rounded">
                          {root.language}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{root.meaning}</p>
                      <div className="space-y-1">
                        {root.examples.map((example, idx) => (
                          <div key={idx} className="text-xs text-gray-500">
                            {example}{' '}
                            <span className="text-gray-400">
                              (原词: {word.term.includes(example) ? word.term : word.term.replace(root.text, `<span style="color: #3b82f6">${root.text}</span>`)})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Prefix analysis */}
            {breakdown.prefixes.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  前缀
                </h4>
                <div className="space-y-2">
                  {breakdown.prefixes.map(prefix => (
                    <div key={prefix.id} className="bg-white rounded p-3 border">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900">{prefix.text}</span>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          {prefix.language}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{prefix.meaning}</p>
                      <div className="space-y-1">
                        {prefix.examples.map((example, idx) => (
                          <div key={idx} className="text-xs text-gray-500">
                            {example}{' '}
                            <span className="text-gray-400">
                              ({word.term.includes(example) ? word.term : word.term.replace(prefix.text, `<span style="color: #10b981">${prefix.text}</span>`)})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Suffix analysis */}
            {breakdown.suffixes.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  后缀
                </h4>
                <div className="space-y-2">
                  {breakdown.suffixes.map(suffix => (
                    <div key={suffix.id} className="bg-white rounded p-3 border">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900">{suffix.text}</span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {suffix.language}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{suffix.meaning}</p>
                      <div className="space-y-1">
                        {suffix.examples.map((example, idx) => (
                          <div key={idx} className="text-xs text-gray-500">
                            {example}{' '}
                            <span className="text-gray-400">
                              ({word.term.includes(example) ? word.term : word.term.replace(suffix.text, `<span style="color: #3b82f6">${suffix.text}</span>`)})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Word formation summary */}
            {word.term.length > 5 && (
              <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                <h4 className="font-medium text-sm text-amber-800 mb-2">词汇构成分析</h4>
                <div className="text-xs text-amber-700 space-y-1">
                  <p>
                    <span className="font-medium">{word.term}</span> 可以分解为：
                  </p>
                  {breakdown.prefixes.length > 0 && (
                    <p>
                      前缀 <span className="font-medium">{breakdown.prefixes[0].text}</span> ({breakdown.prefixes[0].meaning}) +
                    </p>
                  )}
                  {breakdown.root.length > 0 && (
                    <p>
                      词根 <span className="font-medium">{breakdown.root[0].text}</span> ({breakdown.root[0].meaning}) +
                    </p>
                  )}
                  {breakdown.suffixes.length > 0 && (
                    <p>
                      后缀 <span className="font-medium">{breakdown.suffixes[0].text}</span> ({breakdown.suffixes[0].meaning})
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
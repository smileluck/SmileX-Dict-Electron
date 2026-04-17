import { speakWord, speakSentence, speakChinese, isSpeechAvailable, stopSpeaking } from '../utils/speech'
import { useState, useRef, useEffect } from 'react'

type SpeakMode = 'word' | 'sentence' | 'chinese'

interface SpeakButtonProps {
  text: string
  mode?: SpeakMode
  size?: number
  className?: string
}

export default function SpeakButton({ text, mode = 'word', size = 20, className = '' }: SpeakButtonProps) {
  const [speaking, setSpeaking] = useState(false)
  const timerRef = useRef<number | undefined>(undefined)

  if (!isSpeechAvailable()) return null

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (speaking) {
      stopSpeaking()
      setSpeaking(false)
      return
    }
    if (mode === 'word') speakWord(text)
    else if (mode === 'sentence') speakSentence(text)
    else speakChinese(text)
    setSpeaking(true)
    timerRef.current = window.setTimeout(() => setSpeaking(false), 3000)
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center justify-center rounded-lg transition-all duration-200 ${
        speaking
          ? 'text-brand-500 dark:text-brand-400 bg-brand-500/10 dark:bg-brand-400/10'
          : 'text-gray-400 dark:text-gray-500 hover:text-brand-500 dark:hover:text-brand-400 hover:bg-brand-500/5 dark:hover:bg-brand-400/5'
      } ${className}`}
      title={mode === 'word' ? 'Read word' : mode === 'sentence' ? 'Read sentence' : 'Read Chinese'}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M11 5L6 9H2v6h4l5 4V5z" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
      </svg>
    </button>
  )
}

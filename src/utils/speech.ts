let synth: SpeechSynthesis | null = null

function getSynth(): SpeechSynthesis | null {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    synth = window.speechSynthesis
  }
  return synth
}

export function speak(text: string, lang: string = 'en-US', rate: number = 0.9): void {
  const s = getSynth()
  if (!s) return
  s.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = lang
  utterance.rate = rate
  utterance.pitch = 1
  s.speak(utterance)
}

export function speakWord(term: string): void {
  speak(term, 'en-US', 0.85)
}

export function speakSentence(text: string): void {
  speak(text, 'en-US', 0.9)
}

export function speakChinese(text: string): void {
  speak(text, 'zh-CN', 0.9)
}

export function isSpeechAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.speechSynthesis
}

export function stopSpeaking(): void {
  const s = getSynth()
  if (s) s.cancel()
}

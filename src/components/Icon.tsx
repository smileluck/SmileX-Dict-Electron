import type { ComponentProps } from 'react'

type IconName = 'dict' | 'book' | 'star' | 'wrong' | 'check' | 'review' | 'eye' |
  'search' | 'pencil' | 'link' | 'chat-bubble' | 'puzzle' | 'share' | 'grid' |
  'warning' | 'map' | 'lightbulb' | 'mic' | 'info' | 'chart' | 'academic-cap' |
  'chevron-up' | 'chevron-down' | 'book-open' | 'arrow-right'

type Props = {
  name: IconName
  size?: number
} & Pick<ComponentProps<'svg'>, 'className'>

export default function Icon({ name, size = 20, className }: Props) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }
  switch (name) {
    case 'dict':
      return (
        <svg {...common} className={className}><path d="M4 6h12a4 4 0 0 1 4 4v8H8a4 4 0 0 1-4-4V6z"/><path d="M8 6v12"/></svg>
      )
    case 'book':
      return (
        <svg {...common} className={className}><path d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4V4z"/><path d="M8 4v12"/></svg>
      )
    case 'star':
      return (
        <svg {...common} className={className}><path d="M12 3l3.09 6.26L22 10l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.87 2 10l6.91-0.74L12 3z"/></svg>
      )
    case 'wrong':
      return (
        <svg {...common} className={className}><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6"/><path d="M9 9l6 6"/></svg>
      )
    case 'check':
      return (
        <svg {...common} className={className}><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-5"/></svg>
      )
    case 'review':
      return (
        <svg {...common} className={className}><path d="M4 5h16v12H9l-5 4z"/></svg>
      )
    case 'eye':
      return (
        <svg {...common} className={className}><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
      )
    case 'search':
      return (
        <svg {...common} className={className}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
      )
    case 'pencil':
      return (
        <svg {...common} className={className}><path d="M17 3l4 4L7 21H3v-4L17 3z"/></svg>
      )
    case 'link':
      return (
        <svg {...common} className={className}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
      )
    case 'chat-bubble':
      return (
        <svg {...common} className={className}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      )
    case 'puzzle':
      return (
        <svg {...common} className={className}><path d="M19.439 7.85c-.049.084-.1.164-.164.236a2.5 2.5 0 1 1-3.536 0 2.5 2.5 0 1 1 0-3.536 2.5 2.5 0 1 1 3.536 0c.064.072.115.152.164.236z"/><path d="M2 12a2.5 2.5 0 1 1 5 0 2.5 2.5 0 0 1-5 0z"/><path d="M12 2a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z"/><path d="M12 17a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z"/></svg>
      )
    case 'share':
      return (
        <svg {...common} className={className}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/></svg>
      )
    case 'grid':
      return (
        <svg {...common} className={className}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
      )
    case 'warning':
      return (
        <svg {...common} className={className}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>
      )
    case 'map':
      return (
        <svg {...common} className={className}><path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z"/><path d="M8 2v16M16 6v16"/></svg>
      )
    case 'lightbulb':
      return (
        <svg {...common} className={className}><path d="M9 18h6M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/></svg>
      )
    case 'mic':
      return (
        <svg {...common} className={className}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/></svg>
      )
    case 'info':
      return (
        <svg {...common} className={className}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
      )
    case 'chart':
      return (
        <svg {...common} className={className}><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
      )
    case 'academic-cap':
      return (
        <svg {...common} className={className}><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5"/></svg>
      )
    case 'chevron-up':
      return (
        <svg {...common} className={className}><path d="M18 15l-6-6-6 6"/></svg>
      )
    case 'chevron-down':
      return (
        <svg {...common} className={className}><path d="M6 9l6 6 6-6"/></svg>
      )
    case 'book-open':
      return (
        <svg {...common} className={className}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
      )
    case 'arrow-right':
      return (
        <svg {...common} className={className}><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      )
    default:
      return null
  }
}
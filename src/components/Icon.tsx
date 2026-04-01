import type { ComponentProps } from 'react'

type Props = {
  name: 'dict' | 'book' | 'star' | 'wrong' | 'check' | 'review' | 'eye'
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
    default:
      return null
  }
}
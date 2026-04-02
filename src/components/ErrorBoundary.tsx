import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      return (
        <div className="min-h-[200px] flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-4xl mb-3">⚠️</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">出了点问题</h3>
            <p className="text-sm text-gray-500 mb-4">{this.state.error?.message || '发生了未知错误'}</p>
            <button
              className="px-4 py-2 bg-brand-500 text-white rounded hover:bg-brand-600 transition-colors"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              重试
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

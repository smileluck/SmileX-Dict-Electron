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
          <div className="text-center glass-card p-8">
            <div className="text-4xl mb-3">&#x26A0;&#xFE0F;</div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Something went wrong</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{this.state.error?.message || 'Unknown error occurred'}</p>
            <button
              className="btn-primary px-6 py-2"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Retry
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

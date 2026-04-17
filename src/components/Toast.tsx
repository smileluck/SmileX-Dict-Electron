import { useState, useCallback, useRef, createContext, useContext, type ReactNode } from 'react'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

interface ToastContextType {
  showToast: (message: string, type?: Toast['type']) => void
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextIdRef = useRef(0)

  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = ++nextIdRef.current
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-xl shadow-glass-lg backdrop-blur-xl text-sm font-medium animate-slide-in flex items-center gap-2.5 min-w-[220px] border ${
              toast.type === 'success'
                ? 'bg-green-500/90 border-green-400/30 text-white'
                : toast.type === 'error'
                ? 'bg-red-500/90 border-red-400/30 text-white'
                : 'bg-gray-800/90 border-gray-600/30 text-white'
            }`}
            onClick={() => removeToast(toast.id)}
          >
            <span className="text-base">
              {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✗' : 'ℹ'}
            </span>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

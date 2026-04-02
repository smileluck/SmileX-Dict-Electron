import { Routes, Route, NavLink } from 'react-router-dom'
import { useState } from 'react'
import Home from './routes/Home'
import Dicts from './routes/Dicts'
import Panel from './routes/Panel'
import Library from './routes/Library'
import LibraryAdd from './routes/LibraryAdd'
import PracticeWords from './routes/PracticeWords'
import PracticeArticles from './routes/PracticeArticles'
import About from './routes/About'
import Collections from './routes/Collections'
import WrongWords from './routes/WrongWords'
import Mastered from './routes/Mastered'
import ErrorBoundary from './components/ErrorBoundary'
import { ToastProvider } from './components/Toast'

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { to: '/', label: '主页' },
    { to: '/panel', label: '面板' },
    { to: '/dicts', label: '词典' },
    { to: '/library', label: '书籍' },
    { to: '/about', label: '关于' },
  ]

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <header className="sticky top-0 z-10 bg-white border-b shadow-sm">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/smilex.svg" alt="SmileX" className="w-6 h-6" />
              <h1 className="text-xl font-semibold">SmileX Dict</h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex gap-3 text-sm">
              {navLinks.map(link => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  className={({isActive}) => `px-2 py-1 rounded transition-colors ${isActive ? 'bg-brand-100 text-brand-700' : 'hover:bg-gray-100'}`}
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {mobileMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <><path d="M3 12h18" /><path d="M3 6h18" /><path d="M3 18h18" /></>
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="md:hidden border-t bg-white px-4 py-2 space-y-1">
              {navLinks.map(link => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  className={({isActive}) => `block px-3 py-2 rounded text-sm transition-colors ${isActive ? 'bg-brand-100 text-brand-700' : 'hover:bg-gray-100'}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          )}
        </header>
        <main className="max-w-5xl mx-auto px-4 py-6">
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dicts" element={<Dicts />} />
              <Route path="/panel" element={<Panel />} />
              <Route path="/library" element={<Library />} />
              <Route path="/library/new" element={<LibraryAdd />} />
              <Route path="/practice/words" element={<PracticeWords />} />
              <Route path="/practice/articles" element={<PracticeArticles />} />
              <Route path="/collections" element={<Collections />} />
              <Route path="/wrong-words" element={<WrongWords />} />
              <Route path="/mastered" element={<Mastered />} />
              <Route path="/about" element={<About />} />
            </Routes>
          </ErrorBoundary>
        </main>
      </div>
    </ToastProvider>
  )
}

export default App

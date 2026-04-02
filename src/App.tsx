import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import Home from './routes/Home'
import Dicts from './routes/Dicts'
import Panel from './routes/Panel'
import Library from './routes/Library'
import LibraryAdd from './routes/LibraryAdd'
import PracticeWords from './routes/PracticeWords'
import PracticeArticles from './routes/PracticeArticles'
import About from './routes/About'
import StudyGuide from './routes/StudyGuide'
import Collections from './routes/Collections'
import WrongWords from './routes/WrongWords'
import Mastered from './routes/Mastered'
import Login from './routes/Login'
import ErrorBoundary from './components/ErrorBoundary'
import { ToastProvider } from './components/Toast'
import { clearAuth } from './features/auth/authSlice'
import type { RootState } from './store'
import { useNavigate } from 'react-router-dom'

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const [mobileMoreMenuOpen, setMobileMoreMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mobileUserMenuOpen, setMobileUserMenuOpen] = useState(false)
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated)
  const user = useSelector((state: RootState) => state.auth.user)
  const dispatch = useDispatch()
  const location = useLocation()
  const navigate = useNavigate()
  const moreMenuRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const handleLogout = () => {
    dispatch(clearAuth())
    navigate('/')
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setMoreMenuOpen(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const navLinks = [
    { to: '/', label: '主页', public: true },
    { to: '/dicts', label: '词典', public: true },
    { to: '/library', label: '书籍', public: true },
  ]

  const moreItems = [
    { to: '/about', label: '关于' },
    { to: '/study-guide', label: '学习指南' },
  ]

  const userMenuItems = [
    { to: '/panel', label: '面板', action: () => {} },
    { label: '登出', action: handleLogout },
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
            <nav className="hidden md:flex gap-3 text-sm items-center">
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
              <div className="relative" ref={moreMenuRef}>
                <button
                  onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                  className={`px-2 py-1 rounded transition-colors flex items-center gap-1 ${moreMenuOpen ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
                >
                  更多
                  <svg
                    className={`w-4 h-4 text-gray-500 transition-transform ${moreMenuOpen ? 'rotate-180' : ''}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M6 9l6 6 6-9" />
                  </svg>
                </button>
                {moreMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg py-1 min-w-[100px]">
                    {moreItems.map(item => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setMoreMenuOpen(false)}
                        className={({isActive}) => `block px-4 py-2 text-sm transition-colors ${isActive ? 'bg-brand-50 text-brand-700' : 'hover:bg-gray-50'}`}
                      >
                        {item.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
              {isAuthenticated ? (
                <div className="relative ml-4 pl-4 border-l" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className={`px-2 py-1 rounded transition-colors flex items-center gap-2 ${userMenuOpen ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
                  >
                    <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span className="text-sm text-gray-600">{user?.username}</span>
                    <svg
                      className={`w-4 h-4 text-gray-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M6 9l6 6 6-9" />
                    </svg>
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg py-1 min-w-[120px]">
                      {userMenuItems.map((item, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setUserMenuOpen(false)
                            if (item.action) item.action()
                          }}
                          className="block w-full px-4 py-2 text-sm text-left transition-colors hover:bg-gray-50"
                        >
                          {item.to ? (
                            <NavLink to={item.to} className="block">
                              {item.label}
                            </NavLink>
                          ) : (
                            item.label
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <NavLink
                  to="/login"
                  state={{ from: location.pathname }}
                  className="px-3 py-1 bg-brand-500 text-white rounded hover:bg-brand-600"
                >
                  登录
                </NavLink>
              )}
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
              <div className="border-t mt-2 pt-2">
                <button
                  className={`w-full flex items-center justify-between px-3 py-2 rounded text-sm transition-colors ${mobileMoreMenuOpen ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
                  onClick={() => setMobileMoreMenuOpen(!mobileMoreMenuOpen)}
                >
                  更多
                  <svg
                    className={`w-4 h-4 text-gray-500 transition-transform ${mobileMoreMenuOpen ? 'rotate-180' : ''}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M6 9l6 6 6-9" />
                  </svg>
                </button>
                {mobileMoreMenuOpen && (
                  <div className="pl-4 mt-1 space-y-1">
                    {moreItems.map(item => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => {
                          setMobileMoreMenuOpen(false)
                          setMobileMenuOpen(false)
                        }}
                        className={({isActive}) => `block px-3 py-2 rounded text-sm transition-colors ${isActive ? 'bg-brand-100 text-brand-700' : 'hover:bg-gray-100'}`}
                      >
                        {item.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
              {isAuthenticated ? (
                <div className="border-t mt-2 pt-2">
                  <button
                    className={`w-full flex items-center justify-between px-3 py-2 rounded text-sm transition-colors ${mobileUserMenuOpen ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
                    onClick={() => setMobileUserMenuOpen(!mobileUserMenuOpen)}
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      <span className="text-sm text-gray-600">{user?.username}</span>
                    </div>
                    <svg
                      className={`w-4 h-4 text-gray-500 transition-transform ${mobileUserMenuOpen ? 'rotate-180' : ''}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M6 9l6 6 6-9" />
                    </svg>
                  </button>
                  {mobileUserMenuOpen && (
                    <div className="pl-4 mt-1 space-y-1">
                      {userMenuItems.map((item, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setMobileUserMenuOpen(false)
                            setMobileMenuOpen(false)
                            if (item.action) item.action()
                          }}
                          className="block w-full px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100 rounded"
                        >
                          {item.to ? (
                            <NavLink to={item.to} className="block">
                              {item.label}
                            </NavLink>
                          ) : (
                            item.label
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <NavLink
                  to="/login"
                  state={{ from: location.pathname }}
                  className="block px-3 py-2 mt-2 pt-2 border-t text-center bg-brand-500 text-white rounded"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  登录
                </NavLink>
              )}
            </nav>
          )}
        </header>
        <main className="max-w-5xl mx-auto px-4 py-6">
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dicts" element={<Dicts />} />
              <Route path="/panel" element={isAuthenticated ? <Panel /> : <Navigate to="/login" state={{ from: '/panel' }} replace />} />
              <Route path="/library" element={<Library />} />
              <Route path="/library/new" element={isAuthenticated ? <LibraryAdd /> : <Navigate to="/login" state={{ from: '/library/new' }} replace />} />
              <Route path="/practice/words" element={isAuthenticated ? <PracticeWords /> : <Navigate to="/login" state={{ from: '/practice/words' }} replace />} />
              <Route path="/practice/articles" element={isAuthenticated ? <PracticeArticles /> : <Navigate to="/login" state={{ from: '/practice/articles' }} replace />} />
              <Route path="/collections" element={isAuthenticated ? <Collections /> : <Navigate to="/login" state={{ from: '/collections' }} replace />} />
              <Route path="/wrong-words" element={isAuthenticated ? <WrongWords /> : <Navigate to="/login" state={{ from: '/wrong-words' }} replace />} />
              <Route path="/mastered" element={isAuthenticated ? <Mastered /> : <Navigate to="/login" state={{ from: '/mastered' }} replace />} />
              <Route path="/about" element={<About />} />
              <Route path="/study-guide" element={<StudyGuide />} />
              <Route path="/login" element={<Login />} />
            </Routes>
          </ErrorBoundary>
        </main>
      </div>
    </ToastProvider>
  )
}

export default App

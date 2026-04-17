import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
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
import Settings from './routes/Settings'
import VocabularyAnalysis from './routes/VocabularyAnalysis'
import ErrorBoundary from './components/ErrorBoundary'
import { ToastProvider } from './components/Toast'
import SearchDialog from './components/SearchDialog'
import { fetchCurrentUser, loadUserDicts, logoutUser } from './features/auth/authSlice'
import { hasToken } from './services/api'
import type { RootState } from './store'
import { useNavigate } from 'react-router-dom'

function App() {
  const { t } = useTranslation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const [mobileMoreMenuOpen, setMobileMoreMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mobileUserMenuOpen, setMobileUserMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated)
  const user = useSelector((state: RootState) => state.auth.user)
  const dispatch = useDispatch()
  const location = useLocation()
  const navigate = useNavigate()
  const moreMenuRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(loadUserDicts())
    }
  }, [isAuthenticated, dispatch])

  useEffect(() => {
    if (!isAuthenticated) {
      hasToken().then(ok => {
        if (ok) dispatch(fetchCurrentUser())
      })
    }
  }, [])

  const handleLogout = () => {
    dispatch(logoutUser())
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileMenuOpen])

  const navLinks = [
    { to: '/', label: t('nav.home'), public: true },
    { to: '/dicts', label: t('nav.dicts'), public: true },
    { to: '/library', label: t('nav.library'), public: true },
    { to: '/vocab-analysis', label: t('nav.vocabAnalysis'), public: true },
  ]

  const moreItems = [
    { to: '/about', label: t('nav.about') },
    { to: '/study-guide', label: t('nav.studyGuide') },
  ]

  const userMenuItems = [
    { to: '/panel', label: t('nav.panel'), action: () => {} },
    { to: '/settings', label: t('nav.settings'), action: () => {} },
    { label: t('nav.logout'), action: handleLogout },
  ]

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-brand-50/20 dark:from-gray-950 dark:via-gray-900 dark:to-brand-950/20 bg-gradient-mesh dark:bg-gradient-mesh-dark text-gray-900 dark:text-gray-100">
        <header className="glass-nav sticky top-0 z-30">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow">
                <img src="/smilex.svg" alt="SmileX" className="w-5 h-5 brightness-0 invert" />
              </div>
              <h1 className="text-lg font-bold text-gradient hidden sm:block">SmileX Dict</h1>
            </div>

            <nav className="hidden md:flex gap-1 text-sm items-center">
              {navLinks.map(link => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  className={({isActive}) =>
                    `px-3 py-1.5 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-brand-500/10 dark:bg-brand-400/15 text-brand-600 dark:text-brand-400 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              <button
                onClick={() => setSearchOpen(true)}
                className="px-2.5 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-1.5 text-gray-400 dark:text-gray-500 hover:bg-gray-100/80 dark:hover:bg-gray-700/50 hover:text-gray-600 dark:hover:text-gray-300"
                title={t('nav.searchHint')}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 font-mono">{t('nav.ctrlK')}</kbd>
              </button>
              <div className="relative" ref={moreMenuRef}>
                <button
                  onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                  className={`px-2.5 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-1 ${
                    moreMenuOpen
                      ? 'bg-gray-100 dark:bg-gray-700/70 text-gray-900 dark:text-gray-200'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-700/50'
                  }`}
                >
                  {t('nav.more')}
                  <svg
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${moreMenuOpen ? 'rotate-180' : ''}`}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                {moreMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 glass-modal py-1.5 min-w-[140px] animate-scale-in">
                    {moreItems.map(item => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setMoreMenuOpen(false)}
                        className={({isActive}) =>
                          `block px-4 py-2 text-sm transition-colors ${
                            isActive
                              ? 'bg-brand-500/10 dark:bg-brand-400/15 text-brand-600 dark:text-brand-400'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                          }`
                        }
                      >
                        {item.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
              {isAuthenticated ? (
                <div className="relative ml-3 pl-3 border-l border-gray-200 dark:border-gray-700" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className={`px-2 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                      userMenuOpen
                        ? 'bg-gray-100 dark:bg-gray-700/70'
                        : 'hover:bg-gray-100/80 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-brand flex items-center justify-center text-white text-xs font-bold ring-2 ring-brand-500/20">
                      {user?.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{user?.username}</span>
                    <svg
                      className={`w-3.5 h-3.5 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 glass-modal py-1.5 min-w-[140px] animate-scale-in">
                      {userMenuItems.map((item, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setUserMenuOpen(false)
                            if (item.action) item.action()
                          }}
                          className="block w-full px-4 py-2 text-sm text-left transition-colors text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200"
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
                  className="ml-3 px-4 py-1.5 btn-primary text-sm"
                >
                  {t('nav.login')}
                </NavLink>
              )}
            </nav>

            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-700/50"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              </button>
              <button
                className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-700/50"
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
          </div>

          {mobileMenuOpen && (
            <>
              <div className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40 backdrop-blur-sm md:hidden" onClick={() => setMobileMenuOpen(false)} />
              <nav className="fixed right-0 top-0 bottom-0 z-50 w-72 bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl shadow-elevated md:hidden animate-slide-in-right overflow-y-auto">
                <div className="p-4 flex items-center justify-between border-b border-gray-200/60 dark:border-gray-700/50">
                  <span className="text-sm font-semibold text-gradient">SmileX Dict</span>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="p-3 space-y-0.5">
                  {navLinks.map(link => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      end={link.to === '/'}
                      className={({isActive}) =>
                        `block px-4 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                          isActive
                            ? 'bg-brand-500/10 dark:bg-brand-400/15 text-brand-600 dark:text-brand-400 font-medium'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-700/50'
                        }`
                      }
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.label}
                    </NavLink>
                  ))}
                </div>
                <div className="mx-3 border-t border-gray-200/60 dark:border-gray-700/50" />
                <div className="p-3 space-y-0.5">
                  <button
                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                      mobileMoreMenuOpen
                        ? 'bg-gray-100 dark:bg-gray-700/70 text-gray-900 dark:text-gray-200'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-700/50'
                    }`}
                    onClick={() => setMobileMoreMenuOpen(!mobileMoreMenuOpen)}
                  >
                    {t('nav.more')}
                    <svg
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${mobileMoreMenuOpen ? 'rotate-180' : ''}`}
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  {mobileMoreMenuOpen && (
                    <div className="pl-3 space-y-0.5 animate-slide-down">
                      {moreItems.map(item => (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          onClick={() => {
                            setMobileMoreMenuOpen(false)
                            setMobileMenuOpen(false)
                          }}
                          className={({isActive}) =>
                            `block px-4 py-2 rounded-xl text-sm transition-all duration-200 ${
                              isActive
                                ? 'bg-brand-500/10 dark:bg-brand-400/15 text-brand-600 dark:text-brand-400'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-700/50'
                            }`
                          }
                        >
                          {item.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
                {isAuthenticated ? (
                  <>
                    <div className="mx-3 border-t border-gray-200/60 dark:border-gray-700/50" />
                    <div className="p-3 space-y-0.5">
                      <div className="flex items-center gap-3 px-4 py-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center text-white text-sm font-bold ring-2 ring-brand-500/20">
                          {user?.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{user?.username}</span>
                      </div>
                      {userMenuItems.map((item, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setMobileUserMenuOpen(false)
                            setMobileMenuOpen(false)
                            if (item.action) item.action()
                          }}
                          className="block w-full px-4 py-2.5 text-left text-sm rounded-xl transition-all duration-200 text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200"
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
                  </>
                ) : (
                  <>
                    <div className="mx-3 border-t border-gray-200/60 dark:border-gray-700/50" />
                    <div className="p-3">
                      <NavLink
                        to="/login"
                        state={{ from: location.pathname }}
                        className="block px-4 py-2.5 text-center btn-primary text-sm"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {t('nav.login')}
                      </NavLink>
                    </div>
                  </>
                )}
              </nav>
            </>
          )}
        </header>
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
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
              <Route path="/settings" element={isAuthenticated ? <Settings /> : <Navigate to="/login" state={{ from: '/settings' }} replace />} />
              <Route path="/vocab-analysis" element={isAuthenticated ? <VocabularyAnalysis /> : <Navigate to="/login" state={{ from: '/vocab-analysis' }} replace />} />
              <Route path="/about" element={<About />} />
              <Route path="/study-guide" element={<StudyGuide />} />
              <Route path="/login" element={<Login />} />
            </Routes>
          </ErrorBoundary>
        </main>
      </div>
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </ToastProvider>
  )
}

export default App

import { Routes, Route, NavLink } from 'react-router-dom'
import Home from './routes/Home'
import Dicts from './routes/Dicts'
import Panel from './routes/Panel'
import Library from './routes/Library'
import LibraryAdd from './routes/LibraryAdd'
import PracticeWords from './routes/PracticeWords'
import PracticeArticles from './routes/PracticeArticles'
import About from './routes/About'

function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-10 bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/smilex.svg" alt="SmileX" className="w-6 h-6" />
            <h1 className="text-xl font-semibold">SmileX Dict</h1>
          </div>
          <nav className="flex gap-3 text-sm">
            <NavLink to="/" className={({isActive}) => `px-2 py-1 rounded ${isActive? 'bg-brand-100 text-brand-700':'hover:bg-gray-100'}`}>主页</NavLink>
            <NavLink to="/panel" className={({isActive}) => `px-2 py-1 rounded ${isActive? 'bg-brand-100 text-brand-700':'hover:bg-gray-100'}`}>面板</NavLink>
            <NavLink to="/dicts" className={({isActive}) => `px-2 py-1 rounded ${isActive? 'bg-brand-100 text-brand-700':'hover:bg-gray-100'}`}>词典</NavLink>
            <NavLink to="/library" className={({isActive}) => `px-2 py-1 rounded ${isActive? 'bg-brand-100 text-brand-700':'hover:bg-gray-100'}`}>书籍</NavLink>
            <NavLink to="/about" className={({isActive}) => `px-2 py-1 rounded ${isActive? 'bg-brand-100 text-brand-700':'hover:bg-gray-100'}`}>关于</NavLink>
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dicts" element={<Dicts />} />
          <Route path="/panel" element={<Panel />} />
          <Route path="/library" element={<Library />} />
          <Route path="/library/new" element={<LibraryAdd />} />
          <Route path="/practice/words" element={<PracticeWords />} />
          <Route path="/practice/articles" element={<PracticeArticles />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
    </div>
  )
}

export default App

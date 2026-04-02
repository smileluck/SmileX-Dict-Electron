import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { setAuth } from '../features/auth/authSlice'
import { authApi } from '../services/api'
import { useToast } from '../components/Toast'

type Tab = 'login' | 'register'

export default function Login() {
  const [tab, setTab] = useState<Tab>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useToast()

  // Get the page user came from, default to home
  const from = (location.state as { from?: string })?.from || '/'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (username.length < 3 || username.length > 32) {
      showToast('用户名需要 3-32 个字符', 'error')
      return
    }
    if (password.length < 6 || password.length > 64) {
      showToast('密码需要 6-64 个字符', 'error')
      return
    }

    setLoading(true)
    try {
      const result = tab === 'login'
        ? await authApi.login(username, password)
        : await authApi.register(username, password)

      dispatch(setAuth({ token: result.access_token, user: result.user }))
      showToast(tab === 'login' ? '登录成功' : '注册成功', 'success')
      navigate(from, { replace: true })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '操作失败'
      showToast(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto page-enter">
      <div className="rounded-xl border bg-white p-6">
        <div className="flex items-center gap-2 mb-6">
          <img src="/smilex.svg" alt="SmileX" className="w-8 h-8" />
          <h2 className="text-xl font-semibold">
            {tab === 'login' ? '登录' : '注册'} SmileX Dict
          </h2>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b mb-6">
          <button
            className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === 'login'
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setTab('login')}
          >
            登录
          </button>
          <button
            className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === 'register'
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setTab('register')}
          >
            注册
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              用户名
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="3-32 个字符"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              autoComplete="username"
              required
              minLength={3}
              maxLength={32}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="6-64 个字符"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
              required
              minLength={6}
              maxLength={64}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-brand-500 text-white rounded-lg font-medium text-sm hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '请稍候...' : tab === 'login' ? '登录' : '注册'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-gray-500">
          {tab === 'login' ? (
            <>还没有账号？<button className="text-brand-500 hover:underline" onClick={() => setTab('register')}>立即注册</button></>
          ) : (
            <>已有账号？<button className="text-brand-500 hover:underline" onClick={() => setTab('login')}>去登录</button></>
          )}
        </p>
      </div>
    </div>
  )
}

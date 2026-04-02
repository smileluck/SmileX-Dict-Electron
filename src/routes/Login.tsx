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

  const validatePassword = (pwd: string): { valid: boolean; message?: string } => {
    if (pwd.length < 8 || pwd.length > 64) {
      return { valid: false, message: '密码需要 8-64 个字符' }
    }
    if (!/[A-Z]/.test(pwd)) {
      return { valid: false, message: '密码需要包含大写字母' }
    }
    if (!/[a-z]/.test(pwd)) {
      return { valid: false, message: '密码需要包含小写字母' }
    }
    if (!/[0-9]/.test(pwd)) {
      return { valid: false, message: '密码需要包含数字' }
    }
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>/?'
    const hasSpecialChar = new RegExp(`[${specialChars}]`)
    if (!hasSpecialChar.test(pwd)) {
      return { valid: false, message: '密码需要包含特殊字符' }
    }
    return { valid: true }
  }

  const getPasswordStrength = (pwd: string): { score: number; label: string; color: string } => {
    if (pwd.length === 0) {
      return { score: 0, label: '', color: '' }
    }

    let score = 0
    if (pwd.length >= 8) score += 20
    if (pwd.length >= 12) score += 20
    if (/[A-Z]/.test(pwd)) score += 20
    if (/[a-z]/.test(pwd)) score += 20
    if (/[0-9]/.test(pwd)) score += 20
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>/?'
    const hasSpecialChar = new RegExp(`[${specialChars}]`)
    if (hasSpecialChar.test(pwd)) score += 20

    if (score < 40) {
      return { score, label: '弱', color: 'bg-red-500' }
    } else if (score < 60) {
      return { score, label: '中', color: 'bg-yellow-500' }
    } else if (score < 80) {
      return { score, label: '良', color: 'bg-blue-500' }
    } else {
      return { score, label: '强', color: 'bg-green-500' }
    }
  }

  const passwordStrength = getPasswordStrength(password)

  const passwordRequirements = [
    { id: 'length', label: '8-64 个字符', check: password.length >= 8 },
    { id: 'upper', label: '大写字母', check: /[A-Z]/.test(password) },
    { id: 'lower', label: '小写字母', check: /[a-z]/.test(password) },
    { id: 'number', label: '数字', check: /[0-9]/.test(password) },
    { id: 'special', label: '特殊字符', check: /[!@#$%^&*()_+\-=\\[\]{};':"\\|,.<>\\/?]/.test(password) },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (username.length < 3 || username.length > 32) {
      showToast('用户名需要 3-32 个字符', 'error')
      return
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      showToast(passwordValidation.message || '密码格式不正确', 'error')
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
              placeholder="8-64 个字符"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
              required
              minLength={8}
              maxLength={64}
            />

            {tab === 'login' && (
              <p className="mt-1 text-xs text-gray-500">
                密码要求：8-64个字符，包含大小写字母、数字和特殊字符
              </p>
            )}

            {tab === 'register' && password.length > 0 && (
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${passwordStrength.score}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-600 w-12">
                    {passwordStrength.label || '密码强度'}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                  {passwordRequirements.map(req => (
                    <div
                      key={req.id}
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded transition-colors ${
                        req.check
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-gray-50 text-gray-500 border border-gray-200'
                      }`}
                    >
                      <span className={req.check ? 'text-green-600' : 'text-gray-400'}>
                        {req.check ? '✓' : '○'}
                      </span>
                      <span>{req.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
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

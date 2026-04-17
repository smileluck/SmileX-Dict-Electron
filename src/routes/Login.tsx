import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { setAuth, loadUserDicts } from '../features/auth/authSlice'
import { authApi } from '../services/api'
import { useToast } from '../components/Toast'

type Tab = 'login' | 'register'

export default function Login() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useToast()

  const from = (location.state as { from?: string })?.from || '/'

  const validatePassword = (pwd: string): { valid: boolean; message?: string } => {
    if (pwd.length < 8 || pwd.length > 64) {
      return { valid: false, message: t('login.passwordLengthError') }
    }
    if (!/[A-Z]/.test(pwd)) {
      return { valid: false, message: t('login.passwordUpperError') }
    }
    if (!/[a-z]/.test(pwd)) {
      return { valid: false, message: t('login.passwordLowerError') }
    }
    if (!/[0-9]/.test(pwd)) {
      return { valid: false, message: t('login.passwordNumberError') }
    }
    if (!/[!@#]/.test(pwd)) {
      return { valid: false, message: t('login.passwordSpecialError') }
    }
    if (/[^a-zA-Z0-9!@#]/.test(pwd)) {
      return { valid: false, message: t('login.passwordCharError') }
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
    if (/[!@#]/.test(pwd)) score += 20

    if (score < 40) {
      return { score, label: t('login.strengthWeak'), color: 'bg-red-500' }
    } else if (score < 60) {
      return { score, label: t('login.strengthMedium'), color: 'bg-yellow-500' }
    } else if (score < 80) {
      return { score, label: t('login.strengthGood'), color: 'bg-blue-500' }
    } else {
      return { score, label: t('login.strengthStrong'), color: 'bg-green-500' }
    }
  }

  const passwordStrength = getPasswordStrength(password)

  const passwordRequirements = [
    { id: 'length', label: t('login.reqLength'), check: password.length >= 8 },
    { id: 'upper', label: t('login.reqUpper'), check: /[A-Z]/.test(password) },
    { id: 'lower', label: t('login.reqLower'), check: /[a-z]/.test(password) },
    { id: 'number', label: t('login.reqNumber'), check: /[0-9]/.test(password) },
    { id: 'special', label: t('login.reqSpecial'), check: /[!@#]/.test(password) },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (username.length < 3 || username.length > 32) {
      showToast(t('login.usernameLengthError'), 'error')
      return
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      showToast(passwordValidation.message || t('login.passwordFormatError'), 'error')
      return
    }

    setLoading(true)
    try {
      const result = tab === 'login'
        ? await authApi.login(username, password)
        : await authApi.register(username, password)

      dispatch(setAuth({ token: result.access_token, user: result.user }))
      dispatch(loadUserDicts())
      showToast(tab === 'login' ? t('login.loginSuccess') : t('login.registerSuccess'), 'success')
      navigate(from, { replace: true })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('login.operationFailed')
      showToast(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto page-enter">
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow">
            <img src="/smilex.svg" alt="SmileX" className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {tab === 'login' ? t('login.login') : t('login.register')} SmileX Dict
          </h2>
        </div>

        <div className={`flex border-b mb-6 border-gray-200 dark:border-gray-700`}>
          <button
            className={`flex-1 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === 'login'
                ? 'border-brand-500 dark:border-brand-400 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            onClick={() => setTab('login')}
          >
            {t('login.login')}
          </button>
          <button
            className={`flex-1 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === 'register'
                ? 'border-brand-500 dark:border-brand-400 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            onClick={() => setTab('register')}
          >
            {t('login.register')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('login.username')}
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder={t('login.usernamePlaceholder')}
              className="input-glass"
              autoComplete="username"
              required
              minLength={3}
              maxLength={32}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('login.password')}
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={t('login.passwordPlaceholder')}
              className="input-glass"
              autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
              required
              minLength={8}
              maxLength={64}
            />

            {tab === 'login' && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {t('login.passwordRequirements')}
              </p>
            )}

            {tab === 'register' && password.length > 0 && (
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${passwordStrength.score}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300 w-12">
                    {passwordStrength.label || t('login.passwordStrength')}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                  {passwordRequirements.map(req => (
                    <div
                      key={req.id}
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded transition-colors ${
                        req.check
                          ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                          : 'bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      <span className={req.check ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}>
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
            className="btn-primary w-full py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t('login.pleaseWait') : tab === 'login' ? t('login.login') : t('login.register')}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
          {tab === 'login' ? (
            <>{t('login.noAccount')}<button className="text-brand-500 dark:text-brand-400 hover:underline" onClick={() => setTab('register')}>{t('login.registerNow')}</button></>
          ) : (
            <>{t('login.hasAccount')}<button className="text-brand-500 dark:text-brand-400 hover:underline" onClick={() => setTab('login')}>{t('login.goLogin')}</button></>
          )}
        </p>
      </div>
    </div>
  )
}

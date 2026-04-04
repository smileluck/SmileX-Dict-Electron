import { API_BASE } from '../config'
import { ApiError } from './ApiError'

// Re-export ApiError for consumers
export { ApiError }

// Token management
const TOKEN_KEY = 'smilex_dict_token'
const TOKEN_EXPIRY_KEY = 'smilex_dict_token_expiry'
const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

function setToken(token: string): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(TOKEN_EXPIRY_KEY)
  }
}

function setTokenExpiry(expiresAt: number): void {
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiresAt.toString())
}

function isTokenExpired(): boolean {
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY)
  if (!expiry) return false
  return Date.now() > parseInt(expiry, 10)
}

function clearAuthStorage(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(TOKEN_EXPIRY_KEY)
}

// Request options interface
interface RequestOptions {
  method?: string
  body?: unknown
  headers?: Record<string, string>
}

// Core request function with auth token injection
async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers: extraHeaders } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  }

  // Inject auth token if available
  const token = getToken()
  if (token && !isTokenExpired()) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const config: RequestInit = {
    method,
    headers,
  }

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body)
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config)
    if (!response.ok) {
      let errorMessage = `API Error: ${response.status} ${response.statusText}`
      try {
        const errorData = await response.json()
        if (errorData.detail) {
          errorMessage = errorData.detail
        }
      } catch {
        // If parsing error response fails, use default message
      }
      throw new ApiError(errorMessage, response.status)
    }
    return await response.json() as T
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    console.warn(`API request failed: ${endpoint}`, error)
    throw new ApiError('网络请求失败，请检查服务器连接', 0)
  }
}

// Auth types
export interface AuthUser {
  id: string
  username: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: AuthUser
}

// Auth API
export const authApi = {
  register: async (username: string, password: string): Promise<AuthResponse> => {
    const result = await request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: { username, password },
    })
    setToken(result.access_token)
    setTokenExpiry(Date.now() + TOKEN_EXPIRY_MS)
    return result
  },
  login: async (username: string, password: string): Promise<AuthResponse> => {
    const result = await request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: { username, password },
    })
    setToken(result.access_token)
    setTokenExpiry(Date.now() + TOKEN_EXPIRY_MS)
    return result
  },
  getMe: async (): Promise<AuthUser> => {
    const token = getToken()
    if (!token) {
      throw new ApiError('Not authenticated', 0)
    }
    return await request<AuthUser>('/api/auth/me')
  },
  logout: () => {
    clearAuthStorage()
  },
}

// Stats API
export interface DailyStat {
  date: string
  newCount: number
  reviewCount: number
  dictationCount: number
  wrongCount: number
}

export interface StatEvent {
  type: 'new' | 'review' | 'dictation' | 'wrong'
}

export const statsApi = {
  getToday: () => request<DailyStat>('/api/stats/today'),
  getHistory: (days: number = 7) => request<DailyStat[]>(`/api/stats/history?days=${days}`),
  addEvent: (event: StatEvent) => request<DailyStat>('/api/stats/event', { method: 'POST', body: event }),
}

// Articles API
export type ArticleType = 'article' | 'book'

export interface ArticleItem {
  id: string
  title: string
  content: string
  contentZh?: string
  type: ArticleType
}

export const articlesApi = {
  list: () => request<ArticleItem[]>('/api/articles'),
  create: (data: Omit<ArticleItem, 'id'>) => request<ArticleItem>('/api/articles', { method: 'POST', body: data }),
  delete: (id: string) => request<void>(`/api/articles/${id}`, { method: 'DELETE' }),
}

// Dicts API
export interface DictItem {
  id: string
  name: string
  wordCount: number
  source: string
}

export const dictsApi = {
  list: () => request<DictItem[]>('/api/dicts'),
  create: (data: { name: string; wordCount?: number }) => request<DictItem>('/api/dicts', { method: 'POST', body: data }),
  update: (id: string, data: { name?: string }) => request<DictItem>(`/api/dicts/${id}`, { method: 'PUT', body: data }),
  delete: (id: string) => request<void>(`/api/dicts/${id}`, { method: 'DELETE' }),
}

// Words API
export interface WordItem {
  id: string
  term: string
  ipa?: string
  meaning: string
  enMeaning?: string
  example?: string
  synonyms: string[]
  synonymsNote?: string
  status: string
  dictId?: string
}

export const wordsApi = {
  list: (dictId?: string) => request<WordItem[]>('/api/words' + (dictId ? `?dictId=${dictId}` : '')),
  create: (data: WordItem) => request<WordItem>('/api/words', { method: 'POST', body: data }),
  update: (id: string, data: Partial<WordItem>) => request<WordItem>(`/api/words/${id}`, { method: 'PUT', body: data }),
  delete: (id: string) => request<void>(`/api/words/${id}`, { method: 'DELETE' }),
  bulkCreate: (words: WordItem[]) => request<WordItem[]>('/api/words/bulk', { method: 'POST', body: words }),
  search: (query: string) => request<WordItem[]>(`/api/words/search?q=${encodeURIComponent(query)}`),
}

// Settings API

export interface UserSettings {
  userId: string
  username: string
  dailyNewWordTarget: number
}

export const settingsApi = {
  get: () => request<UserSettings>('/api/settings'),
  update: (data: Partial<Omit<UserSettings, 'userId'>>) => request<UserSettings>('/api/settings', {
    method: 'PUT',
    body: data
  })
}

export const dataApi = {
  exportAll: () => request<Record<string, unknown>>('/api/export'),
  importAll: (data: Record<string, unknown>) => request<void>('/api/import', { method: 'POST', body: data }),
}

// Word Lookup API (Online Dictionary)
export interface WordLookupResult {
  term: string
  ipa?: string
  phonetic_uk?: string
  phonetic_us?: string
  meaning: string
  en_meaning?: string
  examples: string[]
  phrases: string[]
  synonyms: string[]
  grammar: string[]
}

export const lookupApi = {
  /** 在线查词 */
  lookup: (q: string, save = false, dictId?: string) =>
    request<WordLookupResult>(`/api/words/lookup?q=${encodeURIComponent(q)}&save=${save}${dictId ? `&dictId=${dictId}` : ''}`),
}

// TXT Import API
export interface ImportTaskInfo {
  id: string
  status: 'running' | 'completed' | 'failed'
  total: number
  current: number
  current_word: string
  imported: number
  failed: number
  skipped: number
  error: string | null
  dict_id: string
  started_at: string
}

export interface QuickImportResult {
  imported: number
  skipped: number
  total: number
  detail: string
}

export const importApi = {
  /** 上传TXT文件后台批量导入（异步，从有道爬取释义） */
  importTxt: (file: File, dictId: string) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('dictId', dictId)
    const token = getToken()
    return fetch(`${API_BASE}/api/import/txt`, {
      method: 'POST',
      headers: token && !isTokenExpired() ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }))
        throw new ApiError(data.detail || `HTTP ${res.status}`, res.status)
      }
      return res.json() as Promise<{ task_id: string; total: number; detail: string }>
    })
  },

  /** 快速导入TXT（同步，仅导入单词文本，不爬取释义） */
  quickImportTxt: (file: File, dictId: string) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('dictId', dictId)
    const token = getToken()
    return fetch(`${API_BASE}/api/import/quick-txt`, {
      method: 'POST',
      headers: token && !isTokenExpired() ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }))
        throw new ApiError(data.detail || `HTTP ${res.status}`, res.status)
      }
      return res.json() as Promise<QuickImportResult>
    })
  },

  /** 查询导入任务进度 */
  getStatus: (taskId: string) =>
    request<ImportTaskInfo>(`/api/import/status?taskId=${taskId}`),
}

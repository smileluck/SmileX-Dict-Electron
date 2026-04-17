# SmileX Dict 系统架构设计文档 (PRD)

## 1. 产品概述

### 1.1 产品定位
SmileX Dict 是一个多端英语学习应用，核心功能为单词记忆与文章练习。支持三种运行形态：Web/PWA、移动端（Capacitor 封装）、桌面端（Electron 封装）。

### 1.2 目标用户
需要系统化背诵英语单词、练习英语文章输入的学习者。

### 1.3 核心价值
- 多端统一体验：一套 React 前端代码覆盖 Web / iOS / Android / Desktop
- 科学练习模式：打字拼写 + 快速确认 + 文章跟打，错词自动归集
- 在线查词集成：有道词典 API，查词结果可保存至自建词典

---

## 2. 系统架构总览

```
┌─────────────────────────────────────────────────────────────┐
│                     客户端 (Client Layer)                     │
│                                                              │
│  ┌──────────┐   ┌──────────────┐   ┌──────────────────────┐ │
│  │  Web/PWA │   │ Electron App │   │ Capacitor Mobile App │ │
│  │ (Browser)│   │  (Desktop)   │   │   (iOS / Android)    │ │
│  └────┬─────┘   └──────┬───────┘   └──────────┬───────────┘ │
│       │                │                      │              │
│  ┌────┴────────────────┴──────────────────────┴───────────┐  │
│  │              React SPA (Vite Build)                     │  │
│  │  ┌─────────┐ ┌─────────┐ ┌──────┐ ┌────┐ ┌──────────┐ │  │
│  │  │ Routes  │ │Features │ │Store │ │i18n│ │Components│ │  │
│  │  │ (Pages) │ │ (Slices)│ │(RDX) │ │    │ │  (UI)    │ │  │
│  │  └─────────┘ └─────────┘ └──────┘ └────┘ └──────────┘ │  │
│  └────────────────────────┬───────────────────────────────┘  │
│                           │ HTTP / fetch API                  │
└───────────────────────────┼──────────────────────────────────┘
                            │
┌───────────────────────────┼──────────────────────────────────┐
│                     服务端 (Server Layer)                      │
│              Python FastAPI · Port 8001                        │
│  ┌────────────────────────┴───────────────────────────────┐  │
│  │                    Middleware Stack                      │  │
│  │     CORS → RateLimit → RequestLogging → SecurityHeaders │  │
│  └────────────────────────┬───────────────────────────────┘  │
│  ┌────────────────────────┴───────────────────────────────┐  │
│  │                   Router Layer (REST API)                │  │
│  │  auth │ dicts │ words │ articles │ stats │ settings │ … │  │
│  └────────────────────────┬───────────────────────────────┘  │
│  ┌────────────────────────┴───────────────────────────────┐  │
│  │                  Service Layer (Business Logic)          │  │
│  └────────────────────────┬───────────────────────────────┘  │
│  ┌────────────────────────┴───────────────────────────────┐  │
│  │              SQLAlchemy ORM + SQLite (WAL)               │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. 技术栈

### 3.1 前端

| 层面 | 技术选型 | 说明 |
|------|---------|------|
| 框架 | React 19 | 函数组件 + Hooks |
| 构建 | Vite 7 + SWC | 快速 HMR，路径别名 `@` → `src` |
| 状态管理 | Redux Toolkit + redux-persist | 6 个 Slice，whitelist 持久化 |
| 路由 | React Router DOM v7 | 声明式路由，认证守卫 |
| 样式 | Tailwind CSS 3 | 工具类优先，自定义 brand 色系 |
| 国际化 | i18next + react-i18next | 中/英双语 (`zh.json` / `en.json`) |
| PWA | vite-plugin-pwa + Workbox | 自动注册 SW，离线缓存 |
| 桌面端 | Electron 41 | safeStorage 加密 Token，contextBridge IPC |
| 移动端 | Capacitor 7 | 原生 WebView 封装 |

### 3.2 后端

| 层面 | 技术选型 | 说明 |
|------|---------|------|
| 框架 | FastAPI | 异步 ASGI，自动 Swagger 文档 |
| ORM | SQLAlchemy 2 (future mode) | DeclarativeBase，手动 Session 管理 |
| 数据库 | SQLite (WAL 模式) | 单文件，PRAGMA 优化 |
| 认证 | JWT (python-jose + passlib/bcrypt) | Bearer Token，7 天有效期 |
| 校验 | Pydantic v2 + pydantic-settings | Schema 序列化/反序列化 + 环境变量 |
| 运行 | Uvicorn | ASGI Server，端口 8001 |

---

## 4. 前端架构

### 4.1 目录结构

```
src/
├── main.tsx                  # 应用入口，挂载 Redux + PersistGate + Router
├── App.tsx                   # 根组件：导航栏、路由表、认证恢复、搜索弹窗
├── config.ts                 # API_BASE 配置（环境变量 or 空）
│
├── routes/                   # 页面级路由组件（15 个页面）
│   ├── Home.tsx              # 首页 /
│   ├── Login.tsx             # 登录/注册 /login
│   ├── Dicts.tsx             # 词典中心 /dicts
│   ├── Panel.tsx             # 学习面板 /panel        [需认证]
│   ├── Library.tsx           # 书籍/文章库 /library
│   ├── LibraryAdd.tsx        # 添加文章 /library/new  [需认证]
│   ├── PracticeWords.tsx     # 单词练习 /practice/words       [需认证]
│   ├── PracticeArticles.tsx  # 文章练习 /practice/articles    [需认证]
│   ├── Collections.tsx       # 收藏夹 /collections            [需认证]
│   ├── WrongWords.tsx        # 错词本 /wrong-words            [需认证]
│   ├── Mastered.tsx          # 已掌握 /mastered               [需认证]
│   ├── Settings.tsx          # 个人设置 /settings              [需认证]
│   ├── VocabularyAnalysis.tsx# 英语专业学习 /vocab-analysis   [需认证]
│   ├── About.tsx             # 关于 /about
│   └── StudyGuide.tsx        # 学习指南 /study-guide
│
├── features/                 # Redux Toolkit Slices（领域状态）
│   ├── auth/                 # 认证状态：token、user、isAuthenticated
│   ├── words/                # 单词状态：练习进度、当前单词
│   ├── articles/             # 文章状态
│   ├── dicts/                # 词典状态：词典列表
│   ├── panel/                # 面板状态：今日统计
│   └── settings/             # 用户设置：每日新词目标
│
├── services/                 # API 通信层
│   ├── api.ts                # 统一请求封装 + Token 管理 + 各模块 API
│   └── ApiError.ts           # 统一错误类
│
├── store/
│   └── index.ts              # configureStore + persistor
│
├── components/               # 通用 UI 组件
│   ├── ErrorBoundary.tsx     # 错误边界
│   ├── Icon.tsx              # 图标组件
│   ├── Loading.tsx           # 加载状态
│   ├── SearchDialog.tsx      # Ctrl+K 全局搜索弹窗
│   ├── SpeakButton.tsx       # TTS 发音按钮
│   ├── Toast.tsx             # 全局 Toast 通知
│   ├── WordList.tsx          # 单词列表组件
│   └── vocabulary/           # 词汇分析相关组件
│
├── hooks/                    # 自定义 Hooks
│   ├── useAppDispatch.ts     # 类型安全的 dispatch
│   └── useTheme.ts           # 主题切换
│
├── utils/                    # 工具函数
│   ├── priorityQueue.ts      # 优先队列（练习调度）
│   └── speech.ts             # Web Speech API 封装
│
├── i18n/                     # 国际化
│   ├── index.ts              # i18next 初始化 + 语言检测
│   └── locales/
│       ├── zh.json           # 中文翻译
│       └── en.json           # 英文翻译
│
└── types/                    # TypeScript 类型声明
    └── electron.d.ts         # Electron API 类型
```

### 4.2 状态管理设计

**Redux Store 结构：**

```
RootState
├── auth          { token, user, isAuthenticated, loading, error, mine[] }
├── words         { 单词练习相关状态 }
├── articles      { 文章练习相关状态 }
├── dicts         { 词典列表、当前词典 }
├── panel         { 今日统计、签到记录 }
└── settings      { dailyNewWordTarget }
```

**持久化策略（redux-persist）：**
- `key`: `smilex-dict`
- `storage`: `localStorage`
- `whitelist`: `['words', 'dicts', 'panel', 'articles', 'settings']`
- `auth` 不在 whitelist 中，每次刷新通过 JWT Token 验证恢复

### 4.3 认证流程

```
┌──────────┐     POST /api/auth/login     ┌──────────┐
│  Login   │ ────────────────────────────→ │  Server  │
│  Page    │ ←──── JWT Token ──────────── │  (FastAPI)│
└────┬─────┘                              └──────────┘
     │
     │  setToken()
     │
     ├── Web/PWA/Capacitor:
     │   localStorage + Cookie 兜底
     │
     └── Electron:
         IPC → safeStorage.encryptString → 文件写入
         userData/auth-token.bin

页面刷新:
  hasToken() → getToken()
    → Electron: IPC 读取 + safeStorage.decryptString
    → Web: localStorage → Cookie 兜底
  → 有效 → dispatch(fetchCurrentUser()) → GET /api/auth/me
  → 无效 → 清除认证状态，重定向到 /login
```

### 4.4 路由与权限

| 路由 | 页面 | 认证 |
|------|------|------|
| `/` | 首页 | 公开 |
| `/dicts` | 词典中心 | 公开 |
| `/library` | 书籍库 | 公开 |
| `/about` | 关于 | 公开 |
| `/study-guide` | 学习指南 | 公开 |
| `/login` | 登录/注册 | 公开 |
| `/panel` | 学习面板 | 需认证 |
| `/practice/words` | 单词练习 | 需认证 |
| `/practice/articles` | 文章练习 | 需认证 |
| `/collections` | 收藏夹 | 需认证 |
| `/wrong-words` | 错词本 | 需认证 |
| `/mastered` | 已掌握 | 需认证 |
| `/settings` | 个人设置 | 需认证 |
| `/vocab-analysis` | 英语专业学习 | 需认证 |
| `/library/new` | 添加文章 | 需认证 |

**认证守卫实现：** 在 `App.tsx` 的 `<Route>` 中，需认证页面使用三元表达式：
```tsx
<Route path="/panel" element={isAuthenticated ? <Panel /> : <Navigate to="/login" state={{ from: '/panel' }} replace />} />
```

### 4.5 API 请求层设计

`src/services/api.ts` 是唯一的 API 通信入口：

- **核心函数 `request<T>()`**: 自动注入 Bearer Token，统一错误处理
- **Token 管理**: 三端适配（Electron safeStorage / localStorage / Cookie）
- **API 模块化导出**: `authApi`, `wordsApi`, `dictsApi`, `articlesApi`, `statsApi`, `settingsApi`, `dataApi`, `lookupApi`, `importApi`
- **开发代理**: Vite 配置 `proxy /api → http://127.0.0.1:8001`

---

## 5. 后端架构

### 5.1 目录结构

```
server/
├── main.py                   # Uvicorn 入口
├── app/
│   ├── main.py               # FastAPI app 工厂函数 create_app()
│   ├── config.py             # pydantic-settings 配置（环境变量 / .env）
│   ├── database.py           # SQLAlchemy engine + SessionLocal + PRAGMA 优化
│   ├── dependencies.py       # FastAPI 依赖注入（get_db, get_current_user）
│   ├── logging_config.py     # 日志配置
│   │
│   ├── models/               # SQLAlchemy ORM 模型
│   │   ├── user.py           # UserModel (id, username, hashed_password)
│   │   ├── dict.py           # DictModel
│   │   ├── word.py           # WordModel
│   │   ├── word_meaning.py   # WordMeaningModel
│   │   ├── word_example.py   # WordExampleModel
│   │   ├── word_phrase.py    # WordPhraseModel
│   │   ├── word_grammar.py   # WordGrammarModel
│   │   ├── dict_word.py      # DictWordModel (词典-单词关联)
│   │   ├── article.py        # ArticleModel
│   │   ├── stat.py           # StatModel (学习统计)
│   │   ├── settings.py       # SettingsModel
│   │   └── user_word_progress.py  # UserWordProgressModel
│   │
│   ├── schemas/              # Pydantic Schema（请求/响应模型）
│   │   ├── auth.py
│   │   ├── dict.py
│   │   ├── word.py
│   │   ├── article.py
│   │   ├── stat.py
│   │   ├── settings.py
│   │   ├── learning.py
│   │   └── common.py
│   │
│   ├── services/             # 业务逻辑层
│   │   ├── auth_service.py   # 密码哈希、Token 生成/验证
│   │   ├── word_service.py   # 单词 CRUD + 搜索
│   │   ├── dict_service.py   # 词典 CRUD
│   │   ├── article_service.py# 文章 CRUD
│   │   ├── stat_service.py   # 学习统计
│   │   ├── lookup_service.py # 有道词典 API 集成
│   │   ├── import_service.py # TXT 导入（异步任务 + 快速导入）
│   │   ├── learning_service.py# 学习进度管理
│   │   └── settings_service.py# 用户设置
│   │
│   ├── routers/              # API 路由层
│   │   ├── auth.py           # /api/auth/*
│   │   ├── dicts.py          # /api/dicts/*
│   │   ├── words.py          # /api/words/*
│   │   ├── articles.py       # /api/articles/*
│   │   ├── stats.py          # /api/stats/*
│   │   ├── settings.py       # /api/settings/*
│   │   ├── data.py           # /api/export, /api/import
│   │   └── health.py         # /api/health
│   │
│   ├── middleware/            # 中间件
│   │   ├── __init__.py       # 统一导出
│   │   ├── rate_limit.py     # 请求速率限制 (默认 60次/分钟)
│   │   ├── logging.py        # 请求日志中间件
│   │   ├── error_handler.py  # 全局异常处理
│   │   └── security_headers  # 安全响应头
│   │
│   └── utils/                # 工具函数
│
├── migrations/               # 数据库迁移脚本
├── tests/                    # 测试
├── data/                     # SQLite 数据文件
└── logs/                     # 应用日志
```

### 5.2 分层架构

```
Request
  │
  ▼
┌─────────────────────────┐
│   Middleware Stack       │  CORS → SecurityHeaders → RateLimit → RequestLogging
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│   Router Layer          │  URL 路由分发，参数校验，依赖注入
│   (routers/*.py)        │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│   Service Layer         │  业务逻辑，跨表操作，外部 API 调用
│   (services/*.py)       │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│   Model Layer           │  SQLAlchemy ORM，数据表映射
│   (models/*.py)         │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│   SQLite Database       │  WAL 模式，PRAGMA 优化
│   (data/smilex.db)      │
└─────────────────────────┘
```

### 5.3 数据模型

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│    users     │     │      dicts       │     │    words     │
├──────────────┤     ├──────────────────┤     ├──────────────┤
│ id (PK, UUID)│     │ id (PK, UUID)    │     │ id (PK, UUID)│
│ username     │     │ name             │     │ term         │
│ hashed_pass  │     │ word_count       │     │ ipa          │
│ created_at   │     │ source           │     │ meaning      │
└──────┬───────┘     │ user_id (FK)     │     │ en_meaning   │
       │             └────────┬─────────┘     │ example      │
       │                      │               │ synonyms     │
       │              ┌───────┴──────────┐    │ dict_id (FK) │
       │              │   dict_words     │    │ status       │
       │              ├──────────────────┤    └──────┬───────┘
       │              │ id (PK)          │           │
       │              │ dict_id (FK)     │───────────┘
       │              │ word_id (FK)     │
       │              └──────────────────┘
       │
       │             ┌──────────────────┐
       │             │ user_word_progress│
       │             ├──────────────────┤
       ├────────────→│ id (PK)          │
       │             │ user_id (FK)     │
       │             │ word_id (FK)     │
       │             │ status           │
       │             │ ...              │
       │             └──────────────────┘
       │
       │             ┌──────────────────┐     ┌──────────────┐
       │             │    articles      │     │    stats     │
       │             ├──────────────────┤     ├──────────────┤
       ├────────────→│ id (PK, UUID)    │     │ id (PK)      │
       │             │ title            │     │ date         │
       │             │ content          │     │ user_id (FK) │
       │             │ content_zh       │     │ new_count    │
       │             │ type             │     │ review_count │
       │             │ user_id (FK)     │     │ ...          │
       │             └──────────────────┘     └──────────────┘
       │
       │             ┌──────────────────┐     ┌──────────────┐
       │             │    settings      │     │ word_meanings│
       │             ├──────────────────┤     ├──────────────┤
       └────────────→│ id (PK)          │     │ id (PK)      │
                     │ user_id (FK)     │     │ word_id (FK) │
                     │ daily_new_target │     │ meaning      │
                     └──────────────────┘     │ pos          │
                                              └──────────────┘
```

### 5.4 API 接口清单

| 模块 | 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|------|
| Auth | POST | `/api/auth/register` | 用户注册 | 否 |
| Auth | POST | `/api/auth/login` | 用户登录 | 否 |
| Auth | GET | `/api/auth/me` | 获取当前用户 | 是 |
| Dicts | GET | `/api/dicts` | 词典列表 | 是 |
| Dicts | POST | `/api/dicts` | 创建词典 | 是 |
| Dicts | PUT | `/api/dicts/{id}` | 更新词典 | 是 |
| Dicts | DELETE | `/api/dicts/{id}` | 删除词典 | 是 |
| Words | GET | `/api/words` | 单词列表（可选 dictId 筛选） | 是 |
| Words | POST | `/api/words` | 创建单词 | 是 |
| Words | PUT | `/api/words/{id}` | 更新单词 | 是 |
| Words | DELETE | `/api/words/{id}` | 删除单词 | 是 |
| Words | POST | `/api/words/bulk` | 批量创建单词 | 是 |
| Words | GET | `/api/words/search` | 搜索单词 | 是 |
| Words | GET | `/api/words/lookup` | 在线查词（有道） | 是 |
| Articles | GET | `/api/articles` | 文章列表 | 是 |
| Articles | POST | `/api/articles` | 创建文章 | 是 |
| Articles | DELETE | `/api/articles/{id}` | 删除文章 | 是 |
| Stats | GET | `/api/stats/today` | 今日统计 | 是 |
| Stats | GET | `/api/stats/history` | 历史统计 | 是 |
| Stats | POST | `/api/stats/event` | 记录学习事件 | 是 |
| Settings | GET | `/api/settings` | 获取用户设置 | 是 |
| Settings | PUT | `/api/settings` | 更新用户设置 | 是 |
| Import | POST | `/api/import/txt` | TXT 异步导入 | 是 |
| Import | POST | `/api/import/quick-txt` | TXT 快速导入 | 是 |
| Import | GET | `/api/import/status` | 导入进度查询 | 是 |
| Data | GET | `/api/export` | 导出全部数据 | 是 |
| Data | POST | `/api/import` | 导入全部数据 | 是 |
| Health | GET | `/api/health` | 健康检查 | 否 |

### 5.5 中间件栈（执行顺序）

```
请求 → CORS → SecurityHeaders → RateLimit → RequestLogging → Router → Response
```

- **CORS**: `allow_origins=["*"]`，允许凭证
- **SecurityHeaders**: 注入安全响应头（X-Content-Type-Options, X-Frame-Options 等）
- **RateLimit**: 默认 60 次/分钟/IP
- **RequestLogging**: 记录请求方法、路径、耗时、状态码

### 5.6 数据库优化

SQLite 通过以下 PRAGMA 优化：
- `journal_mode=WAL` — 读写并发
- `synchronous=NORMAL` — 平衡安全与性能
- `foreign_keys=ON` — 启用外键约束
- `busy_timeout=5000` — 锁等待超时 5 秒

---

## 6. 多端适配

### 6.1 三端统一架构

```
                    ┌──────────────────────┐
                    │   React SPA 源码      │
                    │   (src/)              │
                    └───────┬──────────────┘
                            │
                    ┌───────┴──────────────┐
                    │   vite build          │
                    │   → dist/             │
                    └───┬──────┬───────┬───┘
                        │      │       │
              ┌─────────┘      │       └─────────┐
              ▼                ▼                  ▼
      ┌──────────────┐ ┌─────────────┐ ┌──────────────┐
      │   Web/PWA    │ │  Electron   │ │  Capacitor   │
      │   直接部署   │ │  加壳打包   │ │  原生封装    │
      │   (静态托管) │ │  (NSIS/DMG) │ │  (iOS/Android)│
      └──────────────┘ └─────────────┘ └──────────────┘
```

### 6.2 平台差异处理

| 能力 | Web/PWA | Electron | Capacitor |
|------|---------|----------|-----------|
| Token 存储 | localStorage + Cookie | safeStorage 加密文件 | localStorage + Cookie |
| 平台检测 | `window.electronAPI?.isElectron` | `true` | `false` |
| 离线缓存 | Service Worker (Workbox) | 本地文件 | WebView 缓存 |
| 安装形态 | 浏览器 / Add to Home | NSIS (Win) / DMG (Mac) / AppImage (Linux) | App Store / Google Play |
| 窗口管理 | N/A | BrowserWindow + 状态持久化 | 原生窗口 |

### 6.3 Electron 安全模型

```
┌─────────────────────────────────────────────┐
│                  Main Process                │
│  - safeStorage 加密/解密 Token              │
│  - 文件系统读写 Token                       │
│  - 窗口管理、菜单创建                       │
│  - ipcMain.handle() 注册 IPC 处理器          │
└──────────────────┬──────────────────────────┘
                   │ IPC (async invoke)
┌──────────────────┴──────────────────────────┐
│               Preload Script                 │
│  contextBridge.exposeInMainWorld('electronAPI')│
│  - storeToken / getToken / removeToken       │
│  - getAppVersion / getPlatform               │
│  - isElectron: true                          │
└──────────────────┬──────────────────────────┘
                   │ window.electronAPI
┌──────────────────┴──────────────────────────┐
│              Renderer Process (React)         │
│  nodeIntegration: false                      │
│  contextIsolation: true                      │
│  sandbox: true                               │
└──────────────────────────────────────────────┘
```

---

## 7. 核心业务流程

### 7.1 单词练习流程

```
选择词典 → 加载单词列表
    │
    ├── 打字拼写模式
    │   显示：拼写、音标、释义、例句、同义词
    │   用户输入拼写
    │   ├── 正确 → 标记已掌握 → POST /api/stats/event { type: "new" }
    │   └── 错误 → 加入错词本 → POST /api/stats/event { type: "wrong" }
    │
    └── 快速确认模式
        显示单词信息
        用户选择：掌握 / 不掌握 / 下一条
        ├── 掌握 → 已掌握
        └── 不掌握 → 错词本
```

### 7.2 文章练习流程

```
选择文章 → 加载内容
    │
    ├── 打字拼写（逐行）
    │   显示原文一行 + 输入行
    │   实时逐字符校验
    │   错误字符 → 红色标记
    │   全部正确 → 下一行
    │
    └── 阅读模式
        中英文切换（仅英文 / 双语）
        支持切换下一篇
```

### 7.3 在线查词流程

```
用户输入查询词 → GET /api/words/lookup?q=xxx
    │
    服务端调用有道词典 API
    │
    返回：音标、释义、例句、短语、同义词、语法
    │
    用户可选择保存到词典 → save=true&dictId=xxx
```

### 7.4 TXT 导入流程

```
上传 TXT 文件 + dictId
    │
    ├── 异步导入 (POST /api/import/txt)
    │   返回 task_id → 轮询 GET /api/import/status
    │   后台逐行解析 + 在线查词补全信息
    │   批量写入（每 20 条一批）
    │
    └── 快速导入 (POST /api/import/quick-txt)
        同步处理，仅解析单词列表
        不查在线词典，直接入库
        适合已有完整数据的 TXT
```

---

## 8. 安全设计

### 8.1 认证与授权
- JWT Bearer Token，有效期 7 天
- Token 过期自动清除，跳转登录页
- 每次页面加载验证 Token 有效性

### 8.2 密码安全
- bcrypt (4.0.1) 哈希存储
- 超过 72 字节密码自动截断

### 8.3 传输安全
- 生产环境建议 HTTPS
- CORS 配置白名单（开发阶段 `*`）

### 8.4 Electron 安全
- `nodeIntegration: false`
- `contextIsolation: true`
- `sandbox: true`
- Token 通过 `safeStorage` 加密，依赖操作系统密钥管理
- 外部链接在默认浏览器打开，阻止新窗口创建

### 8.5 服务端安全
- 安全响应头中间件
- 请求速率限制（60 次/分钟）
- 生产环境关闭 Swagger 文档
- SECRET_KEY 通过环境变量配置

---

## 9. 性能与可扩展性

### 9.1 前端性能
- Vite + SWC 快速构建与 HMR
- PWA Workbox 缓存静态资源
- redux-persist 减少重复 API 调用
- 优先队列算法调度练习顺序

### 9.2 后端性能
- SQLite WAL 模式支持并发读
- 批量导入分批写入（TXT_IMPORT_BATCH_SIZE=20）
- 异步导入任务不阻塞主线程

### 9.3 扩展方向
- 数据库可迁移至 PostgreSQL（SQLAlchemy ORM 抽象）
- Token 存储可扩展为 Redis
- 文件导入可通过消息队列异步化
- 多节点部署时替换 SQLite

---

## 10. 构建与部署

### 10.1 开发环境

```bash
# 前端
npm install
npm run dev                    # → http://localhost:5173

# 后端
pip install -r server/requirements.txt
python server/main.py          # → http://localhost:8001

# Electron 开发
npm run dev                    # 先启动前端
npm run electron:dev           # 再启动 Electron
```

### 10.2 生产构建

```bash
# Web/PWA
npm run build                  # → dist/

# Electron
npm run electron:build         # → release/
npm run electron:build:win     # Windows NSIS
npm run electron:build:mac     # macOS DMG
npm run electron:build:linux   # Linux AppImage

# Capacitor 移动端
npm run build
npm run cap:sync
npm run cap:open:android       # Android Studio
npm run cap:open:ios           # Xcode
```

### 10.3 环境配置

| 环境变量 | 默认值 | 说明 |
|---------|--------|------|
| `VITE_API_BASE` | `""` (同源) | 前端 API 基地址 |
| `SECRET_KEY` | 内置默认值 | JWT 签名密钥（生产必须修改） |
| `APP_ENV` | `development` | 运行环境 |
| `RATE_LIMIT_PER_MINUTE` | `60` | 速率限制 |
| `MAX_UPLOAD_SIZE_MB` | `5` | 上传文件大小限制 |
| `DATABASE_URL` | `sqlite:///./data/smilex.db` | 数据库连接 |

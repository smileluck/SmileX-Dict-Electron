# SmileX Dict

一个基于 React + Redux + Tailwind + React Router 的多端背单词网站，支持 Web/PWA、移动端（Capacitor）与桌面端（Electron）。

## 功能概览
- 用户认证：注册/登录，JWT 认证保护 API
- 单词练习：跟打/复习/默写三模式，错词自动加入错词本，支持收藏与已掌握管理
- 文章/书籍练习：添加与管理条目，支持跟打与默写
- 词典页面：当前学习词典、今日任务、我的词典（收藏/错词本/已掌握/自建）、推荐词典
- 面板页面：今日学习统计与签到记录
- 关于页面：项目说明
- 在线查词：有道词典集成，支持自动保存
- TXT 批量导入：异步/快速两种模式

## 认证与登录态存储

- 后端使用 JWT Bearer Token 认证，登录/注册后下发 token
- **Electron 桌面端**：使用 `safeStorage` 加密存储 token 至本地文件（`userData/auth-token.bin`），通过 IPC 通信读写，安全性依赖操作系统密钥管理
- **Web/PWA/Capacitor**：token 存储于 `localStorage`，并同步写入 cookie 作为兜底
- 刷新页面时自动验证 token 有效性，恢复登录状态

## 开发运行
- 安装依赖：`npm i`
- 启动前端开发：`npm run dev` 打开 `http://localhost:5173/`
- 启动后端服务：`pip install -r server/requirements.txt && python server/main.py` → `http://localhost:8001`
- 生产构建：`npm run build`
- 预览构建产物：`npm run preview`

## PWA/移动端
- PWA 已接入 `vite-plugin-pwa`
- Capacitor：`npm run build` 后执行 `npm run cap:sync`
  - Android：`npm run cap:add:android`，`npm run cap:open:android`
  - iOS（需 macOS）：`npm run cap:add:ios`，`npm run cap:open:ios`

## 桌面端（Electron）
- 开发：先 `npm run dev`，再 `npm run electron:dev`
- 打包：`npm run electron:build`
- 主进程通过 `safeStorage` 加密存储认证 token，preload 脚本暴露安全 IPC 接口

## 目录结构（关键部分）
- `src/features/*Slice.ts`：状态管理（words/articles/session/dicts/panel/auth/settings）
- `src/routes/*`：页面路由组件（主页/练习/词典/面板/书籍文章/登录/关于）
- `src/components/*`：通用组件（Icon、Toast、SearchDialog、ErrorBoundary 等）
- `src/services/api.ts`：API 请求层与 token 管理（自动适配 Electron/Web 存储）
- `src/types/electron.d.ts`：Electron API 类型声明
- `vite.config.ts`：Vite 配置与 PWA 插件
- `capacitor.config.ts`：Capacitor 配置
- `electron/main.js`：Electron 主进程（菜单、窗口、safeStorage IPC）
- `electron/preload.js`：Electron preload 脚本（contextBridge）
- `server/`：Python 后端（FastAPI + SQLAlchemy + JWT）

## 路由与页面
- 公开页面：主页（`/`）、词典（`/dicts`）、书籍（`/library`）、关于（`/about`）、学习指南（`/study-guide`）
- 需认证页面：面板（`/panel`）、单词练习（`/practice/words`）、文章练习（`/practice/articles`）、收藏（`/collections`）、错词本（`/wrong-words`）、已掌握（`/mastered`）、个人设置（`/settings`）、英语专业学习（`/vocab-analysis`）
- 登录/注册：`/login`

## 练习流程说明
- 单词练习：
  - 信息：拼写、音标、释义、例句、同义词与区别
  - 模式：打字拼写（比对拼写，正确→已掌握，错误→错词本）、快速确认（掌握/不掌握/下一条）
- 文章练习：
  - 打字拼写（逐行）：显示原文一行与输入一行，实时逐字符校验，错误红色标记；正确进入下一行
  - 阅读：中英文切换（可仅英文或双语），支持下一篇

## 管理后台（Python FastAPI）
- 位置：`server/`
- 安装：`pip install -r server/requirements.txt`
- 启动：`python server/main.py` → `http://localhost:8001`
- 接口：
  - `POST /api/auth/register`、`POST /api/auth/login`、`GET /api/auth/me`
  - `GET /api/dicts`、`POST /api/dicts`
  - `GET /api/words?dictId=...`、`POST /api/words`
  - `GET /api/articles`、`POST /api/articles`
  - `GET /api/stats/today`、`POST /api/stats/event`
  - `GET /api/words/lookup?q=...`
  - `POST /api/import/txt`、`POST /api/import/quick-txt`
- 数据库：SQLite，ORM 使用 SQLAlchemy
- 认证：JWT（`python-jose` + `passlib[bcrypt]`）

## 项目结构优化
- 路径别名 `@` 指向 `src`（Vite 与 tsconfig 已配置）
- 模块分层：`routes/`、`features/`、`components/`、`services/`，降低耦合

## 开源协议
本项目采用 Apache License 2.0，详见 `LICENSE` 文件。

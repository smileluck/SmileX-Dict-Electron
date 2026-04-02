const { app, BrowserWindow, Menu, shell, ipcMain, dialog } = require('electron')
const path = require('path')

// Keep a global reference of the window object
let mainWindow = null

// Window state persistence
const windowStateKey = 'window-state'
let windowState = {
  width: 1024,
  height: 768,
  x: undefined,
  y: undefined,
  isMaximized: false,
}

function createMenu() {
  const template = [
    {
      label: '文件',
      submenu: [
        { label: '重新加载', accelerator: 'CmdOrCtrl+R', click: () => mainWindow?.reload() },
        { type: 'separator' },
        { label: '退出', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() },
      ],
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: '重做', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: '复制', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: '粘贴', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: '全选', accelerator: 'CmdOrCtrl+A', role: 'selectAll' },
      ],
    },
    {
      label: '视图',
      submenu: [
        { label: '重新加载', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: '强制重新加载', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
        { type: 'separator' },
        { label: '放大', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: '缩小', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { label: '重置缩放', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { type: 'separator' },
        { label: '全屏', accelerator: 'F11', role: 'togglefullscreen' },
        { type: 'separator' },
        { label: '开发者工具', accelerator: 'F12', role: 'toggleDevTools' },
      ],
    },
    {
      label: '窗口',
      submenu: [
        { label: '最小化', accelerator: 'CmdOrCtrl+M', role: 'minimize' },
        { label: '关闭', role: 'close' },
      ],
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于 SmileX Dict',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: '关于 SmileX Dict',
              message: 'SmileX Dict v' + app.getVersion(),
              detail: '一个基于 React + Redux + Tailwind 的多端背单词与文章练习应用。\n\n支持 Web/PWA、移动端（Capacitor）与桌面端（Electron）。',
            })
          },
        },
        { type: 'separator' },
        {
          label: '项目主页',
          click: () => shell.openExternal('https://github.com/smilex/smilex-dict'),
        },
      ],
    },
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.js')

  mainWindow = new BrowserWindow({
    width: windowState.width,
    height: windowState.height,
    x: windowState.x,
    y: windowState.y,
    minWidth: 640,
    minHeight: 480,
    show: false, // Show when ready to prevent visual flash
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
    // Custom title bar styles
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    // Window icon
    icon: path.join(__dirname, '../public/smilex.svg'),
  })

  // Restore maximized state
  if (windowState.isMaximized) {
    mainWindow.maximize()
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // Load the app
  const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173/'
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL(devServerUrl)
    // Open DevTools in development
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // Save window state on close
  mainWindow.on('close', () => {
    if (mainWindow) {
      const bounds = mainWindow.getBounds()
      windowState = {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        isMaximized: mainWindow.isMaximized(),
      }
    }
  })

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

// IPC handlers
ipcMain.handle('get-app-version', () => {
  return app.getVersion()
})

ipcMain.handle('get-platform', () => {
  return process.platform
})

// App lifecycle
app.whenReady().then(() => {
  createMenu()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    } else {
      mainWindow?.show()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event) => {
    event.preventDefault()
  })
})

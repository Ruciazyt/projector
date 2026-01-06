import { app, shell, BrowserWindow, Tray, Menu, nativeImage } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { registerIpcHandlers } from './core/ipc-handlers'
import { loadSettings } from './core/storage'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false

/**
 * 创建系统托盘
 */
function createTray(): void {
  const iconPath =
    process.env.NODE_ENV === 'development'
      ? join(app.getAppPath(), 'resources')
      : join(__dirname, '../../resources')

  // 使用与窗口相同的图标策略
  const icon =
    process.platform === 'win32' ? join(iconPath, 'manager.ico') : join(iconPath, 'icon.png')

  // 创建托盘图标 (使用 nativeImage 可以更好地处理不同 DPI)
  const trayIcon = nativeImage.createFromPath(icon)
  tray = new Tray(trayIcon)

  // 设置托盘提示
  tray.setToolTip('Projector')

  // 创建上下文菜单
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示 Projector',
      click: (): void => {
        mainWindow?.show()
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: (): void => {
        isQuitting = true
        app.quit()
      }
    }
  ])

  // 设置托盘菜单
  tray.setContextMenu(contextMenu)

  // 点击托盘图标显示/隐藏窗口
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        if (mainWindow.isFocused()) {
          mainWindow.hide()
        } else {
          mainWindow.show()
          mainWindow.focus()
        }
      } else {
        mainWindow.show()
        mainWindow.focus()
      }
    }
  })
}

/**
 * 创建主窗口
 */
function createWindow(): void {
  const settings = loadSettings()
  const theme = settings.theme || 'dark'
  const titleBarOverlay =
    process.platform !== 'darwin'
      ? {
          color: theme === 'dark' ? '#15141a' : '#fafaf9',
          symbolColor: theme === 'dark' ? '#ffffff' : '#000000',
          height: 30
        }
      : undefined

  const iconPath =
    process.env.NODE_ENV === 'development'
      ? join(app.getAppPath(), 'resources')
      : join(__dirname, '../../resources')

  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    title: 'Projector',
    ...(process.platform === 'linux' ? { icon: join(iconPath, 'icon.png') } : {}),
    ...(process.platform === 'win32' ? { icon: join(iconPath, 'manager.ico') } : {}),
    titleBarStyle: 'hidden',
    ...(titleBarOverlay ? { titleBarOverlay } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  // 处理窗口关闭事件（最小化到托盘）
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      mainWindow?.hide()
      return false
    }
    return true
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron.app')

  // 在创建窗口前注册 IPC handlers
  // IPC handlers 不依赖窗口，应该在应用启动时就准备好
  registerIpcHandlers()

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()
  createTray()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // 如果不是在退出状态（即只是所有窗口关闭/隐藏），不要退出应用
    // 因为我们需要托盘图标保持运行
    // app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { existsSync, readdirSync, statSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { spawn } from 'child_process'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import type { Project } from './types'

// 项目数据存储路径
function getProjectsFilePath(): string {
  const userDataPath = app.getPath('userData')
  return join(userDataPath, 'projects.json')
}

// 加载项目列表
function loadProjects(): Project[] {
  const filePath = getProjectsFilePath()
  try {
    if (existsSync(filePath)) {
      const data = readFileSync(filePath, 'utf-8')
      return JSON.parse(data) as Project[]
    }
  } catch (error) {
    console.error('Failed to load projects:', error)
  }
  return []
}

// 保存项目列表
function saveProjects(projects: Project[]): void {
  const filePath = getProjectsFilePath()
  try {
    const dir = join(filePath, '..')
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
    writeFileSync(filePath, JSON.stringify(projects, null, 2), 'utf-8')
  } catch (error) {
    console.error('Failed to save projects:', error)
  }
}

// 编辑器配置文件标识
const EDITOR_CONFIG_FILES = [
  '.vscode',
  '.cursor',
  '.idea',
  '.sublime-project',
  '.sublime-workspace',
  '.vimrc',
  '.vim',
  '.emacs',
  '.emacs.d',
  '.project',
  '.classpath'
]

// 检查目录是否包含编辑器配置文件
function isProjectDirectory(dirPath: string): boolean {
  try {
    if (!existsSync(dirPath)) {
      return false
    }
    const stats = statSync(dirPath)
    if (!stats.isDirectory()) {
      return false
    }
    const files = readdirSync(dirPath, { withFileTypes: true })
    return files.some((file) => {
      const name = file.name
      return EDITOR_CONFIG_FILES.some((config) => {
        return name === config
      })
    })
  } catch (error) {
    console.error(`Error checking directory ${dirPath}:`, error)
    return false
  }
}

// 生成项目ID
function generateProjectId(path: string): string {
  return `${Date.now()}-${Buffer.from(path).toString('base64').slice(0, 8)}`
}

// 从路径生成项目名称
function generateProjectName(path: string): string {
  const pathParts = path.split(/[/\\]/)
  return pathParts[pathParts.length - 1] || 'Untitled Project'
}

// 递归扫描目录查找项目
async function scanForProjects(rootPath: string, maxDepth: number = 5): Promise<Project[]> {
  const projects: Project[] = []
  const scannedPaths = new Set<string>()

  async function scanDirectory(currentPath: string, depth: number): Promise<void> {
    if (depth > maxDepth) {
      return
    }

    const normalizedPath = currentPath.replace(/[/\\]/g, process.platform === 'win32' ? '\\' : '/')
    if (scannedPaths.has(normalizedPath)) {
      return
    }
    scannedPaths.add(normalizedPath)

    try {
      if (!existsSync(currentPath)) {
        return
      }

      const stats = statSync(currentPath)
      if (!stats.isDirectory()) {
        return
      }

      // 跳过常见非项目目录
      const dirName = currentPath.split(/[/\\]/).pop() || ''
      if (
        dirName.startsWith('.') &&
        dirName !== '.vscode' &&
        dirName !== '.cursor' &&
        dirName !== '.idea' &&
        dirName !== '.vim' &&
        dirName !== '.emacs.d'
      ) {
        return
      }
      if (['node_modules', 'dist', 'build', 'out', '.git'].includes(dirName)) {
        return
      }

      // 检查当前目录是否是项目
      if (isProjectDirectory(currentPath)) {
        const existingProjects = loadProjects()
        const existingProject = existingProjects.find((p) => p.path === currentPath)

        if (!existingProject) {
          projects.push({
            id: generateProjectId(currentPath),
            name: generateProjectName(currentPath),
            path: currentPath
          })
        }
        return // 找到项目后不再深入扫描
      }

      // 继续扫描子目录
      const entries = readdirSync(currentPath, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const subPath = join(currentPath, entry.name)
          await scanDirectory(subPath, depth + 1)
        }
      }
    } catch (error) {
      // 忽略权限错误等
      console.error(`Error scanning ${currentPath}:`, error)
    }
  }

  await scanDirectory(rootPath, 0)
  return projects
}

// 添加单个项目
function addProject(path: string): Project | null {
  try {
    if (!existsSync(path)) {
      return null
    }

    if (!isProjectDirectory(path)) {
      return null
    }

    const projects = loadProjects()
    const existingProject = projects.find((p) => p.path === path)
    if (existingProject) {
      return existingProject
    }

    const newProject: Project = {
      id: generateProjectId(path),
      name: generateProjectName(path),
      path: path
    }

    projects.push(newProject)
    saveProjects(projects)
    return newProject
  } catch (error) {
    console.error('Failed to add project:', error)
    return null
  }
}

// 打开项目
function openProject(path: string, command: string): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    try {
      if (!existsSync(path)) {
        resolve({ success: false, error: '项目路径不存在' })
        return
      }

      const isWindows = process.platform === 'win32'
      const spawnOptions = {
        detached: true,
        stdio: 'ignore' as const,
        shell: isWindows
      }

      let cmd = command
      let args: string[] = [path]

      // Windows上，某些命令需要特殊处理
      if (isWindows) {
        if (command === 'cursor') {
          // Cursor 在 Windows 上的默认安装路径
          const cursorPaths = [
            join(process.env.APPDATA || '', 'Local/Programs/cursor/cursor.exe'),
            join(process.env.LOCALAPPDATA || '', 'Programs/cursor/cursor.exe'),
            'cursor.exe'
          ]
          // 尝试找到 Cursor 可执行文件
          for (const cursorPath of cursorPaths) {
            if (cursorPath.includes('.exe') && existsSync(cursorPath)) {
              cmd = cursorPath
              break
            }
          }
          args = [path]
        } else if (command === 'code') {
          args = [path]
        } else if (command === 'webstorm' || command === 'pycharm') {
          args = [path]
        }
      }

      const child = spawn(cmd, args, spawnOptions)

      child.on('error', (error) => {
        resolve({ success: false, error: `无法执行命令: ${error.message}` })
      })

      child.unref()
      resolve({ success: true })
    } catch (error) {
      resolve({
        success: false,
        error: `打开项目失败: ${error instanceof Error ? error.message : '未知错误'}`
      })
    }
  })
}

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    title: '项目启动器',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
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
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // IPC handlers
  ipcMain.handle('getProjects', () => {
    return loadProjects()
  })

  ipcMain.handle('addProject', async (_, path: string) => {
    return addProject(path)
  })

  ipcMain.handle('scanDirectory', async (_, rootPath: string) => {
    const projects = await scanForProjects(rootPath)
    if (projects.length > 0) {
      const existingProjects = loadProjects()
      const newProjects = projects.filter((p) => !existingProjects.some((ep) => ep.path === p.path))
      if (newProjects.length > 0) {
        const updatedProjects = [...existingProjects, ...newProjects]
        saveProjects(updatedProjects)
      }
    }
    return projects
  })

  ipcMain.handle('openProject', async (_, path: string, command: string) => {
    const result = await openProject(path, command)
    if (result.success) {
      // 更新最后打开时间
      const projects = loadProjects()
      const project = projects.find((p) => p.path === path)
      if (project) {
        project.lastOpened = Date.now()
        saveProjects(projects)
      }
    }
    return result
  })

  ipcMain.handle('showOpenDialog', async () => {
    if (!mainWindow) return null
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: '选择项目目录'
    })
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0]
    }
    return null
  })

  createWindow()

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
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

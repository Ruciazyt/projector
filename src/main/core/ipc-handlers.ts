import { ipcMain, dialog, BrowserWindow } from 'electron'
import { loadProjects, loadSettings, saveProjects, saveSettings } from './storage'
import { scanForProjects } from '../projector/project-scanner'
import { addProject, removeProject, setProjectPreferredIde, updateProjectLastOpened } from '../projector/project-manager'
import { openProject } from '../projector/project-opener'
import { cloneGithubRepo } from '../github/github-cloner'
import type { CloneGithubRepoRequest } from '../github/types'

let registered = false

/**
 * 注册所有 IPC handlers
 */
export function registerIpcHandlers(_mainWindow: BrowserWindow | null): void {
  // 避免重复注册
  if (registered) {
    return
  }
  registered = true

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
      updateProjectLastOpened(path)
    }
    return result
  })

  ipcMain.handle('removeProject', async (_, path: string) => {
    return removeProject(path)
  })

  ipcMain.handle('setProjectPreferredIde', async (_, path: string, preferredIdeId: string) => {
    return setProjectPreferredIde(path, preferredIdeId)
  })

  ipcMain.handle('getRecentSidebarCollapsed', async () => {
    const settings = loadSettings()
    return Boolean(settings.recentSidebarCollapsed)
  })

  ipcMain.handle('setRecentSidebarCollapsed', async (_, collapsed: boolean) => {
    const settings = loadSettings()
    settings.recentSidebarCollapsed = Boolean(collapsed)
    saveSettings(settings)
    return true
  })

  ipcMain.handle('getTheme', async () => {
    const settings = loadSettings()
    return settings.theme ?? 'dark'
  })

  ipcMain.handle('setTheme', async (_, theme: 'light' | 'dark') => {
    const settings = loadSettings()
    settings.theme = theme
    saveSettings(settings)
    return true
  })

  ipcMain.handle('showOpenDialog', async (event) => {
    // 从事件发送者获取窗口
    const window = BrowserWindow.fromWebContents(event.sender)
    if (!window) {
      return null
    }
    const result = await dialog.showOpenDialog(window, {
      properties: ['openDirectory'],
      title: '选择项目目录'
    })
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0]
    }
    return null
  })

  ipcMain.handle('cloneGithubRepo', async (event, req: CloneGithubRepoRequest) => {
    return await cloneGithubRepo(event.sender, req)
  })
}



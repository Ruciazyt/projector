import { ipcMain, dialog, BrowserWindow } from 'electron'
import { loadProjects, loadSettings, saveProjects, saveSettings } from './storage'
import { scanForProjects } from '../projector/project-scanner'
import {
  addProject,
  addRemoteProject,
  removeProject,
  removeProjects,
  setProjectPreferredIde,
  updateProjectLastOpened
} from '../projector/project-manager'
import { openProject } from '../projector/project-opener'
import { cloneGithubRepo } from '../github/github-cloner'
import type { CloneGithubRepoRequest } from '../github/types'
import {
  getSshConfigsSortedByLastUsed,
  saveSshConfig,
  updateSshConfig,
  deleteSshConfig,
  getSshConfig
} from '../remote/ssh-config-manager'
import { getSshConfigHostNames, getSshConfigHost } from '../remote/ssh-config-parser'
import { testSshConnection, listRemoteDirectories } from '../remote/ssh-utils'
import { scanRemoteProjects } from '../remote/remote-project-detector'
import type { SshConnectionInfo } from '../remote/types'
import type { Project } from '../projector/types'

let registered = false

/**
 * 注册所有 IPC handlers
 */
export function registerIpcHandlers(): void {
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

  ipcMain.handle('openProject', async (_, pathOrProject: string | Project, command: string) => {
    // 如果是路径字符串，需要查找对应的项目对象
    let project: Project | string = pathOrProject
    if (typeof pathOrProject === 'string') {
      const projects = loadProjects()
      const foundProject = projects.find((p) => p.path === pathOrProject)
      if (foundProject) {
        project = foundProject
      } else {
        project = pathOrProject
      }
    }

    const result = await openProject(project, command)
    if (result.success) {
      const projectPath = typeof project === 'string' ? project : project.path
      updateProjectLastOpened(projectPath)
    }
    return result
  })

  ipcMain.handle('removeProject', async (_, path: string) => {
    return removeProject(path)
  })

  ipcMain.handle('removeProjects', async (_, paths: string[]) => {
    return removeProjects(paths)
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

    // Update titleBarOverlay for Windows
    if (process.platform !== 'darwin') {
      const overlay =
        theme === 'dark'
          ? { color: '#15141a', symbolColor: '#ffffff' }
          : { color: '#fafaf9', symbolColor: '#000000' }

      BrowserWindow.getAllWindows().forEach((win) => {
        win.setTitleBarOverlay(overlay)
      })
    }

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

  // SSH 配置相关
  ipcMain.handle('getSshConfigs', async () => {
    return getSshConfigsSortedByLastUsed()
  })

  ipcMain.handle(
    'saveSshConfig',
    async (_, config: Omit<import('../remote/types').SshConnectionConfig, 'id' | 'createdAt'>) => {
      return saveSshConfig(config)
    }
  )

  ipcMain.handle(
    'updateSshConfig',
    async (
      _,
      id: string,
      updates: Partial<Omit<import('../remote/types').SshConnectionConfig, 'id' | 'createdAt'>>
    ) => {
      return updateSshConfig(id, updates)
    }
  )

  ipcMain.handle('deleteSshConfig', async (_, id: string) => {
    return deleteSshConfig(id)
  })

  ipcMain.handle('getSshConfig', async (_, id: string) => {
    return getSshConfig(id)
  })

  // SSH config 文件解析
  ipcMain.handle('getSshConfigHosts', async () => {
    return getSshConfigHostNames()
  })

  ipcMain.handle('getSshConfigHost', async (_, hostName: string) => {
    return getSshConfigHost(hostName)
  })

  // 远程项目相关
  ipcMain.handle('testSshConnection', async (_, connectionInfo: SshConnectionInfo) => {
    return testSshConnection(connectionInfo)
  })

  ipcMain.handle(
    'listRemoteDirectories',
    async (_, connectionInfo: SshConnectionInfo, remotePath: string) => {
      return listRemoteDirectories(connectionInfo, remotePath)
    }
  )

  ipcMain.handle(
    'addRemoteProject',
    async (_, connectionInfo: SshConnectionInfo, remotePath: string) => {
      try {
        return await addRemoteProject(connectionInfo, remotePath)
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : '添加远程项目失败'
        }
      }
    }
  )

  ipcMain.handle(
    'scanRemoteProjects',
    async (event, connectionInfo: SshConnectionInfo, rootPath: string) => {
      return scanRemoteProjects(connectionInfo, rootPath, (msg) => {
        // 通过 webContents 发送日志消息
        event.sender.send('scan-remote-log', msg)
      })
    }
  )
}

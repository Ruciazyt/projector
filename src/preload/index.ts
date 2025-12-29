import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { CloneGithubRepoLogEvent, ProjectAPI } from './index.d'
import type { Project } from '../main/types'

// Custom APIs for renderer
const api: ProjectAPI = {
  getProjects: () => ipcRenderer.invoke('getProjects'),
  addProject: (path: string) => ipcRenderer.invoke('addProject', path),
  scanDirectory: (rootPath: string) => ipcRenderer.invoke('scanDirectory', rootPath),
  openProject: (pathOrProject: string | Project, command: string) =>
    ipcRenderer.invoke('openProject', pathOrProject, command),
  removeProject: (path: string) => ipcRenderer.invoke('removeProject', path),
  setProjectPreferredIde: (path: string, preferredIdeId: string) =>
    ipcRenderer.invoke('setProjectPreferredIde', path, preferredIdeId),
  getRecentSidebarCollapsed: () => ipcRenderer.invoke('getRecentSidebarCollapsed'),
  setRecentSidebarCollapsed: (collapsed: boolean) =>
    ipcRenderer.invoke('setRecentSidebarCollapsed', collapsed),
  getTheme: () => ipcRenderer.invoke('getTheme'),
  setTheme: (theme: 'light' | 'dark') => ipcRenderer.invoke('setTheme', theme),
  showOpenDialog: () => ipcRenderer.invoke('showOpenDialog'),
  cloneGithubRepo: (repoUrl: string, parentDir: string, requestId: string) =>
    ipcRenderer.invoke('cloneGithubRepo', { repoUrl, parentDir, requestId }),
  onCloneGithubRepoLog: (cb: (event: CloneGithubRepoLogEvent) => void): (() => void) => {
    const listener = (_: unknown, payload: CloneGithubRepoLogEvent): void => cb(payload)
    ipcRenderer.on('cloneGithubRepo:log', listener)
    return () => ipcRenderer.off('cloneGithubRepo:log', listener)
  },
  // SSH 配置相关
  getSshConfigs: () => ipcRenderer.invoke('getSshConfigs'),
  saveSshConfig: (config) => ipcRenderer.invoke('saveSshConfig', config),
  updateSshConfig: (id, updates) => ipcRenderer.invoke('updateSshConfig', id, updates),
  deleteSshConfig: (id) => ipcRenderer.invoke('deleteSshConfig', id),
  getSshConfig: (id) => ipcRenderer.invoke('getSshConfig', id),
  // SSH config 文件解析
  getSshConfigHosts: () => ipcRenderer.invoke('getSshConfigHosts'),
  getSshConfigHost: (hostName) => ipcRenderer.invoke('getSshConfigHost', hostName),
  // 远程项目相关
  testSshConnection: (connectionInfo) => ipcRenderer.invoke('testSshConnection', connectionInfo),
  addRemoteProject: (connectionInfo, remotePath) =>
    ipcRenderer.invoke('addRemoteProject', connectionInfo, remotePath)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}

import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { ProjectAPI } from './index.d'

// Custom APIs for renderer
const api: ProjectAPI = {
  getProjects: () => ipcRenderer.invoke('getProjects'),
  addProject: (path: string) => ipcRenderer.invoke('addProject', path),
  scanDirectory: (rootPath: string) => ipcRenderer.invoke('scanDirectory', rootPath),
  openProject: (path: string, command: string) => ipcRenderer.invoke('openProject', path, command),
  showOpenDialog: () => ipcRenderer.invoke('showOpenDialog')
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

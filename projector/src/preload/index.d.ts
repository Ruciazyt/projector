import { ElectronAPI } from '@electron-toolkit/preload'
import type { Project } from '../main/types'

export interface ProjectAPI {
  getProjects: () => Promise<Project[]>
  addProject: (path: string) => Promise<Project | null>
  scanDirectory: (rootPath: string) => Promise<Project[]>
  openProject: (path: string, command: string) => Promise<{ success: boolean; error?: string }>
  showOpenDialog: () => Promise<string | null>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: ProjectAPI
  }
}

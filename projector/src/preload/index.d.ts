import { ElectronAPI } from '@electron-toolkit/preload'
import type { Project } from '../main/types'

export type CloneLogStream = 'stdout' | 'stderr'

export interface CloneGithubRepoLogEvent {
  requestId: string
  stream: CloneLogStream
  line: string
}

export interface CloneGithubRepoResult {
  success: boolean
  repoPath?: string
  error?: string
}

export interface ProjectAPI {
  getProjects: () => Promise<Project[]>
  addProject: (path: string) => Promise<Project | null>
  scanDirectory: (rootPath: string) => Promise<Project[]>
  openProject: (path: string, command: string) => Promise<{ success: boolean; error?: string }>
  removeProject: (path: string) => Promise<boolean>
  setProjectPreferredIde: (path: string, preferredIdeId: string) => Promise<boolean>
  getRecentSidebarCollapsed: () => Promise<boolean>
  setRecentSidebarCollapsed: (collapsed: boolean) => Promise<boolean>
  getTheme: () => Promise<'light' | 'dark'>
  setTheme: (theme: 'light' | 'dark') => Promise<boolean>
  showOpenDialog: () => Promise<string | null>
  cloneGithubRepo: (repoUrl: string, parentDir: string, requestId: string) => Promise<CloneGithubRepoResult>
  onCloneGithubRepoLog: (cb: (event: CloneGithubRepoLogEvent) => void) => () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: ProjectAPI
  }
}

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

export interface SshConnectionConfig {
  id: string
  name: string
  host: string
  user: string
  port?: number
  sshConfigName?: string
  createdAt: number
  lastUsedAt?: number
}

export interface SshConnectionInfo {
  host: string
  user: string
  port?: number
  sshConfigName?: string
  savedConfigId?: string
}

export interface SshConfigHost {
  host: string
  hostName?: string
  user?: string
  port?: number
  identityFile?: string
}

export interface ProjectAPI {
  getProjects: () => Promise<Project[]>
  addProject: (path: string) => Promise<Project | null>
  scanDirectory: (rootPath: string) => Promise<Project[]>
  openProject: (
    pathOrProject: string | Project,
    command: string
  ) => Promise<{ success: boolean; error?: string }>
  removeProject: (path: string) => Promise<boolean>
  setProjectPreferredIde: (path: string, preferredIdeId: string) => Promise<boolean>
  getRecentSidebarCollapsed: () => Promise<boolean>
  setRecentSidebarCollapsed: (collapsed: boolean) => Promise<boolean>
  getTheme: () => Promise<'light' | 'dark'>
  setTheme: (theme: 'light' | 'dark') => Promise<boolean>
  showOpenDialog: () => Promise<string | null>
  cloneGithubRepo: (
    repoUrl: string,
    parentDir: string,
    requestId: string
  ) => Promise<CloneGithubRepoResult>
  onCloneGithubRepoLog: (cb: (event: CloneGithubRepoLogEvent) => void) => () => void
  // SSH 配置相关
  getSshConfigs: () => Promise<SshConnectionConfig[]>
  saveSshConfig: (
    config: Omit<SshConnectionConfig, 'id' | 'createdAt'>
  ) => Promise<SshConnectionConfig>
  updateSshConfig: (
    id: string,
    updates: Partial<Omit<SshConnectionConfig, 'id' | 'createdAt'>>
  ) => Promise<boolean>
  deleteSshConfig: (id: string) => Promise<boolean>
  getSshConfig: (id: string) => Promise<SshConnectionConfig | null>
  // SSH config 文件解析
  getSshConfigHosts: () => Promise<string[]>
  getSshConfigHost: (hostName: string) => Promise<SshConfigHost | null>
  // 远程项目相关
  testSshConnection: (
    connectionInfo: SshConnectionInfo
  ) => Promise<{ success: boolean; error?: string }>
  addRemoteProject: (
    connectionInfo: SshConnectionInfo,
    remotePath: string
  ) => Promise<Project | { success: false; error: string }>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: ProjectAPI
  }
}

export interface Project {
  id: string
  name: string
  path: string
  description?: string
  lastOpened?: number
  preferredIdeId?: string
  /**
   * 项目类型：本地或远程
   * 默认为 'local'，保持向后兼容
   */
  type?: 'local' | 'remote'
  /**
   * 远程项目配置（仅当 type === 'remote' 时使用）
   */
  remoteConfig?: {
    host: string
    user: string
    port?: number
    remotePath: string
    sshConfigName?: string
    savedConfigId?: string
  }
}

export interface IDEConfig {
  id: string
  name: string
  command: string
  icon?: string
}

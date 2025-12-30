/**
 * SSH 连接配置（保存的配置）
 */
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

/**
 * SSH 连接信息（用于连接操作）
 */
export interface SshConnectionInfo {
  host: string
  user: string
  port?: number
  sshConfigName?: string
  savedConfigId?: string
}


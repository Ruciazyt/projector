/**
 * SSH 连接配置
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


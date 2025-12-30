export type CloneLogItem = {
  stream: 'stdout' | 'stderr'
  line: string
}

export type CloneLogEvent = {
  requestId: string
  stream: 'stdout' | 'stderr'
  line: string
}

export type SshConnectionConfig = {
  id: string
  name: string
  host: string
  user: string
  port?: number
  sshConfigName?: string
  createdAt: number
  lastUsedAt?: number
}

export type SshConnectionInfo = {
  host: string
  user: string
  port?: number
  sshConfigName?: string
  savedConfigId?: string
}

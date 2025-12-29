import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

/**
 * SSH Config Host 配置
 */
export interface SshConfigHost {
  host: string
  hostName?: string
  user?: string
  port?: number
  identityFile?: string
}

/**
 * 获取 SSH config 文件路径
 */
function getSshConfigPath(): string {
  const home = homedir()
  if (process.platform === 'win32') {
    return join(home, '.ssh', 'config')
  }
  return join(home, '.ssh', 'config')
}

/**
 * 解析 SSH config 文件
 * 返回 Host 名称到配置的映射
 */
export function parseSshConfig(): Map<string, SshConfigHost> {
  const configPath = getSshConfigPath()
  const hosts = new Map<string, SshConfigHost>()

  if (!existsSync(configPath)) {
    return hosts
  }

  try {
    const content = readFileSync(configPath, 'utf-8')
    const lines = content.split('\n')

    let currentHost: SshConfigHost | null = null
    let currentHostNames: string[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()

      // 跳过空行和注释
      if (!line || line.startsWith('#')) {
        continue
      }

      // 处理多行值（以空格或制表符继续）
      if (line.match(/^\s+/) && currentHost) {
        // 这是上一行的续行
        const keyValue = line.trim().split(/\s+/, 2)
        if (keyValue.length === 2) {
          const key = keyValue[0].toLowerCase()
          const value = keyValue[1]
          if (key === 'hostname') {
            currentHost.hostName = value
          } else if (key === 'user') {
            currentHost.user = value
          } else if (key === 'port') {
            const port = parseInt(value, 10)
            if (!isNaN(port)) {
              currentHost.port = port
            }
          } else if (key === 'identityfile') {
            currentHost.identityFile = value.replace(/^~/, homedir())
          }
        }
        continue
      }

      // 解析键值对
      const parts = line.split(/\s+/)
      if (parts.length < 2) {
        continue
      }

      const key = parts[0].toLowerCase()
      const value = parts.slice(1).join(' ')

      if (key === 'host') {
        // 保存之前的 Host（如果有）
        if (currentHost && currentHostNames.length > 0) {
          for (const hostName of currentHostNames) {
            hosts.set(hostName, { ...currentHost })
          }
        }

        // 开始新的 Host 配置
        currentHostNames = value.split(/\s+/).filter((h) => h && !h.startsWith('*'))
        currentHost = {
          host: currentHostNames[0] || '',
          hostName: undefined,
          user: undefined,
          port: undefined,
          identityFile: undefined
        }
      } else if (currentHost) {
        if (key === 'hostname') {
          currentHost.hostName = value
        } else if (key === 'user') {
          currentHost.user = value
        } else if (key === 'port') {
          const port = parseInt(value, 10)
          if (!isNaN(port)) {
            currentHost.port = port
          }
        } else if (key === 'identityfile') {
          currentHost.identityFile = value.replace(/^~/, homedir())
        }
      }
    }

    // 保存最后一个 Host
    if (currentHost && currentHostNames.length > 0) {
      for (const hostName of currentHostNames) {
        hosts.set(hostName, { ...currentHost })
      }
    }
  } catch (error) {
    console.error('Failed to parse SSH config:', error)
  }

  return hosts
}

/**
 * 获取所有 SSH config Host 名称列表
 */
export function getSshConfigHostNames(): string[] {
  const hosts = parseSshConfig()
  return Array.from(hosts.keys()).sort()
}

/**
 * 根据 Host 名称获取配置
 */
export function getSshConfigHost(hostName: string): SshConfigHost | null {
  const hosts = parseSshConfig()
  return hosts.get(hostName) || null
}



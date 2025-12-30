import { spawn } from 'child_process'
import { getSshConfig } from './ssh-config-manager'
import type { SshConnectionInfo } from './types'

/**
 * 规范化远程路径
 * 如果路径不以 / 或 ~ 开头，则默认视为绝对路径并添加 /
 */
export function normalizeRemotePath(remotePath: string): string {
  const p = remotePath.trim()
  if (!p) return p
  if (p.startsWith('/') || p.startsWith('~')) return p
  return `/${p}`
}

/*r
 * 分类 SSH 错误信息
 */
export function classifySshError(errorMessage: string): string {
  if (errorMessage.includes('Permission denied')) return 'SSH 认证失败：权限被拒绝'
  if (errorMessage.includes('Host key verification failed')) return 'SSH 连接失败：主机密钥验证失败'
  if (errorMessage.includes('Connection refused')) return 'SSH 连接失败：连接被拒绝'
  if (errorMessage.includes('Could not resolve hostname')) return 'SSH 连接失败：无法解析主机名'
  if (errorMessage.toLowerCase().includes('timed out') || errorMessage.includes('timeout')) {
    return 'SSH 连接超时'
  }
  return `SSH 执行失败: ${errorMessage}`
}

/**
 * 构建 SSH 命令的 target：
 * - 优先 savedConfigId（用户保存的配置）
 * - 其次 sshConfigName（~/.ssh/config 的 Host 名称）
 * - 否则 user@host[:port]
 */
export function buildSshTarget(info: SshConnectionInfo): string {
  if (info.savedConfigId) {
    const saved = getSshConfig(info.savedConfigId)
    if (saved) {
      if (saved.sshConfigName) return saved.sshConfigName
      const user = saved.user || info.user
      const host = saved.host || info.host
      const port = saved.port || info.port
      if (port && port !== 22) return user ? `${user}@${host}:${port}` : `${host}:${port}`
      return user ? `${user}@${host}` : host
    }
  }

  if (info.sshConfigName) return info.sshConfigName

  const portPart = info.port && info.port !== 22 ? `:${info.port}` : ''
  return info.user ? `${info.user}@${info.host}${portPart}` : `${info.host}${portPart}`
}

/**
 * 使用 spawn 执行 SSH 命令，避免 shell 转义问题
 * 自动处理 target 中的端口 (host:port)
 * 添加超时机制防止命令执行卡住
 */
export async function runSshCommand(
  target: string,
  remoteCommand: string,
  timeout: number = 30000
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Windows 下 spawn 默认不使用 shell，参数作为数组传递更安全
    const args = ['-o', 'ConnectTimeout=10', '-o', 'ServerAliveInterval=5', '-o', 'ServerAliveCountMax=2', '-o', 'BatchMode=yes']

    let finalTarget = target

    // 尝试解析 host:port 格式
    // 如果 target 以 :port 结尾，提取端口并使用 -p 参数
    // 这解决了 ssh 命令不支持 host:port 格式的问题
    const portMatch = target.match(/:(\d+)$/)
    if (portMatch) {
      const port = portMatch[1]
      finalTarget = target.substring(0, portMatch.index)
      args.push('-p', port)
    }

    args.push(finalTarget, remoteCommand)

    const child = spawn('ssh', args)

    let stdout = ''
    let stderr = ''
    let isResolved = false

    // 设置超时
    const timeoutId = setTimeout(() => {
      if (!isResolved) {
        isResolved = true
        // 强制终止进程
        try {
          // Windows 上使用 kill() 不带参数，或使用 process.kill(pid, 'SIGTERM')
          if (process.platform === 'win32') {
            child.kill()
            // Windows 上可能需要强制终止
            setTimeout(() => {
              if (child.exitCode === null && !child.killed) {
                try {
                  child.kill('SIGKILL')
                } catch {
                  // 忽略错误
                }
              }
            }, 500)
          } else {
            child.kill('SIGTERM')
            setTimeout(() => {
              if (!child.killed) {
                child.kill('SIGKILL')
              }
            }, 1000)
          }
        } catch (err) {
          // 忽略终止错误
        }
        reject(new Error(`Command timeout after ${timeout}ms`))
      }
    }, timeout)

    child.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    child.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    child.on('close', (code) => {
      if (isResolved) return
      isResolved = true
      clearTimeout(timeoutId)

      if (code === 0) {
        resolve(stdout)
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr || stdout}`))
      }
    })

    child.on('error', (err) => {
      if (isResolved) return
      isResolved = true
      clearTimeout(timeoutId)
      reject(err)
    })
  })
}

/**
 * 测试 SSH 连接
 */
export async function testSshConnection(
  connectionInfo: SshConnectionInfo
): Promise<{ success: boolean; error?: string }> {
  const target = buildSshTarget(connectionInfo)

  try {
    const stdout = await runSshCommand(target, 'echo "connected"')

    return stdout.includes('connected') ? { success: true } : { success: false, error: '连接失败' }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return { success: false, error: classifySshError(msg) }
  }
}

/**
 * 列出远程目录内容
 * 仅返回目录
 */
export async function listRemoteDirectories(
  connectionInfo: SshConnectionInfo,
  remotePath: string
): Promise<{ cwd: string; dirs: string[] }> {
  const target = buildSshTarget(connectionInfo)
  const normalizedPath = normalizeRemotePath(remotePath) || '.'

  // 转义单引号，防止命令注入或错误
  const escapedPath = normalizedPath.replace(/'/g, "'\\''")
  // cd 到目录，获取绝对路径，然后列出内容
  const cmd = `cd '${escapedPath}' && pwd && ls -F -1`

  try {
    const stdout = await runSshCommand(target, cmd)

    const lines = stdout
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
    // 第一行是 pwd 的结果
    const cwd = lines[0]
    // 剩下的行是 ls 的结果
    const dirs = lines
      .slice(1)
      .filter((line) => line.endsWith('/'))
      .map((line) => line.slice(0, -1)) // 去掉末尾的 /

    return { cwd, dirs }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    throw new Error(classifySshError(msg))
  }
}

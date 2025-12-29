import { exec } from 'child_process'
import { promisify } from 'util'
import { EDITOR_CONFIG_FILES } from '../projector/constants'
import { DEFAULT_IDE_ID, IDE_MARKER_TO_ID } from '../../shared/ide'
import { getSshConfig } from './ssh-config-manager'
import type { ProjectDetectResult } from '../projector/types'

const execAsync = promisify(exec)

/**
 * SSH 连接配置
 */
export interface SshConnectionInfo {
  host: string
  user: string
  port?: number
  sshConfigName?: string
  savedConfigId?: string
}

function normalizeRemotePath(remotePath: string): string {
  const p = remotePath.trim()
  if (!p) return p
  return p.startsWith('/') ? p : `/${p}`
}

function classifySshError(errorMessage: string): string {
  if (errorMessage.includes('Permission denied')) return 'SSH 认证失败：权限被拒绝'
  if (errorMessage.includes('Host key verification failed')) return 'SSH 连接失败：主机密钥验证失败'
  if (errorMessage.includes('Connection refused')) return 'SSH 连接失败：连接被拒绝'
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
function buildSshTarget(info: SshConnectionInfo): string {
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

function buildSshCommand(target: string, remoteCommand: string): string {
  const escaped = remoteCommand.replace(/"/g, '\\"')
  return `ssh -o ConnectTimeout=10 -o BatchMode=yes "${target}" "${escaped}"`
}

/**
 * 检测远程项目（不做本地文件系统判断）
 * - 先验证目录存在
 * - 再检测 .git / .vscode / .cursor 等 marker
 */
export async function detectRemoteProject(
  connectionInfo: SshConnectionInfo,
  remotePath: string
): Promise<ProjectDetectResult> {
  const target = buildSshTarget(connectionInfo)
  const normalizedPath = normalizeRemotePath(remotePath)

  try {
    const testDirCmd = `test -d "${normalizedPath}" && echo "dir_ok" || echo "dir_missing"`
    const { stdout: testOut } = await execAsync(buildSshCommand(target, testDirCmd), {
      timeout: 15000,
      maxBuffer: 64 * 1024
    })
    if (!testOut.includes('dir_ok')) {
      return { isProject: false, preferredIdeId: DEFAULT_IDE_ID }
    }

    const markers = ['.git', ...EDITOR_CONFIG_FILES]
    const markerChecks = markers
      .map((m) => `test -e "${normalizedPath}/${m}" && echo "${m}" || true`)
      .join('; ')
    const { stdout: markerOut } = await execAsync(buildSshCommand(target, markerChecks), {
      timeout: 15000,
      maxBuffer: 64 * 1024
    })

    const found = new Set(
      markerOut
        .split('\n')
        .map((x) => x.trim())
        .filter(Boolean)
    )

    const hasGit = found.has('.git')
    const hasEditorConfig = EDITOR_CONFIG_FILES.some((m) => found.has(m))
    if (!hasGit && !hasEditorConfig) {
      return { isProject: false, preferredIdeId: DEFAULT_IDE_ID }
    }

    let preferredIdeId = DEFAULT_IDE_ID
    for (const name of found) {
      const ideId = IDE_MARKER_TO_ID.get(name)
      if (ideId) {
        preferredIdeId = ideId
        break
      }
    }

    return { isProject: true, preferredIdeId }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    throw new Error(classifySshError(msg))
  }
}

export async function testSshConnection(
  connectionInfo: SshConnectionInfo
): Promise<{ success: boolean; error?: string }> {
  const target = buildSshTarget(connectionInfo)

  try {
    const { stdout } = await execAsync(buildSshCommand(target, 'echo "connected"'), {
      timeout: 10000,
      maxBuffer: 1024
    })

    return stdout.includes('connected') ? { success: true } : { success: false, error: '连接失败' }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return { success: false, error: classifySshError(msg) }
  }
}

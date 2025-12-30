import { SKIP_DIRECTORIES } from '../projector/constants'
import { DEFAULT_IDE_ID } from '../../shared/ide'
import type { ProjectDetectResult } from '../projector/types'
import { scanRecursively, type ScanContext, DEFAULT_SCAN_OPTIONS } from '../core/scan-common'
import { detectProjectFromMarkers, PROJECT_MARKERS } from '../core/detector-common'
import type { SshConnectionInfo } from './types'
import { normalizeRemotePath, classifySshError, buildSshTarget, runSshCommand } from './ssh-utils'

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
    // 转义路径，防止特殊字符导致命令失败
    const escapedPath = normalizedPath.replace(/'/g, "'\\''")

    // 检查目录是否存在
    const testDirCmd = `test -d '${escapedPath}' && echo "yes" || echo "no"`
    const testOut = await runSshCommand(target, testDirCmd, 10000)

    if (!testOut.trim().includes('yes')) {
      return { isProject: false, preferredIdeId: DEFAULT_IDE_ID }
    }

    // 获取 markers
    const markerChecks = PROJECT_MARKERS.map(
      (m) => `test -e '${escapedPath}/${m}' && echo "${m}" || true`
    ).join('; ')

    const markerOut = await runSshCommand(target, markerChecks, 10000)
    const found = new Set(
      markerOut
        .split('\n')
        .map((x) => x.trim())
        .filter(Boolean)
    )

    return detectProjectFromMarkers(found)
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    throw new Error(classifySshError(msg))
  }
}

/**
 * 扫描远程目录下的项目（递归）
 */
export async function scanRemoteProjects(
  connectionInfo: SshConnectionInfo,
  rootPath: string,
  onLog?: (msg: string) => void
): Promise<string[]> {
  const target = buildSshTarget(connectionInfo)
  const normalizedRoot = normalizeRemotePath(rootPath)

  onLog?.(`正在连接 ${target}...`)

  const context: ScanContext = {
    isDirectory: async (path: string) => {
      const normalizedPath = normalizeRemotePath(path)
      const escapedPath = normalizedPath.replace(/'/g, "'\\''")
      const cmd = `test -d '${escapedPath}' && echo "yes" || echo "no"`
      try {
        const result = await runSshCommand(target, cmd, 10000)
        return result.trim() === 'yes'
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        onLog?.(`检查目录失败 ${path}: ${msg}`)
        return false
      }
    },
    listSubdirectories: async (path: string, skipDirectories?: readonly string[]) => {
      const normalizedPath = normalizeRemotePath(path)
      const escapedPath = normalizedPath.replace(/'/g, "'\\''")

      // 在 shell 命令层面就过滤掉需要跳过的目录
      let cmd = `cd '${escapedPath}' && ls -F -1 2>/dev/null | grep '/$' | sed 's|/$||'`

      // 如果有需要跳过的目录，使用 grep -v 过滤
      if (skipDirectories && skipDirectories.length > 0) {
        // 构建 grep -v 模式，排除所有需要跳过的目录
        const skipPattern = skipDirectories
          .map((d) => `^${d.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`)
          .join('|')
        cmd += ` | grep -vE '${skipPattern}'`
      }

      cmd += ' || true'

      try {
        onLog?.(`正在列出子目录: ${normalizedPath}`)
        const stdout = await runSshCommand(target, cmd, 15000)
        const dirNames = stdout
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
        // 返回完整路径
        const subDirs = dirNames.map((dirName) => {
          if (normalizedPath === '/') {
            return `/${dirName}`
          }
          return `${normalizedPath}/${dirName}`
        })
        onLog?.(`找到 ${subDirs.length} 个子目录（已过滤跳过目录）`)
        return subDirs
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        onLog?.(`列出子目录失败 ${path}: ${msg}`)
        return []
      }
    },
    detectProject: async (path: string) => {
      try {
        onLog?.(`正在检测项目: ${path}`)
        return await detectRemoteProject(connectionInfo, path)
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        onLog?.(`检测项目失败 ${path}: ${msg}`)
        // 如果检测失败，返回非项目
        return { isProject: false, preferredIdeId: DEFAULT_IDE_ID }
      }
    },
    onLog
  }

  try {
    return await scanRecursively(context, normalizedRoot, {
      maxDepth: DEFAULT_SCAN_OPTIONS.maxDepth,
      skipDirectories: SKIP_DIRECTORIES
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    onLog?.(`扫描失败: ${msg}`)
    throw new Error(classifySshError(msg))
  }
}

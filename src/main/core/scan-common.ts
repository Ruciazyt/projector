/**
 * 公共扫描逻辑和类型定义
 */

export interface ScanContext {
  /**
   * 检查目录是否存在且为目录
   */
  isDirectory(path: string): Promise<boolean>
  /**
   * 列出目录下的所有子目录，返回完整路径
   * @param skipDirectories 需要跳过的目录名列表，用于在列出时直接过滤
   */
  listSubdirectories(path: string, skipDirectories?: readonly string[]): Promise<string[]>
  /**
   * 检测目录是否是项目
   */
  detectProject(path: string): Promise<{ isProject: boolean; preferredIdeId: string }>
  /**
   * 记录日志（可选）
   */
  onLog?: (msg: string) => void
}

export interface ScanOptions {
  maxDepth?: number
  skipDirectories?: readonly string[]
  skipHiddenDirs?: boolean
}

export const DEFAULT_SCAN_OPTIONS: Required<ScanOptions> = {
  maxDepth: 1, // 从根目录开始，最多递归一层
  skipDirectories: ['node_modules', 'dist', 'build', 'out'],
  skipHiddenDirs: true
}

/**
 * 通用递归扫描逻辑
 */
export async function scanRecursively(
  context: ScanContext,
  rootPath: string,
  options: ScanOptions = {}
): Promise<string[]> {
  const opts = { ...DEFAULT_SCAN_OPTIONS, ...options }
  const projects: string[] = []
  const scannedPaths = new Set<string>()

  async function scanDirectory(currentPath: string, depth: number): Promise<void> {
    if (depth > opts.maxDepth) {
      return
    }

    // 规范化路径（用于去重）
    const normalizedPath = currentPath.replace(/[/\\]+/g, '/')
    if (scannedPaths.has(normalizedPath)) {
      return
    }
    scannedPaths.add(normalizedPath)

    try {
      // 检查是否是目录
      const isDir = await context.isDirectory(currentPath)
      if (!isDir) {
        return
      }

      // 获取目录名（用于检查隐藏目录）
      const dirName = currentPath.split(/[/\\]/).pop() || ''

      // 注意：skipDirectories 的检查已经在 listSubdirectories 中完成，这里不再需要

      // 检测当前目录是否是项目
      const detectResult = await context.detectProject(currentPath)
      if (detectResult.isProject) {
        context.onLog?.(`[发现项目] ${currentPath} (IDE: ${detectResult.preferredIdeId})`)
        projects.push(currentPath)
        return // 找到项目后不再深入扫描
      }

      // 不是项目则不深入扫描隐藏目录
      if (opts.skipHiddenDirs && dirName.startsWith('.')) {
        return
      }

      // 继续扫描子目录（在列出时就过滤掉需要跳过的目录）
      const subDirs = await context.listSubdirectories(currentPath, opts.skipDirectories)
      context.onLog?.(`目录 ${currentPath} 有 ${subDirs.length} 个子目录`)
      for (const subPath of subDirs) {
        await scanDirectory(subPath, depth + 1)
      }
    } catch (error) {
      // 忽略权限错误等
      const msg = error instanceof Error ? error.message : String(error)
      context.onLog?.(`扫描 ${currentPath} 时出错: ${msg}`)
      console.error(`Error scanning ${currentPath}:`, error)
    }
  }

  context.onLog?.(`开始扫描目录: ${rootPath}`)
  await scanDirectory(rootPath, 0)
  context.onLog?.(`扫描完成，共发现 ${projects.length} 个项目。`)
  return projects
}

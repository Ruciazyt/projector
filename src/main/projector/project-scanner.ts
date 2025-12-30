import { join } from 'path'
import { existsSync, readdirSync, statSync } from 'fs'
import { SKIP_DIRECTORIES } from './constants'
import { detectProject as detectLocalProject } from './project-detector'
import { generateProjectId, generateProjectName } from './project-utils'
import type { Project } from './types'
import { scanRecursively, type ScanContext, DEFAULT_SCAN_OPTIONS } from '../core/scan-common'

/**
 * 递归扫描目录查找项目
 */
export async function scanForProjects(
  rootPath: string,
  maxDepth: number = DEFAULT_SCAN_OPTIONS.maxDepth
): Promise<Project[]> {
  const context: ScanContext = {
    isDirectory: async (path: string) => {
      if (!existsSync(path)) return false
      const stats = statSync(path)
      return stats.isDirectory()
    },
    listSubdirectories: async (path: string, skipDirectories?: readonly string[]) => {
      try {
        const entries = readdirSync(path, { withFileTypes: true })
        return entries
          .filter((e) => e.isDirectory())
          .filter((e) => !skipDirectories || !skipDirectories.includes(e.name))
          .map((e) => join(path, e.name))
      } catch {
        return []
      }
    },
    detectProject: async (path: string) => {
      return detectLocalProject(path)
    }
  }

  const projectPaths = await scanRecursively(context, rootPath, {
    maxDepth,
    skipDirectories: SKIP_DIRECTORIES
  })

  // 转换为 Project 对象
  return projectPaths.map((path) => {
    const info = detectLocalProject(path)
    return {
      id: generateProjectId(path),
      name: generateProjectName(path),
      path: path,
      preferredIdeId: info.preferredIdeId
    }
  })
}

import { join } from 'path'
import { existsSync, readdirSync, statSync } from 'fs'
import { SKIP_DIRECTORIES, SCAN_CONFIG } from './constants'
import { detectProject } from './project-detector'
import { generateProjectId, generateProjectName } from './project-utils'
import type { Project } from './types'

/**
 * 递归扫描目录查找项目
 */
export async function scanForProjects(rootPath: string, maxDepth: number = SCAN_CONFIG.MAX_DEPTH): Promise<Project[]> {
  const projects: Project[] = []
  const scannedPaths = new Set<string>()

  async function scanDirectory(currentPath: string, depth: number): Promise<void> {
    if (depth > maxDepth) {
      return
    }

    const normalizedPath = currentPath.replace(/[/\\]/g, process.platform === 'win32' ? '\\' : '/')
    if (scannedPaths.has(normalizedPath)) {
      return
    }
    scannedPaths.add(normalizedPath)

    try {
      if (!existsSync(currentPath)) {
        return
      }

      const stats = statSync(currentPath)
      if (!stats.isDirectory()) {
        return
      }

      // 跳过常见非项目目录
      const dirName = currentPath.split(/[/\\]/).pop() || ''
      if (SKIP_DIRECTORIES.includes(dirName as (typeof SKIP_DIRECTORIES)[number])) {
        return
      }

      // 检查当前目录是否是项目
      const info = detectProject(currentPath)
      if (info.isProject) {
        projects.push({
          id: generateProjectId(currentPath),
          name: generateProjectName(currentPath),
          path: currentPath,
          preferredIdeId: info.preferredIdeId
        })
        return // 找到项目后不再深入扫描
      }

      // 不是项目则不深入扫描隐藏目录（消除 ALLOWED_HIDDEN_DIRS 这种手工白名单）
      if (dirName.startsWith('.')) {
        return
      }

      // 继续扫描子目录
      const entries = readdirSync(currentPath, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const subPath = join(currentPath, entry.name)
          await scanDirectory(subPath, depth + 1)
        }
      }
    } catch (error) {
      // 忽略权限错误等
      console.error(`Error scanning ${currentPath}:`, error)
    }
  }

  await scanDirectory(rootPath, 0)
  return projects
}



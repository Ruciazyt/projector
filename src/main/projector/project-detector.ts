import { existsSync, statSync } from 'fs'
import { join } from 'path'
import { DEFAULT_IDE_ID } from '../../shared/ide'
import type { ProjectDetectResult } from './types'
import { detectProjectFromMarkers, PROJECT_MARKERS } from '../core/detector-common'

/**
 * 获取本地目录中的 markers（同步版本）
 * 只检查 .git 和编辑器配置文件
 */
function getLocalMarkers(dirPath: string): Set<string> {
  const found = new Set<string>()

  for (const marker of PROJECT_MARKERS) {
    if (existsSync(join(dirPath, marker))) {
      found.add(marker)
    }
  }

  return found
}

/**
 * 一次性检测：是否项目 + 自动匹配默认 IDE
 * 避免重复文件系统 IO（readdir/existsSync）
 */
export function detectProject(dirPath: string): ProjectDetectResult {
  try {
    if (!existsSync(dirPath)) {
      return { isProject: false, preferredIdeId: DEFAULT_IDE_ID }
    }
    const stats = statSync(dirPath)
    if (!stats.isDirectory()) {
      return { isProject: false, preferredIdeId: DEFAULT_IDE_ID }
    }

    const markers = getLocalMarkers(dirPath)
    return detectProjectFromMarkers(markers)
  } catch (error) {
    console.error(`Error checking directory ${dirPath}:`, error)
    return { isProject: false, preferredIdeId: DEFAULT_IDE_ID }
  }
}

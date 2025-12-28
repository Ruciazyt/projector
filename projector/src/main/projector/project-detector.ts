import { existsSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import { EDITOR_CONFIG_FILES } from './constants'
import { DEFAULT_IDE_ID, IDE_MARKER_TO_ID } from '../../shared/ide'
import type { ProjectDetectResult } from './types'

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

    const entries = readdirSync(dirPath, { withFileTypes: true })
    const names = new Set(entries.map((e) => e.name))

    // 是否项目：.git 或任意编辑器配置目录/文件
    const hasGit = names.has('.git') || existsSync(join(dirPath, '.git'))
    const hasEditorConfig = EDITOR_CONFIG_FILES.some((x) => names.has(x))

    // 默认 IDE：命中 marker 用对应 IDE，否则默认 DEFAULT_IDE_ID（不写死具体 IDE，便于扩展）
    let preferredIdeId: string = DEFAULT_IDE_ID
    for (const name of names) {
      const ideId = IDE_MARKER_TO_ID.get(name)
      if (ideId) {
        preferredIdeId = ideId
        break
      }
    }

    return { isProject: hasGit || hasEditorConfig, preferredIdeId }
  } catch (error) {
    console.error(`Error checking directory ${dirPath}:`, error)
    return { isProject: false, preferredIdeId: DEFAULT_IDE_ID }
  }
}



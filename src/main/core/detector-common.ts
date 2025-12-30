import { EDITOR_CONFIG_FILES } from '../projector/constants'
import { DEFAULT_IDE_ID, IDE_MARKER_TO_ID } from '../../shared/ide'
import type { ProjectDetectResult } from '../projector/types'

/**
 * 项目标记文件/目录列表
 * 用于检测一个目录是否是项目
 */
export const PROJECT_MARKERS = ['.git', ...EDITOR_CONFIG_FILES] as const

/**
 * 从找到的 markers 集合中确定 preferred IDE
 * @param foundMarkers 找到的 marker 名称集合
 * @returns preferred IDE ID
 */
export function determinePreferredIde(foundMarkers: Set<string> | string[]): string {
  const markers = foundMarkers instanceof Set ? foundMarkers : new Set(foundMarkers)

  for (const name of markers) {
    const ideId = IDE_MARKER_TO_ID.get(name)
    if (ideId) {
      return ideId
    }
  }

  return DEFAULT_IDE_ID
}

/**
 * 检查 markers 集合是否表示一个项目
 * @param foundMarkers 找到的 marker 名称集合
 * @returns 是否是项目
 */
export function isProjectFromMarkers(foundMarkers: Set<string> | string[]): boolean {
  const markers = foundMarkers instanceof Set ? foundMarkers : new Set(foundMarkers)

  const hasGit = markers.has('.git')
  const hasEditorConfig = EDITOR_CONFIG_FILES.some((m) => markers.has(m))

  return hasGit || hasEditorConfig
}

/**
 * 从 markers 集合生成项目检测结果
 * @param foundMarkers 找到的 marker 名称集合
 * @returns 项目检测结果
 */
export function detectProjectFromMarkers(
  foundMarkers: Set<string> | string[]
): ProjectDetectResult {
  const isProject = isProjectFromMarkers(foundMarkers)
  const preferredIdeId = determinePreferredIde(foundMarkers)

  return { isProject, preferredIdeId }
}

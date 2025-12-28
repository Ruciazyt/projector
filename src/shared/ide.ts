export type IDEId = 'cursor' | 'vscode'

export interface IDEInfo {
  id: IDEId
  name: string
  command: string
  /**
   * 用于“自动匹配默认编辑器”的目录标记（文件/目录名）
   * 例如：.cursor / .vscode
   */
  markers: string[]
}

/**
 * IDE registry（当前只考虑 Cursor/VS Code，但结构留好了）
 * 未来加 IDE：只需要在这里加一项 + 在 UI 列表里补一项即可。
 */
export const IDE_REGISTRY = {
  cursor: { id: 'cursor', name: 'Cursor', command: 'cursor', markers: ['.cursor'] },
  vscode: { id: 'vscode', name: 'VS Code', command: 'code', markers: ['.vscode'] }
} as const satisfies Record<IDEId, IDEInfo>

// UI/遍历使用：固定顺序列表（避免 Object.values 的顺序语义）
export const IDE_LIST: readonly IDEInfo[] = [IDE_REGISTRY.cursor, IDE_REGISTRY.vscode] as const

export const DEFAULT_IDE_ID: IDEId = 'cursor'

/**
 * marker -> ideId 映射（模块加载时构建一次，检测阶段直接查表）
 */
export const IDE_MARKER_TO_ID = new Map<string, IDEId>(
  IDE_LIST.flatMap((ide) => ide.markers.map((m) => [m, ide.id] as const))
)

export function getIdeById(id: string | undefined | null): IDEInfo | undefined {
  if (!id) return undefined
  if (id === 'cursor') return IDE_REGISTRY.cursor
  if (id === 'vscode') return IDE_REGISTRY.vscode
  return undefined
}



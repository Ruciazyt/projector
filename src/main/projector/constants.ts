/**
 * 编辑器配置文件标识
 */
export const EDITOR_CONFIG_FILES = ['.vscode', '.cursor'] as const

/**
 * 需要跳过的目录名称
 */
export const SKIP_DIRECTORIES = ['node_modules', 'dist', 'build', 'out'] as const

/**
 * 编辑器命令枚举
 */
export enum EditorCommand {
  CURSOR = 'cursor',
  VSCODE = 'code'
}

/**
 * 平台枚举
 */
export enum Platform {
  WINDOWS = 'win32',
  MACOS = 'darwin',
  LINUX = 'linux'
}

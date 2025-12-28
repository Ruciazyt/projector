import { existsSync } from 'fs'
import { join } from 'path'
import { spawn } from 'child_process'
import { EditorCommand, Platform } from './constants'
import type { OpenProjectResult } from './types'

function resolveCursorCommandOnWindows(fallbackCommand: string): { cmd: string; useShell: boolean } {
  const localAppData = process.env.LOCALAPPDATA || join(process.env.USERPROFILE || '', 'AppData/Local')
  const candidates = [
    // 常见安装路径（大小写/文件名差异都兜住）
    join(localAppData, 'Programs/Cursor/Cursor.exe'),
    join(localAppData, 'Programs/Cursor/cursor.exe'),
    join(localAppData, 'Programs/cursor/Cursor.exe'),
    join(localAppData, 'Programs/cursor/cursor.exe')
  ]

  for (const p of candidates) {
    if (p && existsSync(p)) {
      // 绝对路径 .exe：不要走 shell，避免 cmd.exe 引号/转义问题
      return { cmd: p, useShell: false }
    }
  }

  // 找不到就回退到传入命令（通常是 PATH 里的 `cursor`），需要 shell 支持 .cmd/.bat 等
  return { cmd: fallbackCommand, useShell: true }
}

/**
 * 打开项目
 */
export function openProject(path: string, command: string): Promise<OpenProjectResult> {
  return new Promise((resolve) => {
    try {
      if (!existsSync(path)) {
        resolve({ success: false, error: '项目路径不存在' })
        return
      }

      const isWindows = process.platform === Platform.WINDOWS
      const spawnOptionsBase = {
        detached: true,
        stdio: 'ignore' as const
      }

      let cmd = command
      const args: string[] = [path]
      let useShell = isWindows

      // Windows 上仅对 Cursor 做可执行文件探测，其余统一处理（为未来扩展保留空间，但现在只考虑 cursor/code）
      if (isWindows) {
        if (command === EditorCommand.CURSOR) {
          const resolved = resolveCursorCommandOnWindows(command)
          cmd = resolved.cmd
          useShell = resolved.useShell
        }
      }

      const child = spawn(cmd, args, { ...spawnOptionsBase, shell: useShell })

      child.on('error', (error) => {
        resolve({ success: false, error: `无法执行命令: ${error.message}` })
      })

      child.unref()
      resolve({ success: true })
    } catch (error) {
      resolve({
        success: false,
        error: `打开项目失败: ${error instanceof Error ? error.message : '未知错误'}`
      })
    }
  })
}



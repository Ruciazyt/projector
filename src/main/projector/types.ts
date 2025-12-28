export interface Project {
  id: string
  name: string
  path: string
  description?: string
  lastOpened?: number
  /**
   * 用户选择/自动匹配的默认 IDE（字符串以便未来扩展）
   * 当前实现仅使用 'cursor' | 'vscode'
   */
  preferredIdeId?: string
}

export interface IDEConfig {
  id: string
  name: string
  command: string
  icon?: string
}

export interface ProjectDetectResult {
  isProject: boolean
  preferredIdeId: string
}

export interface OpenProjectResult {
  success: boolean
  error?: string
}



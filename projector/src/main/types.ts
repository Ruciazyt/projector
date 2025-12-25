export interface Project {
  id: string
  name: string
  path: string
  description?: string
  lastOpened?: number
}

export interface IDEConfig {
  id: string
  name: string
  command: string
  icon?: string
}

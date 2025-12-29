import { app } from 'electron'
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import type { Project } from '../types'
import { detectProject } from '../projector/project-detector'
import type { AppSettings } from './types'
import type { SshConnectionConfig } from '../remote/types'

/**
 * 获取项目数据文件路径
 */
export function getProjectsFilePath(): string {
  const userDataPath = app.getPath('userData')
  return join(userDataPath, 'projects.json')
}

/**
 * 加载项目列表
 */
export function loadProjects(): Project[] {
  const filePath = getProjectsFilePath()
  try {
    if (existsSync(filePath)) {
      const data = readFileSync(filePath, 'utf-8')
      const projects = JSON.parse(data) as Project[]
      // 兼容旧数据：为缺失 preferredIdeId 的项目补齐（尽量只做一次性修复）
      let changed = false
      for (const p of projects) {
        if (!p.preferredIdeId) {
          p.preferredIdeId = detectProject(p.path).preferredIdeId
          changed = true
        }
      }
      if (changed) {
        saveProjects(projects)
      }
      return projects
    }
  } catch (error) {
    console.error('Failed to load projects:', error)
  }
  return []
}

/**
 * 保存项目列表
 */
export function saveProjects(projects: Project[]): void {
  const filePath = getProjectsFilePath()
  try {
    const dir = join(filePath, '..')
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
    writeFileSync(filePath, JSON.stringify(projects, null, 2), 'utf-8')
  } catch (error) {
    console.error('Failed to save projects:', error)
  }
}

export function getSettingsFilePath(): string {
  const userDataPath = app.getPath('userData')
  return join(userDataPath, 'settings.json')
}

export function loadSettings(): AppSettings {
  const filePath = getSettingsFilePath()
  try {
    if (existsSync(filePath)) {
      const data = readFileSync(filePath, 'utf-8')
      return JSON.parse(data) as AppSettings
    }
  } catch (error) {
    console.error('Failed to load settings:', error)
  }
  return {}
}

export function saveSettings(settings: AppSettings): void {
  const filePath = getSettingsFilePath()
  try {
    const dir = join(filePath, '..')
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
    writeFileSync(filePath, JSON.stringify(settings, null, 2), 'utf-8')
  } catch (error) {
    console.error('Failed to save settings:', error)
  }
}

/**
 * 获取 SSH 配置文件路径
 */
export function getSshConfigsFilePath(): string {
  const userDataPath = app.getPath('userData')
  return join(userDataPath, 'ssh-configs.json')
}

/**
 * 加载 SSH 配置列表
 */
export function loadSshConfigs(): SshConnectionConfig[] {
  const filePath = getSshConfigsFilePath()
  try {
    if (existsSync(filePath)) {
      const data = readFileSync(filePath, 'utf-8')
      return JSON.parse(data) as SshConnectionConfig[]
    }
  } catch (error) {
    console.error('Failed to load SSH configs:', error)
  }
  return []
}

/**
 * 保存 SSH 配置列表
 */
export function saveSshConfigs(configs: SshConnectionConfig[]): void {
  const filePath = getSshConfigsFilePath()
  try {
    const dir = join(filePath, '..')
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
    writeFileSync(filePath, JSON.stringify(configs, null, 2), 'utf-8')
  } catch (error) {
    console.error('Failed to save SSH configs:', error)
  }
}



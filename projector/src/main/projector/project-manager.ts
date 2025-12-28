import { existsSync } from 'fs'
import { detectProject } from './project-detector'
import { generateProjectId, generateProjectName } from './project-utils'
import { loadProjects, saveProjects } from '../core/storage'
import type { Project } from './types'

/**
 * 添加单个项目
 */
export function addProject(path: string): Project | null {
  try {
    if (!existsSync(path)) {
      return null
    }

    const info = detectProject(path)
    if (!info.isProject) {
      return null
    }

    const projects = loadProjects()
    const existingProject = projects.find((p) => p.path === path)
    if (existingProject) {
      return existingProject
    }

    const newProject: Project = {
      id: generateProjectId(path),
      name: generateProjectName(path),
      path: path,
      preferredIdeId: info.preferredIdeId
    }

    projects.push(newProject)
    saveProjects(projects)
    return newProject
  } catch (error) {
    console.error('Failed to add project:', error)
    return null
  }
}

/**
 * 更新项目最后打开时间
 */
export function updateProjectLastOpened(path: string): void {
  const projects = loadProjects()
  const project = projects.find((p) => p.path === path)
  if (project) {
    project.lastOpened = Date.now()
    saveProjects(projects)
  }
}

/**
 * 删除项目记录（仅移除应用内记录，不删除磁盘目录）
 */
export function removeProject(path: string): boolean {
  const projects = loadProjects()
  const nextProjects = projects.filter((p) => p.path !== path)
  if (nextProjects.length === projects.length) {
    return false
  }
  saveProjects(nextProjects)
  return true
}

export function setProjectPreferredIde(path: string, preferredIdeId: string): boolean {
  const projects = loadProjects()
  const project = projects.find((p) => p.path === path)
  if (!project) {
    return false
  }
  project.preferredIdeId = preferredIdeId
  saveProjects(projects)
  return true
}



import { existsSync } from 'fs'
import { detectProject } from './project-detector'
import { generateProjectId, generateProjectName } from './project-utils'
import { loadProjects, saveProjects } from '../core/storage'
import type { Project } from './types'
import { detectRemoteProject } from '../remote/remote-project-detector'
import { testSshConnection } from '../remote/ssh-utils'
import type { SshConnectionInfo } from '../remote/types'
import { updateSshConfigLastUsed } from '../remote/ssh-config-manager'

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

/**
 * 批量删除项目记录
 * @returns 成功删除的项目数量
 */
export function removeProjects(paths: string[]): number {
  if (paths.length === 0) return 0
  const projects = loadProjects()
  const pathSet = new Set(paths)
  const nextProjects = projects.filter((p) => !pathSet.has(p.path))
  const removedCount = projects.length - nextProjects.length
  if (removedCount > 0) {
    saveProjects(nextProjects)
  }
  return removedCount
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

/**
 * 添加远程项目
 */
export async function addRemoteProject(
  connectionInfo: SshConnectionInfo,
  remotePath: string
): Promise<Project | null> {
  try {
    const normalizedRemotePath = remotePath.trim().startsWith('/') ? remotePath.trim() : `/${remotePath.trim()}`

    // 验证 SSH 连接
    const connectionTest = await testSshConnection(connectionInfo)
    if (!connectionTest.success) {
      throw new Error(connectionTest.error || 'SSH 连接失败')
    }

    // 检测远程项目
    const info = await detectRemoteProject(connectionInfo, normalizedRemotePath)
    if (!info.isProject) {
      throw new Error('远程路径不是有效的项目目录（缺少 .git 或编辑器配置文件）')
    }

    // 生成稳定 key：remote://user@host:port/abs/path
    const host = connectionInfo.host.trim()
    const user = connectionInfo.user.trim()
    const portPart = connectionInfo.port && connectionInfo.port !== 22 ? `:${connectionInfo.port}` : ''
    const authority = connectionInfo.sshConfigName?.trim() || `${user}@${host}${portPart}`
    const projectPath = `remote://${authority}${normalizedRemotePath}`
    const projects = loadProjects()
    const existingProject = projects.find((p) => p.path === projectPath)
    if (existingProject) {
      return existingProject
    }

    // 构建远程配置
    const remoteConfig: Project['remoteConfig'] = {
      host: connectionInfo.host,
      user: connectionInfo.user,
      port: connectionInfo.port,
      remotePath: normalizedRemotePath,
      sshConfigName: connectionInfo.sshConfigName,
      savedConfigId: connectionInfo.savedConfigId
    }

    const newProject: Project = {
      id: generateProjectId(projectPath),
      name: generateProjectName(remotePath),
      path: projectPath,
      type: 'remote',
      remoteConfig: remoteConfig,
      preferredIdeId: info.preferredIdeId
    }

    projects.push(newProject)
    saveProjects(projects)

    // 更新 SSH 配置的最后使用时间
    if (connectionInfo.savedConfigId) {
      updateSshConfigLastUsed(connectionInfo.savedConfigId)
    }

    return newProject
  } catch (error) {
    console.error('Failed to add remote project:', error)
    throw error
  }
}



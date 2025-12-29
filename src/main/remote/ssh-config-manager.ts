import { loadSshConfigs, saveSshConfigs } from '../core/storage'
import type { SshConnectionConfig } from './types'

/**
 * 生成 SSH 配置 ID
 */
function generateSshConfigId(): string {
  return `ssh-config-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * 加载所有 SSH 配置
 */
export function loadAllSshConfigs(): SshConnectionConfig[] {
  return loadSshConfigs()
}

/**
 * 根据 ID 获取 SSH 配置
 */
export function getSshConfig(id: string): SshConnectionConfig | null {
  const configs = loadSshConfigs()
  return configs.find((c) => c.id === id) || null
}

/**
 * 保存新的 SSH 配置
 */
export function saveSshConfig(config: Omit<SshConnectionConfig, 'id' | 'createdAt'>): SshConnectionConfig {
  const configs = loadSshConfigs()
  const newConfig: SshConnectionConfig = {
    ...config,
    id: generateSshConfigId(),
    createdAt: Date.now()
  }
  configs.push(newConfig)
  saveSshConfigs(configs)
  return newConfig
}

/**
 * 更新 SSH 配置
 */
export function updateSshConfig(id: string, updates: Partial<Omit<SshConnectionConfig, 'id' | 'createdAt'>>): boolean {
  const configs = loadSshConfigs()
  const index = configs.findIndex((c) => c.id === id)
  if (index === -1) {
    return false
  }
  configs[index] = { ...configs[index], ...updates }
  saveSshConfigs(configs)
  return true
}

/**
 * 删除 SSH 配置
 */
export function deleteSshConfig(id: string): boolean {
  const configs = loadSshConfigs()
  const filtered = configs.filter((c) => c.id !== id)
  if (filtered.length === configs.length) {
    return false
  }
  saveSshConfigs(filtered)
  return true
}

/**
 * 更新配置的最后使用时间
 */
export function updateSshConfigLastUsed(id: string): void {
  updateSshConfig(id, { lastUsedAt: Date.now() })
}

/**
 * 获取按最后使用时间排序的配置列表（最近使用的在前）
 */
export function getSshConfigsSortedByLastUsed(): SshConnectionConfig[] {
  const configs = loadSshConfigs()
  return configs.sort((a, b) => {
    const aTime = a.lastUsedAt || a.createdAt
    const bTime = b.lastUsedAt || b.createdAt
    return bTime - aTime
  })
}



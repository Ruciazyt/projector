<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { SshConnectionConfig, SshConnectionInfo } from './types'

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'added'): void
}>()

const sshConfigs = ref<SshConnectionConfig[]>([])
const selectedSshConfigId = ref<string | null>(null)
const useSavedSshConfig = ref(true)
const remoteHost = ref('')
const remoteUser = ref('')
const remotePort = ref<number | undefined>(undefined)
const remotePath = ref('')
const sshConfigName = ref<string | null>(null)
const saveSshConfig = ref(false)
const sshConfigNameInput = ref('')
const remoteAdding = ref(false)
const scanning = ref(false)
const scanLogs = ref<string[]>([])
const logContainer = ref<HTMLElement | null>(null)

// 远程目录浏览
const remoteBrowsing = ref(false)
const remoteBrowserPath = ref('')
const remoteDirs = ref<string[]>([])
const remoteBrowserLoading = ref(false)
const remoteBrowserError = ref<string | null>(null)

const loadSshConfigs = async (): Promise<void> => {
  try {
    sshConfigs.value = await window.api.getSshConfigs()
  } catch (error) {
    console.error('Failed to load SSH configs:', error)
  }
}

const handleSshConfigSelect = (configId: string | null): void => {
  selectedSshConfigId.value = configId
  if (configId) {
    const config = sshConfigs.value.find((c) => c.id === configId)
    if (config) {
      remoteHost.value = config.host
      remoteUser.value = config.user
      remotePort.value = config.port
      sshConfigName.value = config.sshConfigName || null
    }
  }
}

const handleUseSavedSshConfigChange = (): void => {
  if (!useSavedSshConfig.value) {
    selectedSshConfigId.value = null
  }
}

const joinPath = (base: string, part: string) => {
  if (base === '.') return part
  return base.endsWith('/') ? `${base}${part}` : `${base}/${part}`
}

const fetchRemoteDirs = async (path: string) => {
  remoteBrowserLoading.value = true
  remoteBrowserError.value = null
  try {
    const info: SshConnectionInfo = {
      host: remoteHost.value,
      user: remoteUser.value,
      port: remotePort.value,
      sshConfigName: sshConfigName.value || undefined,
      savedConfigId: useSavedSshConfig.value ? selectedSshConfigId.value || undefined : undefined
    }
    const { cwd, dirs } = await window.api.listRemoteDirectories(info, path)
    remoteDirs.value = dirs
    remoteBrowserPath.value = cwd
  } catch (e) {
    remoteBrowserError.value = e instanceof Error ? e.message : String(e)
  } finally {
    remoteBrowserLoading.value = false
  }
}

const startRemoteBrowse = async () => {
  // 简单验证
  if (useSavedSshConfig.value) {
    if (!selectedSshConfigId.value) {
      // 这里的 alert 可以换成更友好的提示，或者直接让 fetch 报错
    }
  }

  remoteBrowsing.value = true
  await fetchRemoteDirs(remotePath.value || '.')
}

const confirmRemotePath = () => {
  remotePath.value = remoteBrowserPath.value
  remoteBrowsing.value = false
}

const navigateUp = () => {
  if (!remoteBrowserPath.value || remoteBrowserPath.value === '/') return
  fetchRemoteDirs(remoteBrowserPath.value + '/..')
}

const getConnectionInfo = async (): Promise<SshConnectionInfo | null> => {
  if (useSavedSshConfig.value && selectedSshConfigId.value) {
    const config = sshConfigs.value.find((c) => c.id === selectedSshConfigId.value)
    if (!config) {
      alert('选择的 SSH 配置不存在')
      return null
    }
    return {
      host: config.host,
      user: config.user,
      port: config.port,
      sshConfigName: config.sshConfigName || undefined,
      savedConfigId: config.id
    }
  } else {
    if (!remoteHost.value.trim()) {
      alert('请输入主机地址')
      return null
    }
    if (!remoteUser.value.trim()) {
      alert('请输入用户名')
      return null
    }

    const info: SshConnectionInfo = {
      host: remoteHost.value.trim(),
      user: remoteUser.value.trim(),
      port: remotePort.value,
      sshConfigName: sshConfigName.value || undefined
    }

    if (saveSshConfig.value) {
      if (!sshConfigNameInput.value.trim()) {
        alert('请输入配置名称')
        return null
      }
      try {
        const savedConfig = await window.api.saveSshConfig({
          name: sshConfigNameInput.value.trim(),
          host: info.host,
          user: info.user,
          port: info.port,
          sshConfigName: info.sshConfigName
        })
        info.savedConfigId = savedConfig.id
      } catch (error) {
        console.error('Failed to save SSH config:', error)
      }
    }
    return info
  }
}

const handleScanRemoteProject = async (): Promise<void> => {
  if (!remotePath.value.trim()) {
    alert('请输入远程项目路径')
    return
  }

  const connectionInfo = await getConnectionInfo()
  if (!connectionInfo) return

  scanning.value = true
  scanLogs.value = []

  const removeListener = window.api.onScanRemoteLog((msg) => {
    scanLogs.value.push(msg)
    // Auto scroll
    setTimeout(() => {
      if (logContainer.value) {
        logContainer.value.scrollTop = logContainer.value.scrollHeight
      }
    }, 0)
  })

  try {
    const projects = await window.api.scanRemoteProjects(connectionInfo, remotePath.value.trim())

    if (projects.length === 0) {
      alert('未发现任何项目')
    } else {
      for (const p of projects) {
        await window.api.addRemoteProject(connectionInfo, p)
      }
      emit('added')
    }
  } catch (error) {
    console.error('Failed to scan remote projects:', error)
    scanLogs.value.push(`Error: ${error instanceof Error ? error.message : String(error)}`)
  } finally {
    scanning.value = false
    removeListener()
  }
}

const handleAddRemoteProject = async (): Promise<void> => {
  if (!remotePath.value.trim()) {
    alert('请输入远程项目路径')
    return
  }

  remoteAdding.value = true

  try {
    const connectionInfo = await getConnectionInfo()
    if (!connectionInfo) {
      remoteAdding.value = false
      return
    }

    // 添加远程项目
    const result = await window.api.addRemoteProject(connectionInfo, remotePath.value.trim())

    if ('success' in result && !result.success) {
      alert(result.error || '添加远程项目失败')
      remoteAdding.value = false
      return
    }

    emit('added')
  } catch (error) {
    console.error('Failed to add remote project:', error)
    alert(`添加远程项目失败: ${error instanceof Error ? error.message : '未知错误'}`)
  } finally {
    remoteAdding.value = false
  }
}

onMounted(() => {
  loadSshConfigs()
})
</script>

<template>
  <div class="modal modal-wide">
    <div class="modal-title">{{ remoteBrowsing ? '选择远程目录' : '添加远程项目' }}</div>
    <div class="modal-subtitle">
      {{ remoteBrowsing ? '浏览并选择项目所在目录' : '通过 SSH 连接远程服务器上的项目' }}
    </div>

    <!-- 扫描日志模式 -->
    <div v-if="scanning" class="remote-browser">
      <div class="browser-header">
        <div class="current-path">正在扫描: {{ remotePath }}</div>
      </div>
      <div ref="logContainer" class="browser-list">
        <div v-for="(log, index) in scanLogs" :key="index" class="log-item">{{ log }}</div>
      </div>
      <div class="modal-actions">
        <button class="modal-btn" type="button" @click="scanning = false">关闭</button>
      </div>
    </div>

    <!-- 浏览模式 -->
    <div v-else-if="remoteBrowsing" class="remote-browser">
      <div class="browser-header">
        <button class="field-btn" :disabled="remoteBrowserLoading" @click="navigateUp">
          ⬆️ 上一级
        </button>
        <div class="current-path">{{ remoteBrowserPath }}</div>
      </div>
      <div class="browser-list">
        <div v-if="remoteBrowserLoading" class="browser-loading">加载中...</div>
        <div v-else-if="remoteBrowserError" class="browser-error">{{ remoteBrowserError }}</div>
        <div v-else-if="remoteDirs.length === 0" class="browser-empty">空目录</div>
        <div v-else class="browser-items">
          <div
            v-for="dir in remoteDirs"
            :key="dir"
            class="browser-item"
            @click="fetchRemoteDirs(joinPath(remoteBrowserPath, dir))"
          >
            📁 {{ dir }}
          </div>
        </div>
      </div>
      <div class="modal-actions">
        <button class="modal-btn" type="button" @click="remoteBrowsing = false">取消</button>
        <button class="modal-btn primary" type="button" @click="confirmRemotePath">
          选择此目录
        </button>
      </div>
    </div>

    <!-- 表单模式 -->
    <div v-else>
      <!-- 连接方式：有已保存配置时提供切换 + 下拉 -->
      <div v-if="sshConfigs.length > 0" class="field">
        <div class="field-label">连接方式</div>
        <label class="field-checkbox">
          <input
            v-model="useSavedSshConfig"
            type="checkbox"
            @change="handleUseSavedSshConfigChange"
          />
          <span>使用已保存的 SSH 配置</span>
        </label>
        <select
          v-if="useSavedSshConfig"
          v-model="selectedSshConfigId"
          class="field-input"
          @change="handleSshConfigSelect(selectedSshConfigId || null)"
        >
          <option :value="null">请选择配置</option>
          <option v-for="config in sshConfigs" :key="config.id" :value="config.id">
            {{ config.name }} ({{ config.user }}@{{ config.host
            }}{{ config.port && config.port !== 22 ? `:${config.port}` : '' }})
          </option>
        </select>
      </div>

      <div v-if="!useSavedSshConfig || !selectedSshConfigId" class="field-group">
        <div class="field">
          <div class="field-label">主机地址</div>
          <input
            v-model="remoteHost"
            class="field-input"
            type="text"
            placeholder="192.168.1.100 或 example.com"
          />
        </div>

        <div class="field">
          <div class="field-label">用户名</div>
          <input v-model="remoteUser" class="field-input" type="text" placeholder="root" />
        </div>

        <div class="field">
          <div class="field-label">端口（可选，默认 22）</div>
          <input v-model.number="remotePort" class="field-input" type="number" placeholder="22" />
        </div>

        <div class="field">
          <div class="field-label">SSH Config Host（可选）</div>
          <input
            v-model="sshConfigName"
            class="field-input"
            type="text"
            placeholder="如果使用 ~/.ssh/config 中的 Host 名称"
          />
        </div>

        <div class="field">
          <label class="field-checkbox">
            <input v-model="saveSshConfig" type="checkbox" />
            <span>保存此配置以便下次使用</span>
          </label>
          <input
            v-if="saveSshConfig"
            v-model="sshConfigNameInput"
            class="field-input"
            type="text"
            placeholder="配置名称，如：生产服务器"
            style="margin-top: 6px"
          />
        </div>
      </div>

      <div class="field">
        <div class="field-label">远程项目路径</div>
        <div class="field-row">
          <input
            v-model="remotePath"
            class="field-input"
            type="text"
            placeholder="/home/user/project 或 /var/www/app"
          />
          <button class="field-btn" type="button" @click="startRemoteBrowse">浏览</button>
        </div>
      </div>

      <div class="modal-actions">
        <button class="modal-btn" type="button" @click="$emit('cancel')">取消</button>
        <div style="display: flex; gap: 8px">
          <button
            class="modal-btn primary"
            type="button"
            :disabled="remoteAdding || scanning"
            style="flex: 1"
            @click="handleScanRemoteProject"
          >
            {{ scanning ? '扫描中...' : '扫描并添加' }}
          </button>
          <button
            class="modal-btn primary"
            type="button"
            :disabled="remoteAdding || scanning"
            style="flex: 1"
            @click="handleAddRemoteProject"
          >
            {{ remoteAdding ? '添加中...' : '直接添加' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import './modal-styles.css';
@import './field-styles.css';

.log-item {
  font-family: monospace;
  font-size: 12px;
  padding: 2px 4px;
  color: var(--ev-c-text-2);
  white-space: pre-wrap;
  word-break: break-all;
}

.modal {
  max-height: calc(100vh - 40px);
  overflow-y: auto;
}

.remote-browser {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 400px;
}

.browser-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.current-path {
  flex: 1;
  font-family: monospace;
  background: rgba(0, 0, 0, 0.2);
  padding: 8px 12px;
  border-radius: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.browser-list {
  flex: 1;
  border: 1px solid rgba(112, 125, 166, 0.18);
  border-radius: 8px;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.1);
  padding: 8px;
}

.browser-loading,
.browser-error,
.browser-empty {
  padding: 20px;
  text-align: center;
  color: var(--ev-c-text-3);
}

.browser-error {
  color: #ff6b6b;
}

.browser-items {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.browser-item {
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.browser-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.field-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 13px;
  color: var(--ev-c-text-2);
}

.field-checkbox input[type='checkbox'] {
  cursor: pointer;
  width: 16px;
  height: 16px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  background: rgba(112, 125, 166, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(112, 125, 166, 0.1);
}
</style>

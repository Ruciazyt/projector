<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import type { SshConnectionConfig, SshConnectionInfo } from './types'

const { t } = useI18n()

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

const joinPath = (base: string, part: string): string => {
  if (base === '.') return part
  return base.endsWith('/') ? `${base}${part}` : `${base}/${part}`
}

const fetchRemoteDirs = async (path: string): Promise<void> => {
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

const startRemoteBrowse = async (): Promise<void> => {
  // 简单验证
  if (useSavedSshConfig.value) {
    if (!selectedSshConfigId.value) {
      // 这里的 alert 可以换成更友好的提示，或者直接让 fetch 报错
    }
  }

  remoteBrowsing.value = true
  await fetchRemoteDirs(remotePath.value || '.')
}

const confirmRemotePath = (): void => {
  remotePath.value = remoteBrowserPath.value
  remoteBrowsing.value = false
}

const navigateUp = (): void => {
  if (!remoteBrowserPath.value || remoteBrowserPath.value === '/') return
  fetchRemoteDirs(remoteBrowserPath.value + '/..')
}

const getConnectionInfo = async (): Promise<SshConnectionInfo | null> => {
  if (useSavedSshConfig.value && selectedSshConfigId.value) {
    const config = sshConfigs.value.find((c) => c.id === selectedSshConfigId.value)
    if (!config) {
      alert(t('modal.remote.alert.sshConfigNotFound'))
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
      alert(t('modal.remote.alert.noHost'))
      return null
    }
    if (!remoteUser.value.trim()) {
      alert(t('modal.remote.alert.noUser'))
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
        alert(t('modal.remote.alert.noConfigName'))
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
    alert(t('modal.remote.alert.noPath'))
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
      alert(t('modal.remote.alert.noProjects'))
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
    alert(t('modal.remote.alert.noPath'))
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
      alert(result.error || t('modal.remote.alert.addFail'))
      remoteAdding.value = false
      return
    }

    emit('added')
  } catch (error) {
    console.error('Failed to add remote project:', error)
    alert(
      t('modal.remote.alert.addFail') +
        `: ${error instanceof Error ? error.message : t('common.unknown')}`
    )
  } finally {
    remoteAdding.value = false
  }
}

onMounted(() => {
  loadSshConfigs()
})
</script>

<template>
  <div
    class="relative flex max-h-[calc(100vh-40px)] w-[min(720px,calc(100vw-32px))] flex-col gap-4 overflow-y-auto rounded-lg border border-card-border bg-card-bg p-6 shadow-2"
  >
    <div class="text-lg font-medium text-text-1">
      {{ remoteBrowsing ? t('modal.remote.title.browse') : t('modal.remote.title.add') }}
    </div>
    <div class="text-xs text-text-3">
      {{ remoteBrowsing ? t('modal.remote.subtitle.browse') : t('modal.remote.subtitle.add') }}
    </div>

    <!-- 扫描日志模式 -->
    <div v-if="scanning" class="flex h-[400px] flex-col gap-3">
      <div class="flex items-center gap-2.5">
        <div
          class="flex-1 overflow-hidden text-ellipsis whitespace-nowrap rounded-md bg-black/20 px-3 py-2 font-mono"
        >
          {{ t('modal.remote.scanning', { path: remotePath }) }}
        </div>
      </div>
      <div
        ref="logContainer"
        class="flex-1 overflow-y-auto rounded-lg border border-card-border bg-black/10 p-2"
      >
        <div
          v-for="(log, index) in scanLogs"
          :key="index"
          class="whitespace-pre-wrap break-all px-1 py-0.5 font-mono text-xs text-text-2"
        >
          {{ log }}
        </div>
      </div>
      <div class="mt-1 flex flex-col gap-2">
        <button
          class="w-full cursor-pointer rounded-md border border-card-border bg-transparent px-5 py-3 text-sm font-bold text-text-1 shadow-1 transition-all hover:border-ev-c-gray-1 hover:bg-ev-c-gray-2 hover:shadow-2 active:scale-99 active:shadow-1"
          type="button"
          @click="scanning = false"
        >
          {{ t('common.close') }}
        </button>
      </div>
    </div>

    <!-- 浏览模式 -->
    <div v-else-if="remoteBrowsing" class="flex h-[400px] flex-col gap-3">
      <div class="flex items-center gap-2.5">
        <button
          class="shrink-0 cursor-pointer rounded-lg border-none bg-primary/10 px-3.5 py-2.5 font-bold text-text-1 hover:bg-primary/20 disabled:opacity-50"
          :disabled="remoteBrowserLoading"
          @click="navigateUp"
        >
          {{ t('modal.remote.up') }}
        </button>
        <div
          class="flex-1 overflow-hidden text-ellipsis whitespace-nowrap rounded-md bg-black/20 px-3 py-2 font-mono"
        >
          {{ remoteBrowserPath }}
        </div>
      </div>
      <div class="flex-1 overflow-y-auto rounded-lg border border-card-border bg-black/10 p-2">
        <div v-if="remoteBrowserLoading" class="p-5 text-center text-text-3">
          {{ t('common.loading') }}
        </div>
        <div v-else-if="remoteBrowserError" class="p-5 text-center text-red-400">
          {{ remoteBrowserError }}
        </div>
        <div v-else-if="remoteDirs.length === 0" class="p-5 text-center text-text-3">
          {{ t('modal.remote.emptyDir') }}
        </div>
        <div v-else class="flex flex-col gap-0.5">
          <div
            v-for="dir in remoteDirs"
            :key="dir"
            class="flex cursor-pointer items-center gap-2 rounded px-2.5 py-1.5 hover:bg-white/10"
            @click="fetchRemoteDirs(joinPath(remoteBrowserPath, dir))"
          >
            📁 {{ dir }}
          </div>
        </div>
      </div>
      <div class="mt-1 flex flex-col gap-2">
        <button
          class="w-full cursor-pointer rounded-md border border-card-border bg-transparent px-5 py-3 text-sm font-bold text-text-1 shadow-1 transition-all hover:border-ev-c-gray-1 hover:bg-ev-c-gray-2 hover:shadow-2 active:scale-99 active:shadow-1"
          type="button"
          @click="remoteBrowsing = false"
        >
          {{ t('common.cancel') }}
        </button>
        <button
          class="w-full cursor-pointer rounded-md border border-card-border bg-primary px-5 py-3 text-sm font-bold text-white shadow-1 transition-all hover:bg-primary-hover hover:shadow-2 active:scale-99 active:shadow-1"
          type="button"
          @click="confirmRemotePath"
        >
          {{ t('modal.remote.selectThis') }}
        </button>
      </div>
    </div>

    <!-- 表单模式 -->
    <div v-else>
      <!-- 连接方式：有已保存配置时提供切换 + 下拉 -->
      <div v-if="sshConfigs.length > 0" class="flex flex-col gap-1.5">
        <div class="text-xs font-bold text-text-2">{{ t('modal.remote.connectionType') }}</div>
        <label class="flex cursor-pointer items-center gap-2 text-[13px] text-text-2">
          <input
            v-model="useSavedSshConfig"
            class="h-4 w-4 cursor-pointer"
            type="checkbox"
            @change="handleUseSavedSshConfigChange"
          />
          <span>{{ t('modal.remote.useSaved') }}</span>
        </label>
        <select
          v-if="useSavedSshConfig"
          v-model="selectedSshConfigId"
          class="w-full rounded-lg border border-card-border bg-card-bg px-3 py-2.5 text-text-1 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-80"
          @change="handleSshConfigSelect(selectedSshConfigId || null)"
        >
          <option :value="null">{{ t('modal.remote.selectConfig') }}</option>
          <option v-for="config in sshConfigs" :key="config.id" :value="config.id">
            {{ config.name }} ({{ config.user }}@{{ config.host
            }}{{ config.port && config.port !== 22 ? `:${config.port}` : '' }})
          </option>
        </select>
      </div>

      <div
        v-if="!useSavedSshConfig || !selectedSshConfigId"
        class="mt-3 flex flex-col gap-3 rounded-lg border border-card-border bg-card-bg/50 p-3"
      >
        <div class="flex flex-col gap-1.5">
          <div class="text-xs font-bold text-text-2">{{ t('modal.remote.host') }}</div>
          <input
            v-model="remoteHost"
            class="w-full rounded-lg border border-card-border bg-card-bg px-3 py-2.5 text-text-1 outline-none transition-colors placeholder:text-text-3 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-80"
            type="text"
            placeholder="192.168.1.100 / example.com"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <div class="text-xs font-bold text-text-2">{{ t('modal.remote.user') }}</div>
          <input
            v-model="remoteUser"
            class="w-full rounded-lg border border-card-border bg-card-bg px-3 py-2.5 text-text-1 outline-none transition-colors placeholder:text-text-3 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-80"
            type="text"
            placeholder="root"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <div class="text-xs font-bold text-text-2">{{ t('modal.remote.port') }}</div>
          <input
            v-model.number="remotePort"
            class="w-full rounded-lg border border-card-border bg-card-bg px-3 py-2.5 text-text-1 outline-none transition-colors placeholder:text-text-3 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-80"
            type="number"
            placeholder="22"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <div class="text-xs font-bold text-text-2">{{ t('modal.remote.sshConfigHost') }}</div>
          <input
            v-model="sshConfigName"
            class="w-full rounded-lg border border-card-border bg-card-bg px-3 py-2.5 text-text-1 outline-none transition-colors placeholder:text-text-3 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-80"
            type="text"
            placeholder="~/.ssh/config Host"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="flex cursor-pointer items-center gap-2 text-[13px] text-text-2">
            <input v-model="saveSshConfig" class="h-4 w-4 cursor-pointer" type="checkbox" />
            <span>{{ t('modal.remote.saveConfig') }}</span>
          </label>
          <input
            v-if="saveSshConfig"
            v-model="sshConfigNameInput"
            class="mt-1.5 w-full rounded-lg border border-card-border bg-card-bg px-3 py-2.5 text-text-1 outline-none transition-colors placeholder:text-text-3 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-80"
            type="text"
            :placeholder="t('modal.remote.configName')"
          />
        </div>
      </div>

      <div class="mt-3 flex flex-col gap-1.5">
        <div class="text-xs font-bold text-text-2">{{ t('modal.remote.remotePath') }}</div>
        <div class="flex gap-2.5">
          <input
            v-model="remotePath"
            class="w-full rounded-lg border border-card-border bg-card-bg px-3 py-2.5 text-text-1 outline-none transition-colors placeholder:text-text-3 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-80"
            type="text"
            placeholder="/home/user/project..."
          />
          <button
            class="shrink-0 cursor-pointer rounded-lg border-none bg-primary/10 px-3.5 py-2.5 font-bold text-text-1 hover:bg-primary/20"
            type="button"
            @click="startRemoteBrowse"
          >
            {{ t('modal.remote.browse') }}
          </button>
        </div>
      </div>

      <div class="mt-4 flex flex-col gap-2">
        <button
          class="w-full cursor-pointer rounded-md border border-card-border bg-transparent px-5 py-3 text-sm font-bold text-text-1 shadow-1 transition-all hover:border-ev-c-gray-1 hover:bg-ev-c-gray-2 hover:shadow-2 active:scale-99 active:shadow-1"
          type="button"
          @click="$emit('cancel')"
        >
          {{ t('common.cancel') }}
        </button>
        <div class="flex gap-2">
          <button
            class="w-full flex-1 cursor-pointer rounded-md border border-card-border bg-primary px-5 py-3 text-sm font-bold text-white shadow-1 transition-all hover:bg-primary-hover hover:shadow-2 active:scale-99 active:shadow-1 disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            :disabled="remoteAdding || scanning"
            @click="handleScanRemoteProject"
          >
            {{ scanning ? t('modal.remote.scanningBtn') : t('modal.remote.scanAndAdd') }}
          </button>
          <button
            class="w-full flex-1 cursor-pointer rounded-md border border-card-border bg-primary px-5 py-3 text-sm font-bold text-white shadow-1 transition-all hover:bg-primary-hover hover:shadow-2 active:scale-99 active:shadow-1 disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            :disabled="remoteAdding || scanning"
            @click="handleAddRemoteProject"
          >
            {{ remoteAdding ? t('modal.remote.adding') : t('modal.remote.directAdd') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>

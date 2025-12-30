<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'
import StepChoose from './add-project/StepChoose.vue'
import StepGithub from './add-project/StepGithub.vue'
import StepRemote from './add-project/StepRemote.vue'
import StepLog from './add-project/StepLog.vue'

import type { CloneLogItem, CloneLogEvent } from './add-project/types'

type Step = 'choose' | 'github' | 'remote' | 'log'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
  (e: 'added'): void
}>()

const step = ref<Step>('choose')

const cloneRunning = ref(false)
const cloneRequestId = ref<string | null>(null)
const cloneLogs = ref<CloneLogItem[]>([])

let offCloneLog: null | (() => void) = null

const closeAll = (): void => {
  emit('update:open', false)
}

const reset = (): void => {
  step.value = 'choose'
  cloneRunning.value = false
  cloneRequestId.value = null
  cloneLogs.value = []
}

const ensureCloneLogSubscribed = (): void => {
  if (offCloneLog) return
  offCloneLog = window.api.onCloneGithubRepoLog((evt: CloneLogEvent) => {
    if (!cloneRequestId.value || evt.requestId !== cloneRequestId.value) return
    cloneLogs.value.push({ stream: evt.stream, line: evt.line })
    if (cloneLogs.value.length > 2000) cloneLogs.value.splice(0, cloneLogs.value.length - 2000)
  })
}

const handleAddLocalProject = async (): Promise<void> => {
  try {
    const selectedPath = await window.api.showOpenDialog()
    if (!selectedPath) return

    const newProject = await window.api.addProject(selectedPath)
    if (!newProject) {
      alert('无法添加项目：该目录不包含编辑器配置文件或 .git')
      return
    }

    emit('added')
    closeAll()
  } catch (error) {
    console.error('Failed to add project:', error)
    alert(`添加项目失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

const handleStartGithubClone = async (payload: {
  repoUrl: string
  parentDir: string
}): Promise<void> => {
  const { repoUrl, parentDir } = payload

  ensureCloneLogSubscribed()
  cloneLogs.value = []
  cloneRunning.value = true
  step.value = 'log'

  const requestId = `${Date.now()}-${Math.random().toString(16).slice(2)}`
  cloneRequestId.value = requestId

  try {
    const result = await window.api.cloneGithubRepo(repoUrl, parentDir, requestId)
    cloneRunning.value = false
    if (!result.success || !result.repoPath) {
      alert(result.error || '拉取失败')
      return
    }

    const added = await window.api.addProject(result.repoPath)
    if (!added) {
      alert('拉取成功，但无法添加到列表（该目录不被识别为项目）')
    }

    emit('added')
    closeAll()
  } catch (error) {
    cloneRunning.value = false
    console.error('Failed to clone repo:', error)
    alert(`拉取失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

const handleCloseLog = (): void => {
  if (!cloneRunning.value) {
    step.value = 'github'
  } else {
    closeAll()
  }
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      reset()
      ensureCloneLogSubscribed()
    } else {
      reset()
    }
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  offCloneLog?.()
  offCloneLog = null
})
</script>

<template>
  <!-- 选择方式 -->
  <Transition name="modal">
    <div v-if="open && step === 'choose'" class="modal-overlay" @click.self="closeAll">
      <Transition name="modal-content">
        <StepChoose
          v-if="open && step === 'choose'"
          @select-local="handleAddLocalProject"
          @select-github="step = 'github'"
          @select-remote="step = 'remote'"
        />
      </Transition>
    </div>
  </Transition>

  <!-- GitHub 添加 -->
  <Transition name="modal">
    <div v-if="open && step === 'github'" class="modal-overlay" @click.self="closeAll">
      <Transition name="modal-content">
        <StepGithub
          v-if="open && step === 'github'"
          :loading="cloneRunning"
          @cancel="closeAll"
          @clone="handleStartGithubClone"
        />
      </Transition>
    </div>
  </Transition>

  <!-- 远程服务器添加 -->
  <Transition name="modal">
    <div v-if="open && step === 'remote'" class="modal-overlay" @click.self="closeAll">
      <Transition name="modal-content">
        <StepRemote
          v-if="open && step === 'remote'"
          @cancel="closeAll"
          @added="
            () => {
              emit('added')
              closeAll()
            }
          "
        />
      </Transition>
    </div>
  </Transition>

  <!-- Clone 日志 -->
  <Transition name="modal">
    <div v-if="open && step === 'log'" class="modal-overlay" @click.self="handleCloseLog">
      <Transition name="modal-content">
        <StepLog
          v-if="open && step === 'log'"
          :logs="cloneLogs"
          :running="cloneRunning"
          @close="handleCloseLog"
          @clear="cloneLogs = []"
        />
      </Transition>
    </div>
  </Transition>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

[data-theme='light'] .modal-overlay {
  background: rgba(0, 0, 0, 0.3);
}

/* 弹框动画 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-content-enter-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-content-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-content-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(-10px);
}

.modal-content-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-5px);
}
</style>

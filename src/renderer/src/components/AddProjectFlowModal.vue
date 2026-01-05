<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
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

const { t } = useI18n()

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
      alert(t('modal.addProject.error.noConfig'))
      return
    }

    emit('added')
    closeAll()
  } catch (error) {
    console.error('Failed to add project:', error)
    alert(
      t('modal.addProject.error.failed', {
        error: error instanceof Error ? error.message : t('common.unknown')
      })
    )
  }
}

const handleScanLocalProject = async (): Promise<void> => {
  try {
    const selectedPath = await window.api.showOpenDialog()
    if (!selectedPath) return

    const projects = await window.api.scanDirectory(selectedPath)

    if (projects.length === 0) {
      alert(t('modal.addProject.scan.none'))
    } else {
      alert(t('modal.addProject.scan.success', { count: projects.length }))
      emit('added')
      closeAll()
    }
  } catch (error) {
    console.error('Failed to scan directory:', error)
    alert(
      t('modal.addProject.error.failed', {
        error: error instanceof Error ? error.message : t('common.unknown')
      })
    )
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
      alert(result.error || t('modal.addProject.error.cloneFailGeneric'))
      return
    }

    const added = await window.api.addProject(result.repoPath)
    if (!added) {
      alert(t('modal.addProject.error.cloneSuccessButAddFail'))
    }

    emit('added')
    closeAll()
  } catch (error) {
    cloneRunning.value = false
    console.error('Failed to clone repo:', error)
    alert(
      t('modal.addProject.error.cloneFail', {
        error: error instanceof Error ? error.message : t('common.unknown')
      })
    )
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
  <Transition
    enter-active-class="transition-opacity duration-200 ease-out"
    leave-active-class="transition-opacity duration-200 ease-out"
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
  >
    <div
      v-if="open && step === 'choose'"
      class="fixed inset-0 z-[999] flex items-center justify-center bg-black/55 backdrop-blur-[10px] data-[theme=light]:bg-black/30"
      @click.self="closeAll"
    >
      <Transition
        appear
        enter-active-class="transition-all duration-250 ease-[cubic-bezier(0.4,0,0.2,1)]"
        leave-active-class="transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
        enter-from-class="opacity-0 -translate-y-2.5 scale-95"
        leave-to-class="opacity-0 -translate-y-1 scale-95"
      >
        <StepChoose
          v-if="open && step === 'choose'"
          @select-local="handleAddLocalProject"
          @select-scan-local="handleScanLocalProject"
          @select-github="step = 'github'"
          @select-remote="step = 'remote'"
        />
      </Transition>
    </div>
  </Transition>

  <!-- GitHub 添加 -->
  <Transition
    enter-active-class="transition-opacity duration-200 ease-out"
    leave-active-class="transition-opacity duration-200 ease-out"
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
  >
    <div
      v-if="open && step === 'github'"
      class="fixed inset-0 z-[999] flex items-center justify-center bg-black/55 backdrop-blur-[10px] data-[theme=light]:bg-black/30"
      @click.self="closeAll"
    >
      <Transition
        appear
        enter-active-class="transition-all duration-250 ease-[cubic-bezier(0.4,0,0.2,1)]"
        leave-active-class="transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
        enter-from-class="opacity-0 -translate-y-2.5 scale-95"
        leave-to-class="opacity-0 -translate-y-1 scale-95"
      >
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
  <Transition
    enter-active-class="transition-opacity duration-200 ease-out"
    leave-active-class="transition-opacity duration-200 ease-out"
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
  >
    <div
      v-if="open && step === 'remote'"
      class="fixed inset-0 z-[999] flex items-center justify-center bg-black/55 backdrop-blur-[10px] data-[theme=light]:bg-black/30"
      @click.self="closeAll"
    >
      <Transition
        appear
        enter-active-class="transition-all duration-250 ease-[cubic-bezier(0.4,0,0.2,1)]"
        leave-active-class="transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
        enter-from-class="opacity-0 -translate-y-2.5 scale-95"
        leave-to-class="opacity-0 -translate-y-1 scale-95"
      >
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
  <Transition
    enter-active-class="transition-opacity duration-200 ease-out"
    leave-active-class="transition-opacity duration-200 ease-out"
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
  >
    <div
      v-if="open && step === 'log'"
      class="fixed inset-0 z-[999] flex items-center justify-center bg-black/55 backdrop-blur-[10px] data-[theme=light]:bg-black/30"
      @click.self="handleCloseLog"
    >
      <Transition
        appear
        enter-active-class="transition-all duration-250 ease-[cubic-bezier(0.4,0,0.2,1)]"
        leave-active-class="transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
        enter-from-class="opacity-0 -translate-y-2.5 scale-95"
        leave-to-class="opacity-0 -translate-y-1 scale-95"
      >
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

<style scoped></style>

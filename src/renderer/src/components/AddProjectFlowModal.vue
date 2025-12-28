<script setup lang="ts">
import { ref, watch, nextTick, onBeforeUnmount } from 'vue'

type Step = 'choose' | 'github' | 'log'
type CloneLogItem = { stream: 'stdout' | 'stderr'; line: string }
type CloneLogEvent = { requestId: string; stream: 'stdout' | 'stderr'; line: string }

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
  (e: 'added'): void
}>()

const step = ref<Step>('choose')

const githubRepoUrl = ref('')
const githubParentDir = ref<string | null>(null)

const cloneLogOpen = ref(false)
const cloneRunning = ref(false)
const cloneRequestId = ref<string | null>(null)
const cloneLogs = ref<CloneLogItem[]>([])
const logScrollerRef = ref<HTMLDivElement | null>(null)

let offCloneLog: null | (() => void) = null

const closeAll = (): void => {
  emit('update:open', false)
}

const reset = (): void => {
  step.value = 'choose'
  githubRepoUrl.value = ''
  githubParentDir.value = null
  cloneLogOpen.value = false
  cloneRunning.value = false
  cloneRequestId.value = null
  cloneLogs.value = []
}

const scrollLogsToBottom = (): void => {
  nextTick(() => {
    const el = logScrollerRef.value
    if (!el) return
    el.scrollTop = el.scrollHeight
  })
}

const ensureCloneLogSubscribed = (): void => {
  if (offCloneLog) return
  offCloneLog = window.api.onCloneGithubRepoLog((evt: CloneLogEvent) => {
    if (!cloneRequestId.value || evt.requestId !== cloneRequestId.value) return
    cloneLogs.value.push({ stream: evt.stream, line: evt.line })
    if (cloneLogs.value.length > 2000) cloneLogs.value.splice(0, cloneLogs.value.length - 2000)
    scrollLogsToBottom()
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

const handleOpenGithub = (): void => {
  githubRepoUrl.value = ''
  githubParentDir.value = null
  cloneLogs.value = []
  cloneRequestId.value = null
  cloneLogOpen.value = false
  cloneRunning.value = false
  step.value = 'github'
}

const handleChooseGithubParentDir = async (): Promise<void> => {
  try {
    const selectedPath = await window.api.showOpenDialog()
    if (!selectedPath) return
    githubParentDir.value = selectedPath
  } catch (error) {
    console.error('Failed to choose parent dir:', error)
    alert('选择父目录失败')
  }
}

const handleStartGithubClone = async (): Promise<void> => {
  const repoUrl = githubRepoUrl.value.trim()
  const parentDir = githubParentDir.value
  if (!repoUrl) {
    alert('请输入 GitHub 仓库地址')
    return
  }
  if (!parentDir) {
    alert('请选择父目录')
    return
  }

  ensureCloneLogSubscribed()
  cloneLogs.value = []
  cloneLogOpen.value = true
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

const handleCopyCloneLogs = async (): Promise<void> => {
  try {
    const text = cloneLogs.value.map((x) => `[${x.stream}] ${x.line}`).join('\n')
    await navigator.clipboard.writeText(text)
  } catch {
    alert('复制失败（可能缺少权限）')
  }
}

const handleCloseLog = (): void => {
  cloneLogOpen.value = false
  if (!cloneRunning.value) {
    step.value = 'github'
  }
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      reset()
      // 订阅日志：仅在流程打开时订阅
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
        <div class="modal">
      <div class="modal-title">添加项目</div>
      <div class="modal-subtitle">请选择添加方式</div>
      <div class="modal-actions">
        <button class="modal-btn" type="button" @click="handleAddLocalProject">选择本地目录</button>
        <button class="modal-btn primary" type="button" @click="handleOpenGithub">从 GitHub 添加</button>
      </div>
        </div>
      </Transition>
    </div>
  </Transition>

  <!-- GitHub 添加 -->
  <Transition name="modal">
    <div v-if="open && step === 'github'" class="modal-overlay" @click.self="closeAll">
      <Transition name="modal-content">
        <div class="modal modal-wide">
      <div class="modal-title">从 GitHub 添加</div>
      <div class="modal-subtitle">仅支持公开仓库 HTTPS 地址</div>

      <label class="field">
        <div class="field-label">仓库地址</div>
        <input v-model="githubRepoUrl" class="field-input" type="text" placeholder="https://github.com/owner/repo" />
      </label>

      <div class="field">
        <div class="field-label">父目录</div>
        <div class="field-row">
          <input class="field-input" type="text" :value="githubParentDir ?? ''" placeholder="请选择父目录" disabled />
          <button class="field-btn" type="button" @click="handleChooseGithubParentDir">选择</button>
        </div>
      </div>

      <div class="modal-actions">
        <button class="modal-btn" type="button" @click="closeAll">取消</button>
        <button class="modal-btn primary" type="button" :disabled="cloneRunning" @click="handleStartGithubClone">
          {{ cloneRunning ? '拉取中...' : '开始拉取' }}
        </button>
      </div>
        </div>
      </Transition>
    </div>
  </Transition>

  <!-- Clone 日志 -->
  <Transition name="modal">
    <div v-if="open && cloneLogOpen" class="modal-overlay" @click.self="handleCloseLog">
      <Transition name="modal-content">
        <div class="modal modal-log">
      <div class="modal-title">拉取日志</div>
      <div class="modal-subtitle">
        <span v-if="cloneRunning">正在拉取中，窗口可关闭，拉取会继续</span>
        <span v-else>拉取已结束</span>
      </div>

      <div ref="logScrollerRef" class="log-box">
        <div v-if="cloneLogs.length === 0" class="log-empty">暂无输出</div>
        <div v-for="(x, i) in cloneLogs" :key="i" class="log-line" :class="x.stream">
          <span class="log-stream">[{{ x.stream }}]</span>
          <span class="log-text">{{ x.line }}</span>
        </div>
      </div>

      <div class="modal-actions">
        <button class="modal-btn" type="button" @click="cloneLogs = []">清空</button>
        <button class="modal-btn" type="button" @click="handleCopyCloneLogs">复制</button>
        <button class="modal-btn primary" type="button" @click="handleCloseLog">关闭</button>
      </div>
        </div>
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

[data-theme="light"] .modal-overlay {
  background: rgba(0, 0, 0, 0.3);
}

.modal {
  width: min(520px, calc(100vw - 32px));
  background: var(--color-background-soft);
  border: 1px solid rgba(112, 125, 166, 0.18);
  border-radius: 10px;
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.25);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.modal-wide {
  width: min(720px, calc(100vw - 32px));
}

.modal-log {
  width: min(860px, calc(100vw - 32px));
}

.modal-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--ev-c-text-1);
}

.modal-subtitle {
  font-size: 12px;
  color: var(--ev-c-text-3);
}

.modal-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
}

.modal-btn {
  border: none;
  border-radius: 10px;
  padding: 10px 14px;
  background: rgba(112, 125, 166, 0.18);
  color: var(--ev-c-text-1);
  cursor: pointer;
  font-weight: 650;
  width: 100%;
}

.modal-btn:hover {
  background: rgba(112, 125, 166, 0.26);
}

.modal-btn.primary {
  background: var(--color-02);
  color: #ffffff;
}

.modal-btn.primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 12px;
  color: var(--ev-c-text-2);
  font-weight: 650;
}

.field-row {
  display: flex;
  gap: 10px;
}

.field-input {
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(112, 125, 166, 0.18);
  background: var(--color-card-bg);
  color: var(--ev-c-text-1);
  outline: none;
  font-family: inherit;
}

.field-input:disabled {
  opacity: 0.8;
}

.field-btn {
  flex-shrink: 0;
  border: none;
  border-radius: 10px;
  padding: 10px 14px;
  background: rgba(112, 125, 166, 0.18);
  color: var(--ev-c-text-1);
  cursor: pointer;
  font-weight: 650;
}

.field-btn:hover {
  background: rgba(112, 125, 166, 0.26);
}

.log-box {
  height: min(55vh, 420px);
  overflow: auto;
  border-radius: 10px;
  border: 1px solid rgba(112, 125, 166, 0.18);
  background: var(--color-background-mute);
  padding: 10px;
  font-family:
    ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
  font-size: 12px;
  line-height: 1.45;
}

.log-empty {
  color: var(--ev-c-text-3);
}

.log-line {
  display: flex;
  gap: 8px;
  white-space: pre-wrap;
  word-break: break-word;
  padding: 2px 0;
}

.log-line.stderr .log-text {
  color: rgba(255, 120, 120, 0.9);
}

.log-stream {
  color: rgba(112, 125, 166, 0.9);
  flex-shrink: 0;
}

.log-text {
  color: var(--ev-c-text-1);
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



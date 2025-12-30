<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import type { CloneLogItem } from './types'

const props = defineProps<{
  logs: CloneLogItem[]
  running: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'clear'): void
}>()

const logScrollerRef = ref<HTMLDivElement | null>(null)

watch(
  () => props.logs.length,
  () => {
    nextTick(() => {
      const el = logScrollerRef.value
      if (!el) return
      el.scrollTop = el.scrollHeight
    })
  }
)

const handleCopy = async (): Promise<void> => {
  try {
    const text = props.logs.map((x) => `[${x.stream}] ${x.line}`).join('\n')
    await navigator.clipboard.writeText(text)
  } catch {
    alert('复制失败（可能缺少权限）')
  }
}

const handleClear = (): void => {
  emit('clear')
}

const handleClose = (): void => {
  emit('close')
}
</script>

<template>
  <div class="modal modal-log">
    <div class="modal-title">拉取日志</div>
    <div class="modal-subtitle">
      <span v-if="running">正在拉取中，窗口可关闭，拉取会继续</span>
      <span v-else>拉取已结束</span>
    </div>

    <div ref="logScrollerRef" class="log-box">
      <div v-if="logs.length === 0" class="log-empty">暂无输出</div>
      <div v-for="(x, i) in logs" :key="i" class="log-line" :class="x.stream">
        <span class="log-stream">[{{ x.stream }}]</span>
        <span class="log-text">{{ x.line }}</span>
      </div>
    </div>

    <div class="modal-actions">
      <button class="modal-btn" type="button" @click="handleClear">清空</button>
      <button class="modal-btn" type="button" @click="handleCopy">复制</button>
      <button class="modal-btn primary" type="button" @click="handleClose">关闭</button>
    </div>
  </div>
</template>

<style scoped>
@import './modal-styles.css';

.modal-log {
  width: min(860px, calc(100vw - 32px));
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
</style>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import type { CloneLogItem } from './types'

const { t } = useI18n()

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
    alert(t('modal.log.alert.copyFail'))
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
  <div
    class="relative flex w-[min(860px,calc(100vw-32px))] flex-col gap-4 rounded-lg border border-card-border bg-card-bg p-6 shadow-2"
  >
    <div class="text-lg font-medium text-text-1">{{ t('modal.log.title') }}</div>
    <div class="text-xs text-text-3">
      <span v-if="running">{{ t('modal.log.subtitle.running') }}</span>
      <span v-else>{{ t('modal.log.subtitle.finished') }}</span>
    </div>

    <div
      ref="logScrollerRef"
      class="h-[min(55vh,420px)] overflow-auto rounded-lg border border-card-border bg-background-mute p-2.5 font-mono text-xs leading-[1.45]"
    >
      <div v-if="logs.length === 0" class="text-text-3">{{ t('modal.log.empty') }}</div>
      <div
        v-for="(x, i) in logs"
        :key="i"
        class="flex gap-2 whitespace-pre-wrap break-words py-[2px]"
        :class="{ 'text-danger': x.stream === 'stderr' }"
      >
        <span class="shrink-0 text-text-3/90">[{{ x.stream }}]</span>
        <span class="text-text-1" :class="{ 'text-red-400': x.stream === 'stderr' }">{{
          x.line
        }}</span>
      </div>
    </div>

    <div class="mt-1 flex flex-col gap-2">
      <button
        class="w-full cursor-pointer rounded-md border border-card-border bg-transparent px-5 py-3 text-sm font-bold text-text-1 shadow-1 transition-all hover:border-ev-c-gray-1 hover:bg-ev-c-gray-2 hover:shadow-2 active:scale-99 active:shadow-1"
        type="button"
        @click="handleClear"
      >
        {{ t('common.clear') }}
      </button>
      <button
        class="w-full cursor-pointer rounded-md border border-card-border bg-transparent px-5 py-3 text-sm font-bold text-text-1 shadow-1 transition-all hover:border-ev-c-gray-1 hover:bg-ev-c-gray-2 hover:shadow-2 active:scale-99 active:shadow-1"
        type="button"
        @click="handleCopy"
      >
        {{ t('common.copy') }}
      </button>
      <button
        class="w-full cursor-pointer rounded-md border border-card-border bg-primary px-5 py-3 text-sm font-bold text-white shadow-1 transition-all hover:bg-primary-hover hover:shadow-2 active:scale-99 active:shadow-1"
        type="button"
        @click="handleClose"
      >
        {{ t('common.close') }}
      </button>
    </div>
  </div>
</template>

<style scoped></style>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const emit = defineEmits<{
  (e: 'select-local'): void
  (e: 'select-scan-local'): void
  (e: 'select-github'): void
  (e: 'select-remote'): void
}>()

interface StepButton {
  label: string
  action: () => void
  variant?: 'default' | 'primary'
}

const buttons: StepButton[] = [
  {
    label: t('modal.addProject.local'),
    action: () => emit('select-local')
  },
  {
    label: t('modal.addProject.scanLocal'),
    action: () => emit('select-scan-local')
  },
  {
    label: t('modal.addProject.github'),
    action: () => emit('select-github')
  },
  {
    label: t('modal.addProject.remote'),
    action: () => emit('select-remote'),
    variant: 'primary'
  }
]
</script>

<template>
  <div
    class="relative flex w-[min(520px,calc(100vw-32px))] flex-col gap-4 rounded-lg border border-card-border bg-card-bg p-6 shadow-2"
  >
    <div class="text-lg font-medium text-text-1">{{ t('modal.addProject.title') }}</div>
    <div class="text-xs text-text-3">{{ t('modal.addProject.subtitle') }}</div>
    <div class="mt-1 flex flex-col gap-2">
      <button
        v-for="(btn, index) in buttons"
        :key="index"
        class="w-full cursor-pointer rounded-md border border-card-border px-5 py-3 text-sm font-bold shadow-1 transition-all active:scale-99 active:shadow-1"
        :class="
          btn.variant === 'primary'
            ? 'bg-primary text-white hover:bg-primary-hover hover:shadow-2'
            : 'bg-transparent text-text-1 hover:border-ev-c-gray-1 hover:bg-ev-c-gray-2 hover:shadow-2'
        "
        type="button"
        @click="btn.action"
      >
        {{ btn.label }}
      </button>
    </div>
  </div>
</template>

<style scoped></style>

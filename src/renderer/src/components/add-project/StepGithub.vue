<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps<{
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'clone', payload: { repoUrl: string; parentDir: string }): void
}>()

const repoUrl = ref('')
const parentDir = ref<string | null>(null)

const handleChooseParentDir = async (): Promise<void> => {
  try {
    const selectedPath = await window.api.showOpenDialog()
    if (!selectedPath) return
    parentDir.value = selectedPath
  } catch (error) {
    console.error('Failed to choose parent dir:', error)
    alert(t('modal.github.alert.selectDirFail'))
  }
}

const handleStart = (): void => {
  const url = repoUrl.value.trim()
  const dir = parentDir.value
  if (!url) {
    alert(t('modal.github.alert.noUrl'))
    return
  }
  if (!dir) {
    alert(t('modal.github.alert.noDir'))
    return
  }
  emit('clone', { repoUrl: url, parentDir: dir })
}
</script>

<template>
  <div
    class="relative flex w-[min(720px,calc(100vw-32px))] flex-col gap-4 rounded-lg border border-card-border bg-card-bg p-6 shadow-2"
  >
    <div class="text-lg font-medium text-text-1">{{ t('modal.github.title') }}</div>
    <div class="text-xs text-text-3">{{ t('modal.github.subtitle') }}</div>

    <label class="flex flex-col gap-1.5">
      <div class="text-xs font-bold text-text-2">{{ t('modal.github.repoUrl') }}</div>
      <input
        v-model="repoUrl"
        class="w-full rounded-lg border border-card-border bg-card-bg px-3 py-2.5 text-text-1 outline-none transition-colors placeholder:text-text-3 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-80"
        type="text"
        :placeholder="t('modal.github.repoPlaceholder')"
      />
    </label>

    <div class="flex flex-col gap-1.5">
      <div class="text-xs font-bold text-text-2">{{ t('modal.github.parentDir') }}</div>
      <div class="flex gap-2.5">
        <input
          class="w-full rounded-lg border border-card-border bg-card-bg px-3 py-2.5 text-text-1 outline-none transition-colors placeholder:text-text-3 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-80"
          type="text"
          :value="parentDir ?? ''"
          :placeholder="t('modal.github.selectDirPlaceholder')"
          disabled
        />
        <button
          class="shrink-0 cursor-pointer rounded-lg border-none bg-primary/10 px-3.5 py-2.5 font-bold text-text-1 hover:bg-primary/20"
          type="button"
          @click="handleChooseParentDir"
        >
          {{ t('common.select') }}
        </button>
      </div>
    </div>

    <div class="mt-1 flex flex-col gap-2">
      <button
        class="w-full cursor-pointer rounded-md border border-card-border bg-transparent px-5 py-3 text-sm font-bold text-text-1 shadow-1 transition-all hover:border-ev-c-gray-1 hover:bg-ev-c-gray-2 hover:shadow-2 active:scale-99 active:shadow-1"
        type="button"
        @click="$emit('cancel')"
      >
        {{ t('common.cancel') }}
      </button>
      <button
        class="w-full cursor-pointer rounded-md border border-card-border bg-primary px-5 py-3 text-sm font-bold text-white shadow-1 transition-all hover:bg-primary-hover hover:shadow-2 active:scale-99 active:shadow-1 disabled:cursor-not-allowed disabled:opacity-60"
        type="button"
        :disabled="loading"
        @click="handleStart"
      >
        {{ loading ? t('modal.github.cloning') : t('modal.github.start') }}
      </button>
    </div>
  </div>
</template>

<style scoped></style>

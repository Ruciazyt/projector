<script setup lang="ts">
import { ref } from 'vue'

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
    alert('选择父目录失败')
  }
}

const handleStart = (): void => {
  const url = repoUrl.value.trim()
  const dir = parentDir.value
  if (!url) {
    alert('请输入 GitHub 仓库地址')
    return
  }
  if (!dir) {
    alert('请选择父目录')
    return
  }
  emit('clone', { repoUrl: url, parentDir: dir })
}
</script>

<template>
  <div class="modal modal-wide">
    <div class="modal-title">从 GitHub 添加</div>
    <div class="modal-subtitle">仅支持公开仓库 HTTPS 地址</div>

    <label class="field">
      <div class="field-label">仓库地址</div>
      <input
        v-model="repoUrl"
        class="field-input"
        type="text"
        placeholder="https://github.com/owner/repo"
      />
    </label>

    <div class="field">
      <div class="field-label">父目录</div>
      <div class="field-row">
        <input
          class="field-input"
          type="text"
          :value="parentDir ?? ''"
          placeholder="请选择父目录"
          disabled
        />
        <button class="field-btn" type="button" @click="handleChooseParentDir">选择</button>
      </div>
    </div>

    <div class="modal-actions">
      <button class="modal-btn" type="button" @click="$emit('cancel')">取消</button>
      <button class="modal-btn primary" type="button" :disabled="loading" @click="handleStart">
        {{ loading ? '拉取中...' : '开始拉取' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
@import './modal-styles.css';
@import './field-styles.css';
</style>

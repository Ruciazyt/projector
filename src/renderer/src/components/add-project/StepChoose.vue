<script setup lang="ts">
defineEmits<{
  (e: 'select-local'): void
  (e: 'select-github'): void
  (e: 'select-remote'): void
}>()
</script>

<template>
  <div class="modal">
    <div class="modal-title">添加项目</div>
    <div class="modal-subtitle">请选择添加方式</div>
    <div class="modal-actions">
      <button class="modal-btn" type="button" @click="$emit('select-local')">选择本地目录</button>
      <button class="modal-btn" type="button" @click="$emit('select-github')">
        从 GitHub 添加
      </button>
      <button class="modal-btn primary" type="button" @click="$emit('select-remote')">
        远程服务器
      </button>
    </div>
  </div>
</template>

<style scoped>
@import './modal-styles.css';
</style>

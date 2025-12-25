<script setup lang="ts">
import type { Project, IDEConfig } from '../types'

interface Props {
  project: Project
  ideConfigs: IDEConfig[]
}

const props = defineProps<Props>()

const handleOpenIDE = (ide: IDEConfig): void => {
  // TODO: 实现IPC调用，在主进程中执行命令
  console.log(`Opening ${props.project.name} with ${ide.name} at ${props.project.path}`)
  // window.api?.openProject?.(props.project.path, ide.command)
}
</script>

<template>
  <div class="project-card">
    <div class="project-info">
      <div class="project-name">{{ project.name }}</div>
      <div class="project-path">{{ project.path }}</div>
      <div v-if="project.description" class="project-description">
        {{ project.description }}
      </div>
    </div>
    <div class="ide-buttons">
      <button
        v-for="ide in ideConfigs"
        :key="ide.id"
        class="ide-button"
        :title="`用 ${ide.name} 打开`"
        @click="handleOpenIDE(ide)"
      >
        <span class="ide-button-text">{{ ide.name }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.project-card {
  background-color: var(--ev-c-black-mute);
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: background-color 0.2s ease;
}

.project-card:hover {
  background-color: var(--ev-c-black-soft);
}

.project-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.project-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--ev-c-text-1);
  line-height: 1.4;
}

.project-path {
  font-size: 13px;
  color: var(--ev-c-text-2);
  font-family:
    ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
  line-height: 1.4;
}

.project-description {
  font-size: 14px;
  color: var(--ev-c-text-3);
  line-height: 1.4;
  margin-top: 4px;
}

.ide-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

.ide-button {
  padding: 6px 14px;
  border: none;
  border-radius: 6px;
  background-color: var(--ev-c-gray-3);
  color: var(--ev-c-text-1);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-family: inherit;
}

.ide-button:hover {
  background-color: var(--ev-c-gray-2);
}

.ide-button:active {
  background-color: var(--ev-c-gray-1);
}

.ide-button-text {
  display: inline-block;
}
</style>

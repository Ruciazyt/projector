<script setup lang="ts">
import type { Project, IDEConfig } from '../types'

interface Props {
  project: Project
  ideConfigs: IDEConfig[]
}

const props = defineProps<Props>()

const handleOpenIDE = async (ide: IDEConfig): Promise<void> => {
  try {
    const result = await window.api.openProject(props.project.path, ide.command)
    if (!result.success) {
      alert(`无法打开项目: ${result.error || '未知错误'}`)
    }
  } catch (error) {
    console.error('Failed to open project:', error)
    alert('打开项目失败')
  }
}
</script>

<template>
  <div class="project-card">
    <div class="project-main">
      <div class="project-name">{{ project.name }}</div>
      <div class="project-path">{{ project.path }}</div>
    </div>
    <div class="project-actions">
      <div v-if="project.description" class="project-description">
        {{ project.description }}
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
  </div>
</template>

<style scoped>
.project-card {
  background-color: var(--ev-c-black-mute);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform, box-shadow;
  animation: slideInUp 0.4s ease-out backwards;
  flex: 0 0 calc(33.333% - 11px);
  min-width: 300px;
  max-width: 100%;
}

.project-card:hover {
  background-color: var(--ev-c-black-soft);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.1);
}

.project-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.project-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--ev-c-text-1);
  line-height: 1.3;
}

.project-path {
  font-size: 13px;
  color: var(--ev-c-text-2);
  font-family:
    ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.project-description {
  flex: 1;
  font-size: 14px;
  color: var(--ev-c-text-3);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.ide-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  flex-shrink: 0;
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
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: inherit;
  position: relative;
  overflow: hidden;
}

.ide-button::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  transform: translate(-50%, -50%);
  transition:
    width 0.3s,
    height 0.3s;
}

.ide-button:hover {
  background-color: var(--ev-c-gray-2);
  transform: scale(1.05);
}

.ide-button:active {
  background-color: var(--ev-c-gray-1);
  transform: scale(0.98);
}

.ide-button:active::before {
  width: 200px;
  height: 200px;
}

.ide-button-text {
  display: inline-block;
  position: relative;
  z-index: 1;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 1024px) {
  .project-card {
    flex: 0 0 calc(50% - 8px);
  }
}

@media (max-width: 640px) {
  .project-card {
    flex: 0 0 100%;
    min-width: auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .project-card {
    animation: none;
    transition: background-color 0.2s ease;
  }

  .project-card:hover {
    transform: none;
  }

  .ide-button:hover {
    transform: none;
  }
}
</style>

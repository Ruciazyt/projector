<script setup lang="ts">
import { ref, computed } from 'vue'
import ProjectCard from './components/ProjectCard.vue'
import type { Project, IDEConfig } from './types'

const searchQuery = ref('')

const ideConfigs: IDEConfig[] = [
  { id: 'vscode', name: 'VS Code', command: 'code' },
  { id: 'webstorm', name: 'WebStorm', command: 'webstorm' },
  { id: 'pycharm', name: 'PyCharm', command: 'pycharm' },
  { id: 'sublime', name: 'Sublime', command: 'subl' }
]

const projects = ref<Project[]>([
  {
    id: '1',
    name: 'Projector',
    path: 'D:\\personal_projects\\projector',
    description: '项目启动器桌面应用'
  },
  {
    id: '2',
    name: 'My Web App',
    path: 'D:\\projects\\web-app',
    description: 'Vue 3 + TypeScript 项目'
  },
  {
    id: '3',
    name: 'Backend API',
    path: 'C:\\dev\\backend-api',
    description: 'Node.js 后端服务'
  }
])

const filteredProjects = computed(() => {
  if (!searchQuery.value.trim()) {
    return projects.value
  }
  const query = searchQuery.value.toLowerCase()
  return projects.value.filter(
    (p) =>
      p.name.toLowerCase().includes(query) ||
      p.path.toLowerCase().includes(query) ||
      p.description?.toLowerCase().includes(query)
  )
})

const handleAddProject = (): void => {
  // TODO: 实现添加项目功能
  console.log('Add project')
}

const handleScanDirectory = (): void => {
  // TODO: 实现扫描目录功能
  console.log('Scan directory')
}
</script>

<template>
  <div class="app-container">
    <header class="app-header">
      <h1 class="app-title">项目启动器</h1>
      <div class="header-actions">
        <button class="header-button" @click="handleScanDirectory">扫描目录</button>
        <button class="header-button primary" @click="handleAddProject">添加项目</button>
      </div>
    </header>

    <div class="search-container">
      <input v-model="searchQuery" type="text" class="search-input" placeholder="搜索项目..." />
    </div>

    <div class="project-list-container">
      <div v-if="filteredProjects.length === 0" class="empty-state">
        <p class="empty-text">没有找到项目</p>
      </div>
      <div v-else class="project-list">
        <ProjectCard
          v-for="project in filteredProjects"
          :key="project.id"
          :project="project"
          :ide-configs="ideConfigs"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-background);
  overflow: hidden;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--ev-c-gray-3);
}

.app-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--ev-c-text-1);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.header-button {
  padding: 8px 16px;
  border: 1px solid var(--ev-c-gray-3);
  border-radius: 6px;
  background-color: var(--ev-c-gray-3);
  color: var(--ev-c-text-1);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.header-button:hover {
  background-color: var(--ev-c-gray-2);
  border-color: var(--ev-c-gray-2);
}

.header-button.primary {
  background-color: var(--ev-c-gray-2);
  border-color: var(--ev-c-gray-2);
}

.header-button.primary:hover {
  background-color: var(--ev-c-gray-1);
  border-color: var(--ev-c-gray-1);
}

.search-container {
  padding: 16px 24px;
  border-bottom: 1px solid var(--ev-c-gray-3);
}

.search-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--ev-c-gray-3);
  border-radius: 6px;
  background-color: var(--ev-c-black-mute);
  color: var(--ev-c-text-1);
  font-size: 14px;
  font-family: inherit;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--ev-c-gray-2);
  background-color: var(--ev-c-black-soft);
}

.search-input::placeholder {
  color: var(--ev-c-text-3);
}

.project-list-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.project-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 1200px;
  margin: 0 auto;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.empty-text {
  color: var(--ev-c-text-3);
  font-size: 16px;
}
</style>

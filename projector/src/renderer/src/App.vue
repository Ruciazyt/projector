<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import ProjectCard from './components/ProjectCard.vue'
import type { Project, IDEConfig } from './types'

const searchQuery = ref('')

const ideConfigs: IDEConfig[] = [
  { id: 'cursor', name: 'Cursor', command: 'cursor' },
  { id: 'vscode', name: 'VS Code', command: 'code' },
  { id: 'webstorm', name: 'WebStorm', command: 'webstorm' },
  { id: 'pycharm', name: 'PyCharm', command: 'pycharm' },
  { id: 'sublime', name: 'Sublime', command: 'subl' }
]

const projects = ref<Project[]>([])

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

// 加载项目列表
const loadProjects = async (): Promise<void> => {
  try {
    const loadedProjects = await window.api.getProjects()
    projects.value = loadedProjects
  } catch (error) {
    console.error('Failed to load projects:', error)
  }
}

// 添加项目
const handleAddProject = async (): Promise<void> => {
  try {
    const selectedPath = await window.api.showOpenDialog()
    if (!selectedPath) {
      return
    }

    const newProject = await window.api.addProject(selectedPath)
    if (newProject) {
      await loadProjects()
    } else {
      alert('无法添加项目：该目录不包含编辑器配置文件')
    }
  } catch (error) {
    console.error('Failed to add project:', error)
    alert('添加项目失败')
  }
}

// 扫描目录
const handleScanDirectory = async (): Promise<void> => {
  try {
    const selectedPath = await window.api.showOpenDialog()
    if (!selectedPath) {
      return
    }

    const foundProjects = await window.api.scanDirectory(selectedPath)
    await loadProjects()

    if (foundProjects.length === 0) {
      alert('未找到项目')
    } else {
      alert(`找到 ${foundProjects.length} 个项目`)
    }
  } catch (error) {
    console.error('Failed to scan directory:', error)
    alert('扫描目录失败')
  }
}

// 组件挂载时加载项目
onMounted(() => {
  loadProjects()
})
</script>

<template>
  <div class="app-container">
    <div class="toolbar">
      <div class="search-wrapper">
        <svg class="search-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M7.333 12.667A5.333 5.333 0 1 0 7.333 2a5.333 5.333 0 0 0 0 10.667ZM14 14l-2.9-2.9"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <input v-model="searchQuery" type="text" class="search-input" placeholder="搜索项目..." />
      </div>
      <button class="toolbar-button" @click="handleScanDirectory">
        <svg class="button-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M2.667 4.667h10.666M2.667 8h10.666M2.667 11.333h6.666M12 10l2 2-2 2"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <span>扫描目录</span>
      </button>
      <button class="toolbar-button primary" @click="handleAddProject">
        <svg class="button-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M8 3.333v9.334M3.333 8h9.334"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <span>添加项目</span>
      </button>
    </div>

    <div class="project-list-container">
      <div v-if="filteredProjects.length === 0" class="empty-state">
        <p class="empty-text">没有找到项目</p>
      </div>
      <TransitionGroup v-else name="project-list" tag="div" class="project-list">
        <ProjectCard
          v-for="(project, index) in filteredProjects"
          :key="project.id"
          :project="project"
          :ide-configs="ideConfigs"
          :style="{ animationDelay: `${index * 0.05}s` }"
        />
      </TransitionGroup>
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

.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  border-bottom: 1px solid var(--ev-c-gray-3);
}

.search-wrapper {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  width: 16px;
  height: 16px;
  color: var(--ev-c-text-3);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 10px 14px 10px 36px;
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

.search-wrapper:focus-within .search-icon {
  color: var(--ev-c-text-2);
}

.search-input::placeholder {
  color: var(--ev-c-text-3);
}

.toolbar-button {
  display: flex;
  align-items: center;
  gap: 6px;
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
  white-space: nowrap;
}

.toolbar-button:hover {
  background-color: var(--ev-c-gray-2);
  border-color: var(--ev-c-gray-2);
}

.toolbar-button.primary {
  background-color: var(--ev-c-gray-2);
  border-color: var(--ev-c-gray-2);
}

.toolbar-button.primary:hover {
  background-color: var(--ev-c-gray-1);
  border-color: var(--ev-c-gray-1);
}

.button-icon {
  width: 16px;
  height: 16px;
  color: currentColor;
  flex-shrink: 0;
}

.project-list-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.project-list {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 16px;
  max-width: 1400px;
  margin: 0 auto;
}

.project-list-enter-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.project-list-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.project-list-enter-from {
  opacity: 0;
  transform: translateY(10px) scale(0.95);
}

.project-list-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

.project-list-move {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@media (prefers-reduced-motion: reduce) {
  .project-list-enter-active,
  .project-list-leave-active,
  .project-list-move {
    transition: none;
  }

  .project-list-enter-from,
  .project-list-leave-to {
    transform: none;
  }
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

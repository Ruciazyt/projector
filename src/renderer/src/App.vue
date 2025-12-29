<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import ProjectCard from './components/ProjectCard.vue'
import AddProjectFlowModal from './components/AddProjectFlowModal.vue'
import type { Project, IDEConfig } from './types'
import { IDE_LIST } from '../../shared/ide'
import {
  FiChevronLeft,
  FiExternalLink,
  FiFolder,
  FiMoon,
  FiPlus,
  FiSearch,
  FiSun
} from 'vue-icons-plus/fi'

const searchQuery = ref('')
const scanButtonRef = ref<HTMLButtonElement | null>(null)
const addButtonRef = ref<HTMLButtonElement | null>(null)
const buttonBackgroundRef = ref<HTMLDivElement | null>(null)
const activeButton = ref<'scan' | 'add' | null>(null)

const ideConfigs: IDEConfig[] = IDE_LIST.map((x) => ({
  id: x.id,
  name: x.name,
  command: x.command
}))

const projects = ref<Project[]>([])
const recentSidebarCollapsed = ref(false)
const theme = ref<'light' | 'dark'>('dark')

const addFlowOpen = ref(false)

const loadRecentSidebarCollapsed = async (): Promise<void> => {
  try {
    recentSidebarCollapsed.value = await window.api.getRecentSidebarCollapsed()
  } catch (error) {
    console.error('Failed to load recent sidebar state:', error)
  }
}

const loadTheme = async (): Promise<void> => {
  try {
    const loadedTheme = await window.api.getTheme()
    theme.value = loadedTheme
    applyTheme(loadedTheme)
  } catch (error) {
    console.error('Failed to load theme:', error)
  }
}

const applyTheme = (newTheme: 'light' | 'dark'): void => {
  document.documentElement.setAttribute('data-theme', newTheme)
}

const toggleTheme = async (): Promise<void> => {
  const newTheme = theme.value === 'dark' ? 'light' : 'dark'
  theme.value = newTheme
  applyTheme(newTheme)
  try {
    await window.api.setTheme(newTheme)
  } catch (error) {
    console.error('Failed to save theme:', error)
  }
}

watch(
  recentSidebarCollapsed,
  async (collapsed) => {
    try {
      await window.api.setRecentSidebarCollapsed(collapsed)
    } catch (error) {
      console.error('Failed to save recent sidebar state:', error)
    }
  },
  { flush: 'post' }
)

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

const recentProjects = computed(() => {
  return filteredProjects.value
    .filter((p) => typeof p.lastOpened === 'number' && Number.isFinite(p.lastOpened))
    .slice()
    .sort((a, b) => (b.lastOpened ?? 0) - (a.lastOpened ?? 0))
    .slice(0, 8)
})

const handleOpenRecent = async (project: Project): Promise<void> => {
  const preferred = ideConfigs.find((x) => x.id === project.preferredIdeId) ?? ideConfigs[0]
  try {
    const result = await window.api.openProject(project, preferred.command)
    if (!result.success) {
      alert(`无法打开项目: ${result.error || '未知错误'}`)
      return
    }
    await loadProjects()
  } catch (error) {
    console.error('Failed to open project:', error)
    alert('打开项目失败')
  }
}

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
const handleAddProject = async (event?: Event): Promise<void> => {
  event?.preventDefault()
  event?.stopPropagation()
  addFlowOpen.value = true
}

// 扫描目录
const handleScanDirectory = async (event?: Event): Promise<void> => {
  event?.preventDefault()
  event?.stopPropagation()
  try {
    if (!window.api) {
      alert('API 未初始化')
      return
    }
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
    alert(`扫描目录失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

// 移动背景到指定按钮
const moveBackgroundToButton = (buttonType: 'scan' | 'add'): void => {
  const button = buttonType === 'scan' ? scanButtonRef.value : addButtonRef.value
  const background = buttonBackgroundRef.value
  const container = button?.parentElement
  if (!button || !background || !container) return

  const buttonRect = button.getBoundingClientRect()
  const containerRect = container.getBoundingClientRect()
  const left = buttonRect.left - containerRect.left
  const width = buttonRect.width
  const height = buttonRect.height

  background.style.left = `${left}px`
  background.style.width = `${width}px`
  background.style.height = `${height}px`
  background.style.opacity = '1'
  // 确保背景元素不会拦截点击
  background.style.pointerEvents = 'none'

  // 根据按钮类型设置背景色
  if (buttonType === 'add') {
    background.style.backgroundColor = 'var(--color-02)'
  } else {
    background.style.backgroundColor = 'rgba(112, 125, 166, 0.15)'
  }

  activeButton.value = buttonType
}

// 处理按钮鼠标进入
const handleButtonEnter = (buttonType: 'scan' | 'add'): void => {
  if (activeButton.value && activeButton.value !== buttonType) {
    // 从另一个按钮移动过来，需要动画
    nextTick(() => {
      moveBackgroundToButton(buttonType)
    })
  } else {
    // 直接进入，立即显示
    moveBackgroundToButton(buttonType)
  }
}

// 处理按钮鼠标离开
const handleButtonLeave = (): void => {
  // 不立即隐藏，等待移动到另一个按钮
}

// 处理工具栏鼠标离开
const handleToolbarLeave = (event: MouseEvent): void => {
  // 如果鼠标移动到按钮上，不隐藏背景
  const target = event.relatedTarget as HTMLElement
  if (target && (target.closest('.toolbar-button') || target.closest('.button-container'))) {
    return
  }
  activeButton.value = null
  const background = buttonBackgroundRef.value
  if (background) {
    background.style.opacity = '0'
  }
}

// 组件挂载时加载项目
onMounted(() => {
  loadProjects()
  loadRecentSidebarCollapsed()
  loadTheme()
})
</script>

<template>
  <div class="app-container">
    <div class="toolbar">
      <div class="search-wrapper">
        <FiSearch class="search-icon" />
        <input v-model="searchQuery" type="text" class="search-input" placeholder="搜索项目..." />
      </div>
      <button
        class="theme-toggle"
        type="button"
        :title="theme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'"
        @click="toggleTheme"
      >
        <FiSun v-if="theme === 'dark'" class="theme-icon" />
        <FiMoon v-else class="theme-icon" />
      </button>
      <div class="button-container" @mouseleave="handleToolbarLeave">
        <div ref="buttonBackgroundRef" class="button-background"></div>
        <button
          ref="scanButtonRef"
          class="toolbar-button"
          type="button"
          @click="handleScanDirectory"
          @mouseenter="handleButtonEnter('scan')"
          @mouseleave="handleButtonLeave"
        >
          <FiFolder class="button-icon" />
          <span>扫描目录</span>
        </button>
        <button
          ref="addButtonRef"
          class="toolbar-button primary"
          type="button"
          @click="handleAddProject"
          @mouseenter="handleButtonEnter('add')"
          @mouseleave="handleButtonLeave"
        >
          <FiPlus class="button-icon" />
          <span>添加项目</span>
        </button>
      </div>
    </div>

    <AddProjectFlowModal v-model:open="addFlowOpen" @added="loadProjects()" />

    <div class="content" :class="{ collapsed: recentSidebarCollapsed }">
      <aside class="recent-column" :class="{ collapsed: recentSidebarCollapsed }">
        <div class="column-header">
          <Transition name="fade-slide">
            <div v-show="!recentSidebarCollapsed" class="column-title">最近打开</div>
          </Transition>
          <button
            class="collapse-toggle"
            type="button"
            :title="recentSidebarCollapsed ? '展开' : '收起'"
            @click="recentSidebarCollapsed = !recentSidebarCollapsed"
          >
            <FiChevronLeft class="collapse-icon" />
          </button>
        </div>

        <div v-if="recentProjects.length === 0" class="recent-empty">暂无记录</div>

        <div v-else class="recent-list" :class="{ collapsed: recentSidebarCollapsed }">
          <div v-for="project in recentProjects" :key="project.id" class="recent-item">
            <Transition name="fade-slide">
              <div v-show="!recentSidebarCollapsed" class="recent-name-only" :title="project.name">
                {{ project.name }}
              </div>
            </Transition>
            <button
              v-show="!recentSidebarCollapsed"
              class="recent-open-icon"
              type="button"
              :title="recentSidebarCollapsed ? `打开：${project.name}` : '打开'"
              @click="handleOpenRecent(project)"
            >
              <FiExternalLink class="recent-open-icon-svg" />
            </button>
          </div>
        </div>
      </aside>

      <section class="list-column">
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
            @deleted="loadProjects()"
            @opened="loadProjects()"
            @updated="loadProjects()"
          />
        </TransitionGroup>
      </section>
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
  border-bottom: none;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
  position: relative;
}

[data-theme='light'] .toolbar {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.button-container {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  z-index: 0;
}

.button-background {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background-color: rgba(112, 125, 166, 0.15);
  border-radius: 8px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0;
  pointer-events: none !important;
  z-index: 0;
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
  color: var(--color-02);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 10px 14px 10px 36px;
  border: none;
  border-radius: 8px;
  background-color: rgba(204, 173, 157, 0.05);
  color: var(--ev-c-text-1);
  font-size: 14px;
  font-family: inherit;
  transition: all 0.2s ease;
  box-shadow:
    0 1px 2px rgba(12, 11, 16, 0.08),
    inset 0 1px 1px rgba(112, 125, 166, 0.05);
}

.search-input:focus {
  outline: none;
  background-color: rgba(204, 173, 157, 0.1);
  box-shadow:
    0 2px 4px rgba(12, 11, 16, 0.12),
    0 0 0 3px rgba(112, 125, 166, 0.15),
    inset 0 1px 1px rgba(112, 125, 166, 0.08);
}

.search-wrapper:focus-within .search-icon {
  color: var(--color-02);
}

.search-input::placeholder {
  color: var(--ev-c-text-3);
}

.theme-toggle {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background-color: rgba(112, 125, 166, 0.12);
  color: var(--ev-c-text-1);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
  margin-right: 8px;
}

.theme-toggle:hover {
  background-color: rgba(112, 125, 166, 0.22);
  color: #ffffff;
}

.theme-icon {
  width: 18px;
  height: 18px;
  color: currentColor;
}

.toolbar-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background-color: transparent;
  color: var(--ev-c-text-1);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.3s ease;
  font-family: inherit;
  white-space: nowrap;
  position: relative;
  z-index: 10;
  pointer-events: auto !important;
  user-select: none;
  -webkit-user-select: none;
}

.toolbar-button:hover {
  color: #ffffff;
}

.button-icon {
  width: 16px;
  height: 16px;
  color: currentColor;
  flex-shrink: 0;
}

.content {
  flex: 1;
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 16px;
  padding: 16px 20px;
  min-width: 0;
  box-sizing: border-box;
  overflow: hidden;
  transition: grid-template-columns 0.22s cubic-bezier(0.2, 0, 0, 1);
}

.content.collapsed {
  grid-template-columns: 52px 1fr;
}

.recent-column {
  background-color: rgba(204, 173, 157, 0.05);
  border-radius: 16px;
  box-shadow:
    0 1px 3px rgba(12, 11, 16, 0.1),
    0 0 0 0.5px rgba(112, 125, 166, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
  padding: 14px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-width: 0;
  transition:
    width 0.22s cubic-bezier(0.2, 0, 0, 1),
    padding 0.22s cubic-bezier(0.2, 0, 0, 1);
}

.recent-column.collapsed {
  padding: 8px;
}

.column-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(112, 125, 166, 0.12);
}

.collapse-toggle {
  border: none;
  background: rgba(112, 125, 166, 0.12);
  color: var(--ev-c-text-1);
  width: 28px;
  height: 28px;
  border-radius: 10px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.collapse-toggle:hover {
  background: rgba(112, 125, 166, 0.22);
}

.collapse-icon {
  width: 16px;
  height: 16px;
  color: currentColor;
  transition: transform 0.2s ease;
}

.recent-column.collapsed .collapse-icon {
  transform: rotate(180deg);
}

.column-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--ev-c-text-1);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  max-width: 180px;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition:
    opacity 0.16s ease,
    transform 0.22s cubic-bezier(0.2, 0, 0, 1);
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}

.recent-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ev-c-text-3);
  font-size: 13px;
}

.recent-list {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: hidden;
}

.recent-list.collapsed {
  gap: 8px;
}

.recent-item {
  background-color: rgba(204, 173, 157, 0.06);
  border-radius: 14px;
  padding: 10px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.recent-name-only {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-03);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  flex: 1;
  max-width: 200px;
}

.recent-open-icon {
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 12px;
  background-color: rgba(112, 125, 166, 0.18);
  color: var(--ev-c-text-1);
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.recent-open-icon:hover {
  background-color: var(--color-02);
  color: #ffffff;
}

.recent-open-icon:active {
  transform: scale(0.98);
}

.recent-open-icon-svg {
  width: 16px;
  height: 16px;
  color: currentColor;
}

.recent-column.collapsed .recent-item {
  padding: 6px;
}

.list-column {
  overflow-y: auto;
  overflow-x: hidden;
  min-width: 0;
  padding-right: 2px;
}

.list-column::-webkit-scrollbar {
  width: 10px;
}

.list-column::-webkit-scrollbar-track {
  background: rgba(112, 125, 166, 0.08);
  border-radius: 12px;
}

.list-column::-webkit-scrollbar-thumb {
  background: rgba(112, 125, 166, 0.28);
  border-radius: 12px;
  border: 2px solid rgba(12, 11, 16, 0.6);
}

.list-column::-webkit-scrollbar-thumb:hover {
  background: rgba(112, 125, 166, 0.42);
}

.project-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  box-sizing: border-box;
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

@media (max-width: 980px) {
  .content {
    grid-template-columns: 1fr;
  }

  .recent-column {
    order: 1;
  }

  .list-column {
    order: 2;
  }
}
</style>

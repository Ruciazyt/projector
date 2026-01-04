<script setup lang="ts">
import { ref, onMounted } from 'vue'
import ProjectCard from './components/ProjectCard.vue'
import AddProjectFlowModal from './components/AddProjectFlowModal.vue'
import {
  FiChevronLeft,
  FiExternalLink,
  FiFolder,
  FiMoon,
  FiPlus,
  FiSearch,
  FiSun,
  FiTrash2,
  FiMoreVertical
} from 'vue-icons-plus/fi'
import { useTheme } from './composables/useTheme'
import { useSidebar } from './composables/useSidebar'
import { useProjects } from './composables/useProjects'
import { useBatchSelection } from './composables/useBatchSelection'
import { useProjectActions } from './composables/useProjectActions'
import { useToolbarAnimation } from './composables/useToolbarAnimation'
import { useMenu } from './composables/useMenu'

// 主题管理
const { theme, loadTheme, toggleTheme } = useTheme()

// 侧边栏管理
const { recentSidebarCollapsed, loadRecentSidebarCollapsed } = useSidebar()

// 项目列表管理
const {
  projects,
  searchQuery,
  ideConfigs,
  filteredProjects,
  localProjects,
  remoteProjects,
  recentProjects,
  loadProjects,
  handleProjectDeleted
} = useProjects()

// 批量选择管理
const {
  batchMode,
  selectedProjects,
  toggleBatchMode,
  toggleSelectAll,
  toggleSelectAllLocal,
  toggleSelectAllRemote,
  toggleProjectSelection,
  handleBatchDelete
} = useBatchSelection(
  () => filteredProjects.value,
  () => localProjects.value,
  () => remoteProjects.value,
  projects
)

// 项目操作
const { addFlowOpen, handleAddProject, handleScanDirectory, handleOpenRecent } = useProjectActions(
  ideConfigs,
  loadProjects
)

// 工具栏动画
const {
  scanButtonRef,
  addButtonRef,
  buttonBackgroundRef,
  handleButtonEnter,
  handleButtonLeave,
  handleToolbarLeave
} = useToolbarAnimation()

// 菜单管理
const { menuOpen, menuRef } = useMenu()

// 分组收起状态
const localGroupCollapsed = ref(false)
const remoteGroupCollapsed = ref(false)

// 批量删除处理（包装 handleBatchDelete）
const handleBatchDeleteWrapper = async (): Promise<void> => {
  await handleBatchDelete()
}

// 切换批量模式时关闭菜单
const toggleBatchModeWithMenu = (): void => {
  toggleBatchMode()
  menuOpen.value = false
}

// 处理项目删除（同时更新选中状态）
const handleProjectDeletedWrapper = (projectPath: string): void => {
  handleProjectDeleted(projectPath)
  selectedProjects.value.delete(projectPath)
}

// 组件挂载时加载数据
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
        <div ref="menuRef" class="toolbar-menu-wrapper">
          <button
            class="toolbar-menu-button"
            type="button"
            :class="{ active: menuOpen }"
            @click="menuOpen = !menuOpen"
          >
            <FiMoreVertical class="menu-icon" />
          </button>
          <Transition name="menu-dropdown">
            <div v-if="menuOpen" class="toolbar-menu">
              <button class="menu-item" type="button" @click="toggleBatchModeWithMenu">
                <span>批量操作</span>
              </button>
            </div>
          </Transition>
        </div>
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
        <div v-else class="project-list">
          <!-- 批量操作工具栏 -->
          <Transition name="batch-toolbar">
            <div v-if="batchMode" class="batch-toolbar">
              <div class="batch-toolbar-left">
                <label class="batch-checkbox">
                  <input
                    type="checkbox"
                    :checked="
                      selectedProjects.size === filteredProjects.length &&
                      filteredProjects.length > 0
                    "
                    @change="toggleSelectAll"
                  />
                  <span>全选</span>
                </label>
                <span class="batch-count">已选择 {{ selectedProjects.size }} 项</span>
              </div>
              <button class="batch-delete-button" type="button" @click="handleBatchDeleteWrapper">
                <FiTrash2 class="batch-delete-icon" />
                删除选中
              </button>
              <button class="batch-cancel-button" type="button" @click="toggleBatchModeWithMenu">
                取消
              </button>
            </div>
          </Transition>
          <!-- 本地项目分组 -->
          <div v-if="localProjects.length > 0" class="project-group">
            <div class="group-header">
              <div class="group-header-left" @click="localGroupCollapsed = !localGroupCollapsed">
                <FiChevronLeft
                  class="group-collapse-icon"
                  :class="{ collapsed: localGroupCollapsed }"
                />
                <h2 class="group-title">本地项目</h2>
                <span class="group-count">{{ localProjects.length }}</span>
              </div>
              <label v-if="batchMode" class="group-select-all" @click.stop>
                <input
                  type="checkbox"
                  :checked="
                    localProjects.every((p) => selectedProjects.has(p.path)) &&
                    localProjects.length > 0
                  "
                  @change="toggleSelectAllLocal"
                />
                <span>全选</span>
              </label>
            </div>
            <div v-show="!localGroupCollapsed" class="group-items-wrapper">
              <TransitionGroup name="project-list" tag="div" class="group-items">
                <ProjectCard
                  v-for="project in localProjects"
                  :key="project.id"
                  :project="project"
                  :ide-configs="ideConfigs"
                  :batch-mode="batchMode"
                  :selected="selectedProjects.has(project.path)"
                  @deleted="handleProjectDeletedWrapper"
                  @opened="loadProjects()"
                  @updated="loadProjects()"
                  @toggle-selection="(path) => toggleProjectSelection(path)"
                />
              </TransitionGroup>
            </div>
          </div>

          <!-- 远程项目分组 -->
          <div v-if="remoteProjects.length > 0" class="project-group">
            <div class="group-header">
              <div class="group-header-left" @click="remoteGroupCollapsed = !remoteGroupCollapsed">
                <FiChevronLeft
                  class="group-collapse-icon"
                  :class="{ collapsed: remoteGroupCollapsed }"
                />
                <h2 class="group-title">远程项目</h2>
                <span class="group-count">{{ remoteProjects.length }}</span>
              </div>
              <label v-if="batchMode" class="group-select-all" @click.stop>
                <input
                  type="checkbox"
                  :checked="
                    remoteProjects.every((p) => selectedProjects.has(p.path)) &&
                    remoteProjects.length > 0
                  "
                  @change="toggleSelectAllRemote"
                />
                <span>全选</span>
              </label>
            </div>
            <div v-show="!remoteGroupCollapsed" class="group-items-wrapper">
              <TransitionGroup name="project-list" tag="div" class="group-items">
                <ProjectCard
                  v-for="project in remoteProjects"
                  :key="project.id"
                  :project="project"
                  :ide-configs="ideConfigs"
                  :batch-mode="batchMode"
                  :selected="selectedProjects.has(project.path)"
                  @deleted="handleProjectDeletedWrapper"
                  @opened="loadProjects()"
                  @updated="loadProjects()"
                  @toggle-selection="(path) => toggleProjectSelection(path)"
                />
              </TransitionGroup>
            </div>
          </div>
        </div>
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
  gap: 16px;
  padding: 20px 32px;
  border-bottom: 1px solid var(--color-card-border);
  position: relative;
  background: var(--color-background);
  backdrop-filter: blur(8px);
}

.button-container {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  z-index: 0;
}

.button-background {
  display: none;
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
  color: var(--ev-c-text-2);
  pointer-events: none;
  transition:
    color 0.2s ease,
    transform 0.2s ease;
}

.search-wrapper:focus-within .search-icon {
  color: var(--color-primary);
  transform: scale(1.1);
}

.search-input {
  width: 100%;
  padding: 10px 14px 10px 36px;
  border: 3px solid var(--color-card-border);
  border-radius: 0;
  background-color: var(--color-card-bg);
  color: var(--ev-c-text-1);
  font-size: 14px;
  font-family: inherit;
  font-weight: 500;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.1s ease;
  box-shadow: 2px 2px 0 0 var(--color-card-border);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  background-color: var(--color-background);
  transform: translate(-1px, -1px);
  box-shadow: 3px 3px 0 0 var(--color-primary);
}

.search-input::placeholder {
  color: var(--ev-c-text-3);
}

.search-wrapper:focus-within .search-icon {
  color: var(--color-primary);
  transform: scale(1.1);
}

.theme-toggle {
  width: 36px;
  height: 36px;
  border: 3px solid var(--color-card-border);
  border-radius: 0;
  background-color: transparent;
  color: var(--ev-c-text-2);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition:
    border-color 0.15s ease,
    color 0.15s ease,
    background-color 0.15s ease,
    transform 0.1s ease,
    box-shadow 0.1s ease;
  flex-shrink: 0;
  box-shadow: 2px 2px 0 0 var(--color-card-border);
}

.theme-toggle:hover {
  background-color: var(--ev-c-gray-2);
  border-color: var(--ev-c-gray-1);
  color: var(--ev-c-text-1);
  transform: translate(-1px, -1px);
  box-shadow: 3px 3px 0 0 var(--color-card-border);
}

.theme-icon {
  width: 18px;
  height: 18px;
  color: currentColor;
}

.toolbar-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: 3px solid var(--color-card-border);
  border-radius: 0;
  background-color: transparent;
  color: var(--ev-c-text-bg);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease,
    color 0.15s ease,
    transform 0.1s ease,
    box-shadow 0.1s ease;
  font-family: inherit;
  white-space: nowrap;
  position: relative;
  z-index: 10;
  pointer-events: auto !important;
  user-select: none;
  -webkit-user-select: none;
  box-shadow: 2px 2px 0 0 var(--color-card-border);
}

.toolbar-button:hover {
  background-color: var(--ev-c-gray-2);
  border-color: var(--ev-c-gray-1);
  transform: translate(-1px, -1px);
  box-shadow: 3px 3px 0 0 var(--color-card-border);
}

.toolbar-button:active {
  transform: translate(0, 0);
  box-shadow: 2px 2px 0 0 var(--color-card-border);
}

.toolbar-button.primary {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: #ffffff;
  box-shadow: 2px 2px 0 0 var(--color-primary);
}

.toolbar-button.primary:hover {
  background-color: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
  transform: translate(-1px, -1px);
  box-shadow: 3px 3px 0 0 var(--color-primary-hover);
}

.toolbar-button.primary:active {
  transform: translate(0, 0);
  box-shadow: 2px 2px 0 0 var(--color-card-border);
}

.toolbar-button.primary:active {
  transform: scale(0.96);
  background-color: var(--color-primary-hover);
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
  gap: 24px;
  padding: 24px 32px;
  min-width: 0;
  box-sizing: border-box;
  overflow: hidden;
  transition: grid-template-columns 0.22s cubic-bezier(0.2, 0, 0, 1);
}

.content.collapsed {
  grid-template-columns: 52px 1fr;
}

.recent-column {
  background-color: var(--color-card-bg);
  border-radius: 0;
  border: 3px solid var(--color-card-border);
  box-shadow: 4px 4px 0 0 var(--color-card-border);
  padding: 20px;
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
  padding-bottom: 12px;
  border-bottom: 3px solid var(--color-card-border);
}

.recent-column.collapsed .column-header {
  justify-content: center;
  padding-bottom: 8px;
}

.collapse-toggle {
  border: 3px solid var(--color-card-border);
  background: transparent;
  color: var(--ev-c-text-2);
  width: 28px;
  height: 28px;
  border-radius: 0;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease,
    color 0.15s ease,
    transform 0.1s ease,
    box-shadow 0.1s ease;
  box-shadow: 2px 2px 0 0 var(--color-card-border);
}

.collapse-toggle:hover {
  background: var(--ev-c-gray-2);
  border-color: var(--ev-c-gray-1);
  color: var(--ev-c-text-1);
  transform: translate(-1px, -1px);
  box-shadow: 3px 3px 0 0 var(--color-card-border);
}

.collapse-toggle:active {
  transform: translate(0, 0);
  box-shadow: 2px 2px 0 0 var(--color-card-border);
}

.collapse-icon {
  width: 16px;
  height: 16px;
  color: currentColor;
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.recent-column.collapsed .collapse-icon {
  transform: rotate(180deg);
}

.column-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--ev-c-text-1);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  max-width: 180px;
  letter-spacing: -0.01em;
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

.recent-column.collapsed .recent-empty {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  font-size: 12px;
  padding: 8px 0;
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
  background-color: transparent;
  border-radius: 0;
  padding: 12px;
  border: 3px solid var(--color-card-border);
  box-shadow: 2px 2px 0 0 var(--color-card-border);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  transition:
    background-color 0.15s ease,
    transform 0.15s ease,
    box-shadow 0.15s ease;
  cursor: default;
}

.recent-item:hover {
  background-color: var(--color-card-hover);
  transform: translate(-1px, -1px);
  box-shadow: 3px 3px 0 0 var(--color-card-border);
}

.recent-name-only {
  font-size: 14px;
  font-weight: 500;
  color: var(--ev-c-text-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  flex: 1;
  max-width: 200px;
  letter-spacing: -0.01em;
}

.recent-open-icon {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-card-border);
  border-radius: 0;
  background-color: transparent;
  color: var(--ev-c-text-2);
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease,
    color 0.15s ease,
    transform 0.1s ease,
    box-shadow 0.1s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 2px 2px 0 0 var(--color-card-border);
}

.recent-open-icon:hover {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: #ffffff;
  transform: translate(-1px, -1px);
  box-shadow: 3px 3px 0 0 var(--color-primary);
}

.recent-open-icon:active {
  transform: translate(0, 0);
  box-shadow: 2px 2px 0 0 var(--color-primary);
}

.recent-open-icon-svg {
  width: 16px;
  height: 16px;
  color: currentColor;
}

.recent-column.collapsed .recent-item {
  padding: 8px 6px;
  justify-content: center;
  align-items: center;
}

.list-column {
  overflow-y: auto;
  overflow-x: hidden;
  min-width: 0;
  padding-right: 12px;
  margin-right: 4px;
}

.list-column::-webkit-scrollbar {
  width: 12px;
}

.list-column::-webkit-scrollbar-track {
  background: var(--color-background);
  border-left: 3px solid var(--color-card-border);
}

.list-column::-webkit-scrollbar-thumb {
  background: var(--color-card-bg);
  border: 3px solid var(--color-card-border);
  border-radius: 0;
  box-shadow: 2px 2px 0 0 var(--color-card-border);
}

.list-column::-webkit-scrollbar-thumb:hover {
  background: var(--color-card-hover);
  box-shadow: 3px 3px 0 0 var(--color-card-border);
  transform: translate(-1px, -1px);
}

.project-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  box-sizing: border-box;
}

.batch-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background-color: var(--color-card-bg);
  border: 3px solid var(--color-card-border);
  border-radius: 0;
  box-shadow: 4px 4px 0 0 var(--color-card-border);
  margin-bottom: 16px;
  gap: 16px;
}

.batch-toolbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.batch-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  font-size: 14px;
  color: var(--ev-c-text-1);
}

.batch-checkbox input[type='checkbox'] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--color-primary);
  transition: transform 0.15s ease;
}

.batch-checkbox input[type='checkbox']:active {
  transform: scale(0.9);
}

.batch-count {
  font-size: 14px;
  color: var(--ev-c-text-2);
}

.batch-delete-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border: 3px solid var(--color-card-border);
  border-radius: 0;
  background-color: transparent;
  color: var(--color-danger);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    color 0.15s ease,
    transform 0.1s ease,
    box-shadow 0.1s ease;
  box-shadow: 2px 2px 0 0 var(--color-card-border);
}

.batch-delete-button:hover {
  background-color: var(--color-danger);
  color: #ffffff;
  transform: translate(-1px, -1px);
  box-shadow: 3px 3px 0 0 var(--color-card-border);
}

.batch-delete-button:active {
  transform: translate(0, 0);
  box-shadow: 2px 2px 0 0 var(--color-card-border);
}

.batch-delete-icon {
  width: 16px;
  height: 16px;
}

.batch-cancel-button {
  padding: 10px 20px;
  border: 3px solid var(--color-card-border);
  border-radius: 0;
  background-color: transparent;
  color: var(--ev-c-text-1);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease,
    transform 0.1s ease,
    box-shadow 0.1s ease;
  box-shadow: 2px 2px 0 0 var(--color-card-border);
}

.batch-cancel-button:hover {
  background-color: var(--ev-c-gray-2);
  border-color: var(--ev-c-gray-1);
  transform: translate(-1px, -1px);
  box-shadow: 3px 3px 0 0 var(--color-card-border);
}

.batch-cancel-button:active {
  transform: translate(0, 0);
  box-shadow: 2px 2px 0 0 var(--color-card-border);
}

/* 批量工具栏动画 */
.batch-toolbar-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.batch-toolbar-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.batch-toolbar-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

.batch-toolbar-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.98);
}

.toolbar-menu-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.toolbar-menu-button {
  width: 36px;
  height: 36px;
  border: 3px solid var(--color-card-border);
  border-radius: 0;
  background-color: transparent;
  color: var(--ev-c-text-bg);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease,
    color 0.15s ease,
    transform 0.1s ease,
    box-shadow 0.1s ease;
  margin-left: 8px;
  box-shadow: 2px 2px 0 0 var(--color-card-border);
}

.toolbar-menu-button:hover {
  background-color: var(--ev-c-gray-2);
  border-color: var(--ev-c-gray-1);
  color: var(--ev-c-text-bg);
  transform: translate(-1px, -1px);
  box-shadow: 3px 3px 0 0 var(--color-card-border);
}

.toolbar-menu-button:active {
  transform: translate(0, 0);
  box-shadow: 2px 2px 0 0 var(--color-card-border);
}

.toolbar-menu-button.active {
  background-color: var(--ev-c-gray-2);
  border-color: var(--ev-c-gray-1);
}

.menu-icon {
  width: 18px;
  height: 18px;
  color: currentColor;
}

.toolbar-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  min-width: 140px;
  background: var(--color-background-soft);
  border: 3px solid var(--color-card-border);
  border-radius: 0;
  box-shadow: 4px 4px 0 0 var(--color-card-border);
  padding: 4px;
  z-index: 1000;
}

.toolbar-menu .menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: none;
  border-radius: 0;
  background: transparent;
  color: var(--ev-c-text-1);
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
  text-align: left;
  transition:
    background-color 0.15s ease,
    transform 0.1s ease;
  user-select: none;
  -webkit-user-select: none;
}

.toolbar-menu .menu-item:hover {
  background: var(--ev-c-gray-2);
}

.toolbar-menu .menu-item:active {
  transform: scale(0.98);
  background: var(--ev-c-gray-1);
}

/* 菜单下拉动画 */
.menu-dropdown-enter-active {
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.menu-dropdown-leave-active {
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.menu-dropdown-enter-from {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}

.menu-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}

.project-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 3px solid var(--color-card-border);
  margin-bottom: 8px;
  user-select: none;
  transition: opacity 0.15s ease;
}

.group-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  flex: 1;
  transition: opacity 0.2s ease;
}

.group-header-left:hover {
  opacity: 0.8;
}

.group-select-all {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 13px;
  color: var(--ev-c-text-2);
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s ease;
  user-select: none;
}

.group-select-all:hover {
  background-color: rgba(112, 125, 166, 0.1);
  color: var(--ev-c-text-1);
}

.group-select-all input[type='checkbox'] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--color-primary);
  margin: 0;
  transition: transform 0.15s ease;
}

.group-select-all input[type='checkbox']:active {
  transform: scale(0.9);
}

.group-collapse-icon {
  width: 16px;
  height: 16px;
  color: var(--ev-c-text-3);
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
}

.group-collapse-icon.collapsed {
  transform: rotate(-90deg);
}

.group-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--ev-c-text-1);
  margin: 0;
  letter-spacing: 0;
}

.group-count {
  font-size: 12px;
  color: var(--ev-c-text-2);
  background: var(--ev-c-gray-2);
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
}

.group-items-wrapper {
  overflow: hidden;
  transition:
    max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.2s ease;
}

.group-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
}

.project-list-enter-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
  will-change: opacity, transform;
}

.project-list-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
  will-change: opacity, transform;
  position: absolute;
  width: 100%;
}

.project-list-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}

.project-list-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.project-list-move {
  transition: transform 0.2s ease;
  will-change: transform;
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

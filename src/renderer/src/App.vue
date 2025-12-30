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

/* 亮色模式下列标题边框更柔和 */
[data-theme='light'] .column-header {
  border-bottom: 1px solid rgba(112, 125, 166, 0.06);
}

.recent-column.collapsed .column-header {
  justify-content: center;
  padding-bottom: 8px;
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

/* 亮色模式下滚动条样式调整 */
[data-theme='light'] .list-column::-webkit-scrollbar-thumb {
  background: rgba(112, 125, 166, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.8);
}

[data-theme='light'] .list-column::-webkit-scrollbar-thumb:hover {
  background: rgba(112, 125, 166, 0.3);
}

[data-theme='light'] .list-column::-webkit-scrollbar-track {
  background: rgba(112, 125, 166, 0.04);
}

.project-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  box-sizing: border-box;
}

.batch-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: rgba(112, 125, 166, 0.1);
  border-radius: 12px;
  margin-bottom: 8px;
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
  accent-color: var(--color-02);
}

.batch-count {
  font-size: 14px;
  color: var(--ev-c-text-2);
}

.batch-delete-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background-color: rgba(134, 59, 52, 0.2);
  color: var(--ev-c-text-1);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.batch-delete-button:hover {
  background-color: rgba(134, 59, 52, 0.35);
  color: #ffffff;
}

.batch-delete-icon {
  width: 16px;
  height: 16px;
}

.batch-cancel-button {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background-color: rgba(112, 125, 166, 0.14);
  color: var(--ev-c-text-1);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.batch-cancel-button:hover {
  background-color: rgba(112, 125, 166, 0.24);
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
  border: none;
  border-radius: 8px;
  background-color: rgba(112, 125, 166, 0.14);
  color: var(--ev-c-text-1);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  margin-left: 8px;
}

.toolbar-menu-button:hover {
  background-color: rgba(112, 125, 166, 0.24);
}

.toolbar-menu-button.active {
  background-color: rgba(112, 125, 166, 0.3);
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
  background: var(--color-background);
  border: 1px solid rgba(112, 125, 166, 0.2);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  padding: 4px;
  z-index: 1000;
}

.toolbar-menu .menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--ev-c-text-1);
  cursor: pointer;
  font-size: 14px;
  text-align: left;
  transition: all 0.2s ease;
  user-select: none;
  -webkit-user-select: none;
}

.toolbar-menu .menu-item:hover {
  background: rgba(112, 125, 166, 0.2);
}

.toolbar-menu .menu-item:active {
  background: rgba(112, 125, 166, 0.25);
}

/* 菜单下拉动画 */
.menu-dropdown-enter-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
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
  padding: 8px 0;
  border-bottom: 1px solid rgba(112, 125, 166, 0.15);
  margin-bottom: 4px;
  user-select: none;
  transition: opacity 0.2s ease;
}

/* 亮色模式下分组标题边框更柔和 */
[data-theme='light'] .group-header {
  border-bottom: 1px solid rgba(112, 125, 166, 0.08);
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
  accent-color: var(--color-02);
  margin: 0;
}

.group-collapse-icon {
  width: 16px;
  height: 16px;
  color: var(--ev-c-text-3);
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.group-collapse-icon.collapsed {
  transform: rotate(-90deg);
}

.group-title {
  font-size: 14px;
  font-weight: 650;
  color: var(--ev-c-text-2);
  margin: 0;
  letter-spacing: 0.02em;
}

.group-count {
  font-size: 12px;
  color: var(--ev-c-text-3);
  background: rgba(112, 125, 166, 0.12);
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
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

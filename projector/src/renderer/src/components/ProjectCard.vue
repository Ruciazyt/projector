<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import type { Project, IDEConfig } from '../types'
import { FiChevronDown, FiTrash2 } from 'vue-icons-plus/fi'

interface Props {
  project: Project
  ideConfigs: IDEConfig[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'deleted'): void
  (e: 'opened'): void
  (e: 'updated'): void
}>()

const menuOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

const getPreferredIde = (): IDEConfig => {
  const preferred = props.ideConfigs.find((x) => x.id === props.project.preferredIdeId)
  return preferred ?? props.ideConfigs[0]
}

const handleOpen = async (): Promise<void> => {
  const ide = getPreferredIde()
  try {
    const result = await window.api.openProject(props.project.path, ide.command)
    if (!result.success) {
      alert(`无法打开项目: ${result.error || '未知错误'}`)
      return
    }
    emit('opened')
  } catch (error) {
    console.error('Failed to open project:', error)
    alert('打开项目失败')
  }
}

const handleChooseIde = async (ide: IDEConfig): Promise<void> => {
  try {
    const ok = await window.api.setProjectPreferredIde(props.project.path, ide.id)
    if (!ok) {
      alert('设置默认编辑器失败')
      return
    }
    emit('updated')
    menuOpen.value = false
  } catch (error) {
    console.error('Failed to set preferred IDE:', error)
    alert('设置默认编辑器失败')
  }
}

const handleDelete = async (): Promise<void> => {
  const ok = confirm(
    `删除项目记录？\n\n${props.project.name}\n${props.project.path}\n\n（仅删除应用内记录，不会删除磁盘目录）`
  )
  if (!ok) return
  try {
    const removed = await window.api.removeProject(props.project.path)
    if (!removed) {
      alert('删除失败：未找到该记录（可能已被删除）')
      return
    }
    emit('deleted')
  } catch (error) {
    console.error('Failed to remove project:', error)
    alert('删除失败')
  }
}

const onDocMouseDown = (event: MouseEvent): void => {
  const el = dropdownRef.value
  if (!el) return
  if (!el.contains(event.target as Node)) {
    menuOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('mousedown', onDocMouseDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocMouseDown)
})
</script>

<template>
  <div class="project-card" :class="{ 'menu-open': menuOpen }">
    <div class="project-header">
      <div class="project-title" :title="project.name">
        {{ project.name }}
        <span class="project-path" :title="project.path">{{ project.path }}</span>
      </div>
      <div ref="dropdownRef" class="open-controls">
        <button class="open-button" type="button" @click="handleOpen">打开</button>
        <button
          class="open-dropdown"
          type="button"
          title="选择编辑器"
          @click="menuOpen = !menuOpen"
        >
          <FiChevronDown class="chevron-icon" />
        </button>

        <Transition name="dropdown">
          <div v-if="menuOpen" class="open-menu">
            <button
              v-for="ide in ideConfigs"
              :key="ide.id"
              class="menu-item"
              type="button"
              @click="handleChooseIde(ide)"
            >
              <span class="menu-check" :class="{ checked: ide.id === project.preferredIdeId }"
                >✓</span
              >
              <span class="menu-text">{{ ide.name }}</span>
            </button>
          </div>
        </Transition>
      </div>

      <button class="delete-button" type="button" title="删除记录" @click="handleDelete">
        <FiTrash2 class="delete-icon" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.project-card {
  background-color: rgba(204, 173, 157, 0.08);
  border-radius: 16px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  border: none;
  box-shadow:
    0 1px 3px rgba(12, 11, 16, 0.1),
    0 0 0 0.5px rgba(112, 125, 166, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform, box-shadow;
  animation: slideInUp 0.4s ease-out backwards;
  flex: 1 1 auto;
  min-width: 280px;
  max-width: 100%;
  width: 100%;
  box-sizing: border-box;
  overflow: visible;
  position: relative;
  z-index: 0;
}

.project-card.menu-open {
  z-index: 200;
}

.project-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
}

.project-title {
  font-size: 18px;
  font-weight: 650;
  color: var(--color-03);
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  flex: 1;
  letter-spacing: -0.01em;
}

.delete-button {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 8px;
  background-color: rgba(112, 125, 166, 0.14);
  color: var(--ev-c-text-2);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.delete-button:hover {
  background-color: rgba(134, 59, 52, 0.22);
  color: #ffffff;
}

.delete-button:active {
  transform: scale(0.96);
}

.delete-icon {
  width: 16px;
  height: 16px;
  color: currentColor;
}

.project-card:hover {
  background-color: rgba(204, 173, 157, 0.12);
  box-shadow:
    0 4px 12px rgba(12, 11, 16, 0.15),
    0 0 0 0.5px rgba(112, 125, 166, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  transform: translateY(-2px);
}

.project-path {
  font-size: 12px;
  color: var(--ev-c-text-2);
  font-family:
    ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: 0.75;
}

.project-description {
  flex: 1;
  font-size: 13px;
  color: var(--ev-c-text-3);
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  opacity: 0.7;
}

.open-controls {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0;
  z-index: 300;
  flex-shrink: 0;
}

.open-button {
  padding: 8px 14px;
  border: none;
  border-radius: 10px 0 0 10px;
  background-color: rgba(112, 125, 166, 0.2);
  color: var(--ev-c-text-1);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  line-height: 1.2;
}

.open-button:hover {
  background-color: var(--color-02);
  color: #ffffff;
}

.open-dropdown {
  width: 34px;
  height: 32px;
  border: none;
  border-radius: 0 10px 10px 0;
  background-color: rgba(112, 125, 166, 0.16);
  color: var(--ev-c-text-1);
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.open-dropdown:hover {
  background-color: rgba(112, 125, 166, 0.26);
}

.chevron-icon {
  width: 16px;
  height: 16px;
  color: currentColor;
}

.open-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  min-width: 180px;
  background: var(--color-background-soft);
  border: 1px solid rgba(112, 125, 166, 0.18);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  padding: 6px;
  z-index: 400;
  backdrop-filter: blur(14px);
}

.menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 10px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--ev-c-text-1);
  cursor: pointer;
  font-size: 12px;
  text-align: left;
}

.menu-item:hover {
  background: rgba(112, 125, 166, 0.16);
}

.menu-check {
  width: 16px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  color: transparent;
  background: rgba(112, 125, 166, 0.14);
  font-weight: 800;
  flex-shrink: 0;
}

.menu-check.checked {
  color: #ffffff;
  background: rgba(112, 125, 166, 0.32);
}

.menu-text {
  flex: 1;
  white-space: nowrap;
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
    min-width: 240px;
  }
}

@media (max-width: 640px) {
  .project-card {
    min-width: 100%;
  }
}

/* 下拉菜单动画 */
.dropdown-enter-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.dropdown-leave-active {
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}

.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
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

  .dropdown-enter-active,
  .dropdown-leave-active {
    transition: opacity 0.1s ease;
  }

  .dropdown-enter-from,
  .dropdown-leave-to {
    transform: none;
  }
}
</style>

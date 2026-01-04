<script setup lang="ts">
import { onBeforeUnmount, onMounted, nextTick, ref, watch } from 'vue'
import type { Project, IDEConfig } from '../types'
import { FiChevronDown, FiTrash2 } from 'vue-icons-plus/fi'

interface Props {
  project: Project
  ideConfigs: IDEConfig[]
  batchMode?: boolean
  selected?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  batchMode: false,
  selected: false
})

const emit = defineEmits<{
  (e: 'deleted', projectPath: string): void
  (e: 'opened'): void
  (e: 'updated'): void
  (e: 'toggle-selection', projectPath: string): void
}>()

const menuOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)
const menuUpward = ref(false)

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

// 检查菜单是否应该向上展开
const checkMenuPosition = (): void => {
  if (!dropdownRef.value) return

  // 使用 nextTick 确保菜单已渲染
  nextTick(() => {
    if (!dropdownRef.value) return

    const rect = dropdownRef.value.getBoundingClientRect()
    // 估算菜单高度（每个菜单项约 40px，加上 padding）
    const estimatedMenuHeight = props.ideConfigs.length * 40 + 20
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top

    // 如果下方空间不足，且上方空间足够，则向上展开
    menuUpward.value = spaceBelow < estimatedMenuHeight + 8 && spaceAbove > estimatedMenuHeight + 8

    // 如果菜单已渲染，再次检查实际高度
    if (menuRef.value) {
      const actualMenuHeight = menuRef.value.offsetHeight
      const finalSpaceBelow = window.innerHeight - rect.bottom
      const finalSpaceAbove = rect.top
      menuUpward.value =
        finalSpaceBelow < actualMenuHeight + 8 && finalSpaceAbove > actualMenuHeight + 8
    }
  })
}

// 打开菜单时检查位置
const handleMenuToggle = (): void => {
  menuOpen.value = !menuOpen.value
  if (menuOpen.value) {
    checkMenuPosition()
  }
}

// 监听菜单打开状态，重新检查位置
watch(menuOpen, (isOpen) => {
  if (isOpen) {
    checkMenuPosition()
  }
})

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
    emit('deleted', props.project.path)
  } catch (error) {
    console.error('Failed to remove project:', error)
    alert('删除失败')
  }
}

const handleToggleSelection = (): void => {
  emit('toggle-selection', props.project.path)
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
  <div class="project-card" :class="{ 'menu-open': menuOpen, 'batch-selected': selected }">
    <div class="project-header">
      <div v-if="batchMode" class="batch-checkbox-wrapper">
        <input
          type="checkbox"
          :checked="selected"
          @change.stop="handleToggleSelection"
          @click.stop
        />
      </div>
      <div class="project-title" :title="project.name">
        {{ project.name }}
        <span class="project-path" :title="project.path">{{ project.path }}</span>
      </div>
      <div ref="dropdownRef" class="open-controls">
        <button class="open-button" type="button" @click="handleOpen">打开</button>
        <button class="open-dropdown" type="button" title="选择编辑器" @click="handleMenuToggle">
          <FiChevronDown class="chevron-icon" />
        </button>

        <Transition name="dropdown">
          <div
            v-if="menuOpen"
            ref="menuRef"
            class="open-menu"
            :class="{ 'menu-upward': menuUpward }"
          >
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

      <button
        v-if="!batchMode"
        class="delete-button"
        type="button"
        title="删除记录"
        @click="handleDelete"
      >
        <FiTrash2 class="delete-icon" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.project-card {
  background-color: var(--color-card-bg);
  border-radius: 0;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border: 3px solid var(--color-card-border);
  box-shadow: 4px 4px 0 0 var(--color-card-border);
  transition:
    background-color 0.15s ease,
    transform 0.1s ease,
    box-shadow 0.1s ease;
  flex: 1 1 auto;
  min-width: 280px;
  max-width: 100%;
  width: 100%;
  box-sizing: border-box;
  overflow: visible;
  position: relative;
  z-index: 0;
  cursor: default;
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

.batch-checkbox-wrapper {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 4px;
  margin-right: 4px;
  user-select: none;
}

.batch-checkbox-wrapper input[type='checkbox'] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--color-primary);
  pointer-events: auto;
  margin: 0;
  transition: transform 0.15s ease;
}

.batch-checkbox-wrapper input[type='checkbox']:active {
  transform: scale(0.9);
}

.project-card.batch-selected {
  background-color: var(--color-card-hover);
  border-color: var(--color-primary);
}

.project-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--ev-c-text-1);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  flex: 1;
  letter-spacing: -0.01em;
}

.delete-button {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-danger);
  border-radius: 0;
  background-color: transparent;
  color: var(--color-danger);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition:
    color 0.15s ease,
    background-color 0.15s ease,
    transform 0.1s ease,
    box-shadow 0.1s ease;
  box-shadow: 2px 2px 0 0 var(--color-danger);
}

.delete-button:hover {
  background-color: var(--color-danger);
  color: #ffffff;
  transform: translate(-1px, -1px);
  box-shadow: 3px 3px 0 0 var(--color-danger);
}

.delete-button:active {
  transform: scale(0.92);
}

.delete-icon {
  width: 16px;
  height: 16px;
  color: currentColor;
}

.project-card:hover {
  background-color: var(--color-card-hover);
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0 0 var(--color-card-border);
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
  font-weight: 400;
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
  padding: 8px 16px;
  border: 3px solid var(--color-card-border);
  border-radius: 0;
  background-color: transparent;
  color: var(--ev-c-text-1);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    color 0.15s ease,
    transform 0.1s ease,
    box-shadow 0.1s ease;
  line-height: 1.2;
  box-shadow: 2px 2px 0 0 var(--color-card-border);
}

.open-button:hover {
  background-color: var(--color-primary);
  color: #ffffff;
  transform: translate(-1px, -1px);
  box-shadow: 3px 3px 0 0 var(--color-primary);
}

.open-button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.open-button:active {
  transform: scale(0.96);
}

.open-dropdown {
  width: 36px;
  height: 36px;
  border: 3px solid var(--color-card-border);
  border-left: none;
  border-radius: 0;
  background-color: transparent;
  color: var(--ev-c-text-2);
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    color 0.15s ease,
    transform 0.1s ease,
    box-shadow 0.1s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 2px 2px 0 0 var(--color-card-border);
}

.open-dropdown:hover {
  background-color: var(--ev-c-gray-2);
  color: var(--ev-c-text-1);
  transform: translate(-1px, -1px);
  box-shadow: 3px 3px 0 0 var(--color-card-border);
}

.chevron-icon {
  width: 16px;
  height: 16px;
  color: currentColor;
  transition: transform 0.2s ease;
}

.project-card.menu-open .chevron-icon {
  transform: rotate(180deg);
}

.open-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  min-width: 180px;
  background: var(--color-background-soft);
  border: 3px solid var(--color-card-border);
  border-radius: 0;
  box-shadow: 4px 4px 0 0 var(--color-card-border);
  padding: 4px;
  z-index: 400;
}

.open-menu.menu-upward {
  top: auto;
  bottom: calc(100% + 8px);
}

.menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--ev-c-text-1);
  cursor: pointer;
  font-size: 14px;
  text-align: left;
  transition:
    background-color 0.15s ease,
    transform 0.1s ease;
}

.menu-item:hover {
  background: var(--ev-c-gray-2);
}

.menu-item:active {
  transform: scale(0.98);
  background: var(--ev-c-gray-1);
}

.menu-check {
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  color: transparent;
  background: var(--ev-c-gray-2);
  font-weight: 600;
  font-size: 12px;
  flex-shrink: 0;
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    transform 0.15s ease;
}

.menu-check.checked {
  color: #ffffff;
  background: var(--color-primary);
  transform: scale(1.1);
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
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
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

.open-menu.menu-upward .dropdown-enter-from {
  transform: translateY(8px) scale(0.95);
}

.open-menu.menu-upward .dropdown-leave-to {
  transform: translateY(4px) scale(0.98);
}

@media (prefers-reduced-motion: reduce) {
  .project-card {
    animation: none;
    transition: background-color 0.2s ease;
  }

  .project-card:hover {
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

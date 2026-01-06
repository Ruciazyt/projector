<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  FiPlus,
  FiSearch,
  FiMoon,
  FiSun,
  FiTrash2,
  FiGlobe,
  FiChevronLeft,
  FiExternalLink,
  FiMoreVertical,
  FiMenu
} from 'vue-icons-plus/fi'
import ProjectCard from './components/ProjectCard.vue'
import AddProjectFlowModal from './components/AddProjectFlowModal.vue'
import MenuButton from './components/MenuButton.vue'
import { useProjects } from './composables/useProjects'
import { useSidebar } from './composables/useSidebar'
import { useTheme } from './composables/useTheme'
import { useBatchSelection } from './composables/useBatchSelection'
import type { Project } from './types'
import { useI18n } from 'vue-i18n'

// Composables
const { t, locale } = useI18n()
const {
  projects,
  searchQuery,
  filteredProjects,
  localProjects,
  remoteProjects,
  recentProjects,
  ideConfigs,
  loadProjects,
  handleProjectDeleted
} = useProjects()

const { recentSidebarCollapsed } = useSidebar()
const { theme, toggleTheme, loadTheme } = useTheme()

const {
  batchMode,
  selectedProjects,
  toggleBatchMode,
  toggleSelectAll,
  toggleProjectSelection,
  handleBatchDelete
} = useBatchSelection(
  () => filteredProjects.value,
  () => localProjects.value,
  () => remoteProjects.value,
  projects
)

// State
const addFlowOpen = ref(false)
const menuButtonRef = ref<InstanceType<typeof MenuButton> | null>(null)

// Actions
const handleProjectDelete = (projectPath: string): void => {
  handleProjectDeleted(projectPath)
}

const handleBatchDeleteWrapper = async (): Promise<void> => {
  await handleBatchDelete()
}

const toggleBatchModeWithMenu = (): void => {
  toggleBatchMode()
  menuButtonRef.value?.close()
}

const toggleLanguage = (): void => {
  const newLocale = locale.value === 'zh' ? 'en' : 'zh'
  locale.value = newLocale
  localStorage.setItem('locale', newLocale)
}

const handleOpenRecent = async (project: Project): Promise<void> => {
  const ide = ideConfigs.find((x) => x.id === project.preferredIdeId) || ideConfigs[0]
  if (!ide) return

  try {
    const res = await window.api.openProject(project.path, ide.command)
    if (!res.success) {
      alert(res.error || t('project.failedToOpen'))
    } else {
      loadProjects() // Refresh to update last opened time
    }
  } catch (e) {
    console.error(e)
  }
}

const toggleSelection = (path: string): void => toggleProjectSelection(path)

onMounted(async () => {
  loadProjects()
  loadTheme()
})
</script>

<template>
  <div class="flex h-screen w-full flex-col overflow-hidden bg-background text-text-1">
    <!-- Toolbar -->
    <div
      class="relative z-20 flex items-center gap-4 border-b border-card-border bg-background/80 px-6 pb-4 pt-10 backdrop-blur-md"
      style="-webkit-app-region: drag"
    >
      <!-- Add Button -->
      <button
        class="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary-hover hover:shadow active:scale-95"
        style="-webkit-app-region: no-drag"
        @click="addFlowOpen = true"
      >
        <FiPlus class="text-lg" />
        <span>{{ t('project.new') }}</span>
      </button>

      <!-- Search -->
      <div class="group relative flex-1 max-w-md" style="-webkit-app-region: no-drag">
        <FiSearch
          class="absolute left-3 top-1/2 -translate-y-1/2 text-text-3 transition-colors group-focus-within:text-primary"
        />
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="t('project.searchPlaceholder')"
          class="h-9 w-full rounded-lg border border-card-border bg-card-bg pl-9 pr-4 text-sm text-text-1 placeholder-text-3 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div class="flex-1" />

      <!-- Theme Toggle -->
      <button
        class="flex h-9 w-9 items-center justify-center rounded-lg text-text-2 transition-colors hover:bg-card-hover hover:text-text-1"
        style="-webkit-app-region: no-drag"
        :title="t('theme.language')"
        @click="toggleLanguage"
      >
        <FiGlobe />
      </button>

      <button
        class="flex h-9 w-9 items-center justify-center rounded-lg text-text-2 transition-colors hover:bg-card-hover hover:text-text-1"
        style="-webkit-app-region: no-drag"
        :title="t('theme.toggle')"
        @click="toggleTheme"
      >
        <FiSun v-if="theme === 'light'" />
        <FiMoon v-else />
      </button>

      <!-- Menu -->
      <MenuButton ref="menuButtonRef" style="-webkit-app-region: no-drag">
        <template #trigger>
          <button
            class="flex h-9 w-9 items-center justify-center rounded-lg text-text-2 transition-colors hover:bg-card-hover hover:text-text-1"
          >
            <FiMoreVertical />
          </button>
        </template>

        <template #default>
          <div>
            <button
              class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-text-2 hover:bg-card-hover hover:text-text-1"
              @click="toggleBatchModeWithMenu"
            >
              <FiMenu class="h-4 w-4" />
              <span>{{ batchMode ? t('batch.exit') : t('batch.manage') }}</span>
            </button>
          </div>
        </template>
      </MenuButton>
    </div>

    <AddProjectFlowModal v-model:open="addFlowOpen" @added="loadProjects()" />

    <!-- Content Area -->
    <div
      class="grid min-w-0 flex-1 grid-cols-[200px_1fr] gap-0 overflow-hidden transition-[grid-template-columns] duration-300 ease-[cubic-bezier(0.2,0,0,1)]"
      :class="{ '!grid-cols-[0px_1fr]': recentSidebarCollapsed }"
    >
      <!-- Sidebar (Recent) -->
      <aside
        class="relative flex min-w-0 flex-col overflow-hidden border-r border-card-border bg-background transition-[width,padding] duration-300 ease-[cubic-bezier(0.2,0,0,1)]"
      >
        <div class="flex items-center justify-between px-4 py-3">
          <span class="text-xs font-bold uppercase tracking-wider text-text-3">{{
            t('recent.title')
          }}</span>
          <button
            class="flex h-6 w-6 items-center justify-center rounded text-text-3 hover:bg-card-hover hover:text-text-1"
            :title="t('sidebar.collapse')"
            @click="recentSidebarCollapsed = true"
          >
            <FiChevronLeft />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto px-2 py-2">
          <div v-if="recentProjects.length === 0" class="px-2 text-xs text-text-3">
            {{ t('recent.empty') }}
          </div>

          <div v-else class="flex flex-col gap-0.5">
            <div
              v-for="project in recentProjects"
              :key="project.id"
              class="group flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm text-text-2 transition-colors hover:bg-card-bg hover:text-text-1"
              @click="handleOpenRecent(project)"
            >
              <div class="truncate font-medium">
                {{ project.name }}
              </div>

              <!-- Hover Action -->
              <div class="opacity-0 transition-opacity group-hover:opacity-100">
                <FiExternalLink class="h-3.5 w-3.5 text-text-3 hover:text-primary" />
              </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- Sidebar Toggle (When Collapsed) -->
      <div
        v-if="recentSidebarCollapsed"
        class="absolute left-0 top-20 z-10 flex h-10 w-6 cursor-pointer items-center justify-center rounded-r-md border-y border-r border-card-border bg-card-bg text-text-2 hover:text-text-1"
        @click="recentSidebarCollapsed = false"
      >
        <FiChevronLeft class="rotate-180" />
      </div>

      <!-- Main List -->
      <section class="min-w-0 flex flex-col gap-6 overflow-y-auto bg-background p-6">
        <!-- Batch Toolbar -->
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="transform -translate-y-2 opacity-0"
          enter-to-class="transform translate-y-0 opacity-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="transform translate-y-0 opacity-100"
          leave-to-class="transform -translate-y-2 opacity-0"
        >
          <div
            v-if="batchMode"
            class="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-4 py-3"
          >
            <div class="flex items-center gap-3">
              <label class="flex items-center gap-2 text-sm font-medium text-text-1">
                <input
                  type="checkbox"
                  class="rounded border-gray-300 text-primary focus:ring-primary"
                  :checked="
                    selectedProjects.size === filteredProjects.length && filteredProjects.length > 0
                  "
                  @change="toggleSelectAll"
                />
                {{ t('batch.selectAll') }}
              </label>
              <span class="text-sm text-text-2">{{
                t('batch.selected', { count: selectedProjects.size })
              }}</span>
            </div>

            <div class="flex gap-2">
              <button
                class="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-danger hover:bg-danger/10"
                @click="handleBatchDeleteWrapper"
              >
                <FiTrash2 class="h-4 w-4" />
                {{ t('batch.deleteSelected') }}
              </button>
              <button
                class="rounded-md px-3 py-1.5 text-sm font-medium text-text-2 hover:bg-card-hover hover:text-text-1"
                @click="toggleBatchModeWithMenu"
              >
                {{ t('common.cancel') }}
              </button>
            </div>
          </div>
        </Transition>

        <!-- List -->
        <div
          v-if="filteredProjects.length === 0"
          class="flex flex-col items-center justify-center py-20 opacity-50"
        >
          <p>{{ t('project.noProjects') }}</p>
        </div>

        <div
          v-else
          class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
        >
          <ProjectCard
            v-for="project in filteredProjects"
            :key="project.id"
            :project="project"
            :ide-configs="ideConfigs"
            :batch-mode="batchMode"
            :selected="selectedProjects.has(project.path)"
            @opened="loadProjects"
            @updated="loadProjects"
            @deleted="handleProjectDelete"
            @update:selected="toggleSelection(project.path)"
          />
        </div>
      </section>
    </div>
  </div>
</template>

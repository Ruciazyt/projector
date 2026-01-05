import { ref, computed, type Ref, type ComputedRef } from 'vue'
import type { Project, IDEConfig } from '../types'
import { IDE_LIST } from '../../../shared/ide'

export function useProjects(): {
  projects: Ref<Project[]>
  searchQuery: Ref<string>
  ideConfigs: IDEConfig[]
  filteredProjects: ComputedRef<Project[]>
  localProjects: ComputedRef<Project[]>
  remoteProjects: ComputedRef<Project[]>
  recentProjects: ComputedRef<Project[]>
  loadProjects: () => Promise<void>
  handleProjectDeleted: (projectPath: string) => void
} {
  const projects = ref<Project[]>([])
  const searchQuery = ref('')

  const ideConfigs: IDEConfig[] = [...IDE_LIST]

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

  const localProjects = computed(() => {
    return filteredProjects.value.filter((p) => !p.type || p.type === 'local')
  })

  const remoteProjects = computed(() => {
    return filteredProjects.value.filter((p) => p.type === 'remote')
  })

  const recentProjects = computed(() => {
    return filteredProjects.value
      .filter((p) => typeof p.lastOpened === 'number' && Number.isFinite(p.lastOpened))
      .slice()
      .sort((a, b) => (b.lastOpened ?? 0) - (a.lastOpened ?? 0))
      .slice(0, 8)
  })

  const loadProjects = async (): Promise<void> => {
    try {
      const loadedProjects = await window.api.getProjects()
      projects.value = loadedProjects
    } catch (error) {
      console.error('Failed to load projects:', error)
    }
  }

  const handleProjectDeleted = (projectPath: string): void => {
    const index = projects.value.findIndex((p) => p.path === projectPath)
    if (index !== -1) {
      projects.value.splice(index, 1)
    }
  }

  return {
    projects,
    searchQuery,
    ideConfigs,
    filteredProjects,
    localProjects,
    remoteProjects,
    recentProjects,
    loadProjects,
    handleProjectDeleted
  }
}

import { ref, type Ref } from 'vue'
import type { Project } from '../types'

export function useBatchSelection(
  filteredProjects: () => Project[],
  localProjects: () => Project[],
  remoteProjects: () => Project[],
  projects: { value: Project[] }
): {
  batchMode: Ref<boolean>
  selectedProjects: Ref<Set<string>>
  toggleBatchMode: () => void
  toggleSelectAll: () => void
  toggleSelectAllLocal: () => void
  toggleSelectAllRemote: () => void
  toggleProjectSelection: (projectPath: string) => void
  handleBatchDelete: () => Promise<number>
} {
  const batchMode = ref(false)
  const selectedProjects = ref<Set<string>>(new Set())

  const toggleBatchMode = (): void => {
    batchMode.value = !batchMode.value
    if (!batchMode.value) {
      selectedProjects.value.clear()
    }
  }

  const toggleSelectAll = (): void => {
    if (selectedProjects.value.size === filteredProjects().length) {
      selectedProjects.value.clear()
    } else {
      filteredProjects().forEach((p) => {
        selectedProjects.value.add(p.path)
      })
    }
  }

  const toggleSelectAllLocal = (): void => {
    const allLocalSelected = localProjects().every((p) => selectedProjects.value.has(p.path))
    if (allLocalSelected) {
      localProjects().forEach((p) => {
        selectedProjects.value.delete(p.path)
      })
    } else {
      localProjects().forEach((p) => {
        selectedProjects.value.add(p.path)
      })
    }
  }

  const toggleSelectAllRemote = (): void => {
    const allRemoteSelected = remoteProjects().every((p) => selectedProjects.value.has(p.path))
    if (allRemoteSelected) {
      remoteProjects().forEach((p) => {
        selectedProjects.value.delete(p.path)
      })
    } else {
      remoteProjects().forEach((p) => {
        selectedProjects.value.add(p.path)
      })
    }
  }

  const toggleProjectSelection = (projectPath: string): void => {
    if (selectedProjects.value.has(projectPath)) {
      selectedProjects.value.delete(projectPath)
    } else {
      selectedProjects.value.add(projectPath)
    }
  }

  const handleBatchDelete = async (): Promise<number> => {
    if (selectedProjects.value.size === 0) return 0

    const count = selectedProjects.value.size
    const ok = confirm(
      `确定要删除 ${count} 个项目记录吗？\n\n（仅删除应用内记录，不会删除磁盘目录）`
    )
    if (!ok) return 0

    try {
      const paths = Array.from(selectedProjects.value)
      const removedCount = await window.api.removeProjects(paths)

      if (removedCount === 0) {
        alert('删除失败：未找到任何记录')
        return 0
      }

      // 从列表中移除已删除的项目
      paths.forEach((path) => {
        const index = projects.value.findIndex((p) => p.path === path)
        if (index !== -1) {
          projects.value.splice(index, 1)
        }
      })

      selectedProjects.value.clear()
      batchMode.value = false

      if (removedCount < count) {
        alert(`成功删除 ${removedCount} 个项目（${count - removedCount} 个未找到）`)
      }

      return removedCount
    } catch (error) {
      console.error('Failed to remove projects:', error)
      alert('批量删除失败')
      return 0
    }
  }

  return {
    batchMode,
    selectedProjects,
    toggleBatchMode,
    toggleSelectAll,
    toggleSelectAllLocal,
    toggleSelectAllRemote,
    toggleProjectSelection,
    handleBatchDelete
  }
}

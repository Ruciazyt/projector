import { ref } from 'vue'
import type { Project } from '../types'

export function useProjectActions(
  ideConfigs: { id: string; command: string }[],
  loadProjects: () => Promise<void>
) {
  const addFlowOpen = ref(false)

  const handleAddProject = async (event?: Event): Promise<void> => {
    event?.preventDefault()
    event?.stopPropagation()
    addFlowOpen.value = true
  }

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

  const handleOpenRecent = async (project: Project): Promise<void> => {
    const preferred = ideConfigs.find((x) => x.id === project.preferredIdeId) ?? ideConfigs[0]
    try {
      const result = await window.api.openProject(project.path, preferred.command)
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

  return {
    addFlowOpen,
    handleAddProject,
    handleScanDirectory,
    handleOpenRecent
  }
}

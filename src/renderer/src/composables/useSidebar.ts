import { ref, watch, type Ref } from 'vue'

export function useSidebar(): {
  recentSidebarCollapsed: Ref<boolean>
  loadRecentSidebarCollapsed: () => Promise<void>
} {
  const recentSidebarCollapsed = ref(false)

  const loadRecentSidebarCollapsed = async (): Promise<void> => {
    try {
      recentSidebarCollapsed.value = await window.api.getRecentSidebarCollapsed()
    } catch (error) {
      console.error('Failed to load recent sidebar state:', error)
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

  return {
    recentSidebarCollapsed,
    loadRecentSidebarCollapsed
  }
}

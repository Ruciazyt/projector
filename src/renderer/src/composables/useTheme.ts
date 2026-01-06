import { ref, type Ref } from 'vue'

export function useTheme(): {
  theme: Ref<'light' | 'dark'>
  loadTheme: () => Promise<void>
  toggleTheme: () => Promise<void>
  applyTheme: (newTheme: 'light' | 'dark') => void
} {
  const theme = ref<'light' | 'dark'>('dark')

  const applyTheme = (newTheme: 'light' | 'dark'): void => {
    document.documentElement.setAttribute('data-theme', newTheme)
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

  // 立即初始化主题（避免首次加载闪烁）
  loadTheme()

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

  return {
    theme,
    loadTheme,
    toggleTheme,
    applyTheme
  }
}

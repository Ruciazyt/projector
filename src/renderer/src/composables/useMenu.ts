import { ref, onMounted, onBeforeUnmount } from 'vue'

export function useMenu() {
  const menuOpen = ref(false)
  const menuRef = ref<HTMLElement | null>(null)

  const closeMenu = (): void => {
    menuOpen.value = false
  }

  const handleMenuClickOutside = (event: MouseEvent): void => {
    const el = menuRef.value
    if (!el) return
    if (!el.contains(event.target as Node)) {
      menuOpen.value = false
    }
  }

  onMounted(() => {
    document.addEventListener('mousedown', handleMenuClickOutside)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('mousedown', handleMenuClickOutside)
  })

  return {
    menuOpen,
    menuRef
  }
}

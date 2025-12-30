import { ref, nextTick } from 'vue'

export function useToolbarAnimation() {
  const scanButtonRef = ref<HTMLButtonElement | null>(null)
  const addButtonRef = ref<HTMLButtonElement | null>(null)
  const buttonBackgroundRef = ref<HTMLDivElement | null>(null)
  const activeButton = ref<'scan' | 'add' | null>(null)

  const moveBackgroundToButton = (buttonType: 'scan' | 'add'): void => {
    const button = buttonType === 'scan' ? scanButtonRef.value : addButtonRef.value
    const background = buttonBackgroundRef.value
    const container = button?.parentElement
    if (!button || !background || !container) return

    const buttonRect = button.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()
    const left = buttonRect.left - containerRect.left
    const width = buttonRect.width
    const height = buttonRect.height

    background.style.left = `${left}px`
    background.style.width = `${width}px`
    background.style.height = `${height}px`
    background.style.opacity = '1'
    background.style.pointerEvents = 'none'

    if (buttonType === 'add') {
      background.style.backgroundColor = 'var(--color-02)'
    } else {
      background.style.backgroundColor = 'rgba(112, 125, 166, 0.15)'
    }

    activeButton.value = buttonType
  }

  const handleButtonEnter = (buttonType: 'scan' | 'add'): void => {
    if (activeButton.value && activeButton.value !== buttonType) {
      nextTick(() => {
        moveBackgroundToButton(buttonType)
      })
    } else {
      moveBackgroundToButton(buttonType)
    }
  }

  const handleButtonLeave = (): void => {
    // 不立即隐藏，等待移动到另一个按钮
  }

  const handleToolbarLeave = (event: MouseEvent): void => {
    const target = event.relatedTarget as HTMLElement
    if (target && (target.closest('.toolbar-button') || target.closest('.button-container'))) {
      return
    }
    activeButton.value = null
    const background = buttonBackgroundRef.value
    if (background) {
      background.style.opacity = '0'
    }
  }

  return {
    scanButtonRef,
    addButtonRef,
    buttonBackgroundRef,
    activeButton,
    handleButtonEnter,
    handleButtonLeave,
    handleToolbarLeave
  }
}

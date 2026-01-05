<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, type CSSProperties } from 'vue'

const props = defineProps<{
  /**
   * 菜单是否向上弹出（可选，默认自动计算）
   * 如果不传，会自动检测剩余空间
   */
  upward?: boolean
  /**
   * 菜单对齐方式
   */
  align?: 'left' | 'right'
}>()

const menuOpen = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)
const menuUpward = ref(false)
const menuStyle = ref<CSSProperties>({})

const updateMenuPosition = (): void => {
  if (!triggerRef.value) return

  const rect = triggerRef.value.getBoundingClientRect()
  const spaceBelow = window.innerHeight - rect.bottom

  // 简单的自动方向检测：如果下方空间小于 200px 且上方空间足够，则向上弹出
  // 也可以通过 props 强制指定
  if (props.upward !== undefined) {
    menuUpward.value = props.upward
  } else {
    menuUpward.value = spaceBelow < 200 && rect.top > 200
  }

  const style: CSSProperties = {
    position: 'fixed',
    zIndex: 9999,
    minWidth: '180px'
  }

  // 垂直位置
  if (menuUpward.value) {
    style.bottom = `${window.innerHeight - rect.top + 8}px`
  } else {
    style.top = `${rect.bottom + 8}px`
  }

  // 水平位置
  if (props.align === 'left') {
    style.left = `${rect.left}px`
  } else {
    // 默认右对齐
    style.right = `${window.innerWidth - rect.right}px`
  }

  menuStyle.value = style
}

const toggleMenu = (): void => {
  if (menuOpen.value) {
    menuOpen.value = false
  } else {
    updateMenuPosition()
    menuOpen.value = true
  }
}

const closeMenu = (): void => {
  menuOpen.value = false
}

const onDocMouseDown = (event: MouseEvent): void => {
  const target = event.target as Node
  const inTrigger = triggerRef.value?.contains(target)
  const inMenu = menuRef.value?.contains(target)
  if (!inTrigger && !inMenu) {
    closeMenu()
  }
}

watch(menuOpen, (isOpen) => {
  if (isOpen) {
    window.addEventListener('scroll', closeMenu, true)
    window.addEventListener('resize', closeMenu)
  } else {
    window.removeEventListener('scroll', closeMenu, true)
    window.removeEventListener('resize', closeMenu)
  }
})

onMounted(() => {
  document.addEventListener('mousedown', onDocMouseDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocMouseDown)
  window.removeEventListener('scroll', closeMenu, true)
  window.removeEventListener('resize', closeMenu)
})

defineExpose({
  close: closeMenu
})
</script>

<template>
  <div class="relative inline-block">
    <!-- Trigger -->
    <div ref="triggerRef" @click="toggleMenu">
      <slot name="trigger" :open="menuOpen"></slot>
    </div>

    <!-- Menu Content -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
        leave-active-class="transition-all duration-150 ease-[cubic-bezier(0.4,0,0.2,1)]"
        :enter-from-class="
          menuUpward ? 'opacity-0 translate-y-2 scale-95' : 'opacity-0 -translate-y-2 scale-95'
        "
        :leave-to-class="
          menuUpward ? 'opacity-0 translate-y-1 scale-98' : 'opacity-0 -translate-y-1 scale-98'
        "
      >
        <div
          v-if="menuOpen"
          ref="menuRef"
          :style="menuStyle"
          class="fixed rounded-lg border border-card-border bg-background-soft p-1 shadow-2"
          :class="[
            menuUpward ? 'origin-bottom' : 'origin-top',
            align === 'left'
              ? menuUpward
                ? 'origin-bottom-left'
                : 'origin-top-left'
              : menuUpward
                ? 'origin-bottom-right'
                : 'origin-top-right'
          ]"
        >
          <slot :close="closeMenu"></slot>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

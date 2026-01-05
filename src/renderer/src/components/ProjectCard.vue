<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Project, IDEConfig } from '../types'
import { FiChevronDown, FiTrash2 } from 'vue-icons-plus/fi'
import MenuButton from './MenuButton.vue'

const { t } = useI18n()

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

const menuButtonRef = ref<InstanceType<typeof MenuButton> | null>(null)

const getPreferredIde = (): IDEConfig => {
  const preferred = props.ideConfigs.find((x) => x.id === props.project.preferredIdeId)
  return preferred ?? props.ideConfigs[0]
}

const handleOpen = async (): Promise<void> => {
  const ide = getPreferredIde()
  try {
    const result = await window.api.openProject(props.project.path, ide.command)
    if (!result.success) {
      alert(t('project.error.open', { error: result.error || t('common.unknown') }))
      return
    }
    emit('opened')
  } catch (error) {
    console.error('Failed to open project:', error)
    alert(t('project.error.openGeneric'))
  }
}

const handleChooseIde = async (ide: IDEConfig): Promise<void> => {
  try {
    const ok = await window.api.setProjectPreferredIde(props.project.path, ide.id)
    if (!ok) {
      alert(t('project.error.setIde'))
      return
    }
    emit('updated')
    menuButtonRef.value?.close()
  } catch (error) {
    console.error('Failed to set preferred IDE:', error)
    alert(t('project.error.setIde'))
  }
}

const handleDelete = async (): Promise<void> => {
  const ok = confirm(
    t('project.confirm.remove', {
      name: props.project.name,
      path: props.project.path
    })
  )
  if (!ok) return
  try {
    const removed = await window.api.removeProject(props.project.path)
    if (!removed) {
      alert(t('project.error.removeNotFound'))
      return
    }
    emit('deleted', props.project.path)
  } catch (error) {
    console.error('Failed to remove project:', error)
    alert(t('project.error.removeGeneric'))
  }
}

const handleToggleSelection = (): void => {
  emit('toggle-selection', props.project.path)
}
</script>

<template>
  <div
    class="relative z-0 flex w-full min-w-[280px] max-w-full flex-[1_1_auto] cursor-default flex-col gap-2 overflow-visible rounded-lg border border-card-border bg-card-bg p-4 transition-all duration-150 hover:border-primary/50 hover:bg-card-hover"
    :class="{
      '!bg-card-hover !border-primary': selected
    }"
  >
    <div class="flex min-w-0 items-center justify-between gap-3">
      <div v-if="batchMode" class="mr-1 flex cursor-pointer select-none items-center p-1">
        <input
          type="checkbox"
          class="pointer-events-auto m-0 h-[18px] w-[18px] cursor-pointer accent-primary transition-transform duration-150 active:scale-90"
          :checked="selected"
          @change.stop="handleToggleSelection"
          @click.stop
        />
      </div>
      <div
        class="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-base font-bold tracking-tight text-text-1"
        :title="project.name"
      >
        {{ project.name }}
        <span
          class="block overflow-hidden text-ellipsis whitespace-nowrap font-mono text-xs font-normal text-text-2"
          :title="project.path"
          >{{ project.path }}</span
        >
      </div>
      <div ref="dropdownRef" class="relative z-10 inline-flex shrink-0 items-center gap-0">
        <button
          class="inline-flex cursor-pointer items-center justify-center rounded-l-md border border-card-border bg-transparent px-4 py-2 text-sm font-bold text-text-1 shadow-1 transition-all duration-150 hover:bg-primary hover:text-white hover:shadow-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-96"
          type="button"
          @click="handleOpen"
        >
          {{ t('project.action.open') }}
        </button>

        <MenuButton ref="menuButtonRef">
          <template #trigger="{ open }">
            <button
              class="inline-flex h-[38px] w-9 cursor-pointer items-center justify-center rounded-r-md border border-l-0 border-card-border bg-transparent text-text-2 shadow-1 transition-all duration-150 hover:bg-ev-c-gray-2 hover:text-text-1 hover:shadow-2"
              type="button"
              :title="t('project.action.selectIde')"
            >
              <FiChevronDown
                class="h-4 w-4 text-current transition-transform duration-200"
                :class="{ 'rotate-180': open }"
              />
            </button>
          </template>

          <template #default>
            <div>
              <button
                v-for="ide in ideConfigs"
                :key="ide.id"
                class="flex w-full cursor-pointer items-center gap-2.5 rounded-md border-none bg-transparent px-3 py-2.5 text-left text-sm text-text-1 transition-all duration-150 hover:bg-ev-c-gray-2 active:scale-98 active:bg-ev-c-gray-1"
                type="button"
                @click="handleChooseIde(ide)"
              >
                <span
                  class="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded bg-ev-c-gray-2 text-xs font-semibold text-transparent transition-all duration-200"
                  :class="{
                    '!bg-primary !text-white scale-110': ide.id === project.preferredIdeId
                  }"
                  >✓</span
                >
                <span class="flex-1 whitespace-nowrap">{{ ide.name }}</span>
              </button>
            </div>
          </template>
        </MenuButton>
      </div>

      <button
        v-if="!batchMode"
        class="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-danger bg-transparent text-danger shadow-1 transition-all duration-150 hover:bg-danger hover:text-white hover:shadow-2 active:scale-92"
        type="button"
        :title="t('project.action.remove')"
        @click="handleDelete"
      >
        <FiTrash2 class="h-4 w-4 text-current" />
      </button>
    </div>
  </div>
</template>

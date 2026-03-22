<script lang="ts" setup>
import type { StudioTool, ToolbarConfig } from './types'
import { useEventListener } from '@vueuse/core'

const props = withDefaults(defineProps<{
  activeTool: StudioTool
  disabled?: boolean
  active?: boolean
  config?: ToolbarConfig
}>(), {
  disabled: false,
  active: false,
  config: () => ({ show: true, items: ['crop', 'reset'] })
})

const emit = defineEmits<{
  'update:activeTool': [tool: StudioTool]
  action: [action: 'apply' | 'cancel' | 'reset' | 'download']
}>()

function onToolClick(tool: StudioTool) {
  if (props.disabled) return
  if (tool === 'apply' || tool === 'cancel' || tool === 'reset' || tool === 'download') {
    emit('action', tool)
    return
  }
  emit('update:activeTool', props.activeTool === tool ? 'none' : tool)
}

// --- Keyboard Shortcuts ---
useEventListener(typeof window !== 'undefined' ? window : null, 'keydown', (e: KeyboardEvent) => {
  if (!props.active || props.disabled) return

  const isCtrlOrMeta = e.ctrlKey || e.metaKey
  const key = e.key.toLowerCase()

  // Handle Ctrl+S / Meta+S (Download)
  if (isCtrlOrMeta && key === 's') {
    e.preventDefault()
    onToolClick('download')
  }
  // Handle single key shortcuts (Only if NO modifier is pressed)
  else if (!isCtrlOrMeta && !e.altKey && !e.shiftKey) {
    if (key === 'c') onToolClick('crop')
    else if (key === 'r') onToolClick('reset')
    else if (key === 'escape' && props.activeTool !== 'none') onToolClick('cancel')
    else if (key === 'enter' && props.activeTool !== 'none') onToolClick('apply')
  }
})
</script>

<template>
  <div v-if="props.config.show" class="flex flex-col items-center gap-2 py-2 px-2 bg-muted border-r border-muted min-w-16 z-10">
    <!-- Dynamic items based on config -->
    <template v-for="item in props.config.items" :key="item">
      <UButton
        v-if="item === 'crop'"
        icon="i-lucide-crop"
        :color="props.activeTool === 'crop' ? 'primary' : 'neutral'"
        variant="ghost"
        :disabled="props.disabled"
        square
        class="size-12 rounded-lg"
        :class="{ 'bg-primary-100/50 dark:bg-primary-900/20': props.activeTool === 'crop' }"
        @click="onToolClick('crop')" />

      <UButton
        v-if="item === 'cancel'"
        icon="i-lucide-x"
        color="neutral"
        variant="ghost"
        :disabled="props.disabled || props.activeTool === 'none'"
        square
        class="size-12 rounded-lg hover:text-error"
        @click="onToolClick('cancel')" />

      <UButton
        v-if="item === 'apply'"
        icon="i-lucide-check"
        color="primary"
        variant="soft"
        :disabled="props.disabled || props.activeTool === 'none'"
        square
        class="size-12 rounded-lg"
        @click="onToolClick('apply')" />

      <UButton
        v-if="item === 'reset'"
        icon="i-lucide-trash-2"
        color="neutral"
        variant="ghost"
        :disabled="props.disabled"
        square
        class="size-12 rounded-lg hover:text-error"
        @click="onToolClick('reset')" />

      <UButton
        v-if="item === 'download'"
        icon="i-lucide-download"
        color="neutral"
        variant="ghost"
        :disabled="props.disabled"
        square
        class="size-12 rounded-lg"
        @click="onToolClick('download')" />
    </template>

    <USeparator v-if="props.config.items && props.config.items.length > 0" class="my-2" />

    <!-- Slot for parent to inject extra tools -->
    <slot />
  </div>
</template>

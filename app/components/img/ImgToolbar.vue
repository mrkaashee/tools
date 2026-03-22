<script lang="ts" setup>
import type { StudioTool, ToolbarConfig } from './types'
import { useMagicKeys, whenever } from '@vueuse/core'

const props = withDefaults(defineProps<{
  activeTool: StudioTool
  disabled?: boolean
  config?: ToolbarConfig
}>(), {
  disabled: false,
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
const keys = useMagicKeys({
  passive: false,
  onEventFired(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
    }
  }
})

const { c, r, escape, enter, ctrl_s, meta_s } = keys

whenever(() => c?.value, () => onToolClick('crop'))
whenever(() => r?.value, () => onToolClick('reset'))
whenever(() => escape?.value, () => {
  if (props.activeTool !== 'none') onToolClick('cancel')
})
whenever(() => enter?.value && props.activeTool !== 'none', () => onToolClick('apply'))
whenever(() => ctrl_s?.value || meta_s?.value, () => onToolClick('download'))
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

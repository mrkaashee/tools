<script lang="ts" setup>
import type { StudioTool, ToolbarConfig } from './types'

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
</script>

<template>
  <div v-if="config.show" class="flex flex-col items-center gap-2 py-2 px-2 bg-gray-50 dark:bg-gray-800/50 border-r border-gray-200 dark:border-gray-800 min-w-16 z-10">
    <!-- Dynamic items based on config -->
    <template v-for="item in config.items" :key="item">
      <UButton
        v-if="item === 'crop'"
        icon="i-lucide-crop"
        :color="activeTool === 'crop' ? 'primary' : 'neutral'"
        variant="ghost"
        :disabled="disabled"
        square
        class="size-12 rounded-lg"
        :class="{ 'bg-primary-100/50 dark:bg-primary-900/20': activeTool === 'crop' }"
        @click="onToolClick('crop')" />

      <UButton
        v-if="item === 'cancel'"
        icon="i-lucide-x"
        color="neutral"
        variant="ghost"
        :disabled="disabled || activeTool === 'none'"
        square
        class="size-12 rounded-lg hover:text-red-500"
        @click="onToolClick('cancel')" />

      <UButton
        v-if="item === 'apply'"
        icon="i-lucide-check"
        color="primary"
        variant="soft"
        :disabled="disabled || activeTool === 'none'"
        square
        class="size-12 rounded-lg"
        @click="onToolClick('apply')" />

      <UButton
        v-if="item === 'reset'"
        icon="i-lucide-trash-2"
        color="neutral"
        variant="ghost"
        :disabled="disabled"
        square
        class="size-12 rounded-lg hover:text-red-500"
        @click="onToolClick('reset')" />

      <UButton
        v-if="item === 'download'"
        v-tooltip="'Download'"
        icon="i-lucide-download"
        color="neutral"
        variant="ghost"
        :disabled="disabled"
        square
        class="size-12 rounded-lg"
        @click="onToolClick('download')" />
    </template>

    <USeparator v-if="config.items && config.items.length > 0" class="my-2" />

    <!-- Slot for parent to inject extra tools -->
    <slot />
  </div>
</template>

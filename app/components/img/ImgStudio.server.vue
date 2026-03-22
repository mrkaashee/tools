<script lang="ts" setup>
import type { CropConfig, StudioTool, ToolbarConfig, ZoomConfig, ExportConfig } from './types'

withDefaults(defineProps<{
  src?: string
  accept?: string
  crop?: boolean | CropConfig
  zoom?: boolean | ZoomConfig
  toolbar?: boolean | ToolbarConfig
  export?: ExportConfig
  disabled?: boolean
}>(), {
  src: '',
  accept: 'image/*',
  crop: true,
  zoom: false,
  toolbar: true,
  disabled: false
})

defineModel<StudioTool>('activeTool', { default: 'none' })
</script>

<template>
  <UCard class="w-full animate-pulse border-2 border-dashed border-muted" :ui="{ body: 'flex flex-col items-center justify-center min-h-100' }">
    <UIcon name="i-lucide-image" class="w-12 h-12 text-muted mb-3" />
    <span class="text-sm font-medium text-muted">Loading Image Studio...</span>
  </UCard>
</template>

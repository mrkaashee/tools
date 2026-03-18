<script lang="ts">
import { inject, computed } from 'vue'
import type { AppConfig } from '@nuxt/schema'
import theme from '../utils/themes/img-action-buttons'
import type { ComponentConfig } from '../types/tv'
import type { ImageEditorContext, ImgActionButtonsProps } from '../types/editor'
import { tv } from '../utils/tv'
import type { StudioAppConfig } from '../types/studio'

export type StudioActionButtons = ComponentConfig<typeof theme, AppConfig, 'studio'>

export interface StudioActionButtonsProps extends ImgActionButtonsProps {
  ui?: StudioActionButtons['slots']
}
</script>

<script setup lang="ts">
const appConfig = useAppConfig() as StudioAppConfig

const props = defineProps<StudioActionButtonsProps>()

const imgStudio = inject<ImageEditorContext>('imgStudio')

const resUI = computed(() => tv({ extend: tv(theme), ...(appConfig.ui?.actionButtons || {}) })(props.ui))

const activeTool = computed(() => imgStudio?.activeTool.value)

// List of tools that require an "Apply" step
const isApplyToolActive = computed(() => {
  const tools = ['stencil-circle', 'stencil-rectangle', 'annotate', 'censor', 'drawing']
  return activeTool.value && tools.includes(activeTool.value)
})

const startCropping = () => {
  imgStudio?.activateTool('stencil-circle')
}

const executeApply = () => {
  imgStudio?.applyAndExport(props.filename || 'export.png')
}
</script>

<template>
  <div :class="resUI.root()">
    <UButton
      v-if="!activeTool"
      label="Crop Avatar"
      icon="i-lucide-crop"
      size="xs"
      variant="ghost"
      :class="resUI.button()"
      @click="startCropping" />
    <UButton
      v-else-if="isApplyToolActive"
      label="Apply & Export"
      color="primary"
      icon="i-lucide-download"
      size="xs"
      :class="resUI.button()"
      @click="executeApply" />
    <slot />
  </div>
</template>

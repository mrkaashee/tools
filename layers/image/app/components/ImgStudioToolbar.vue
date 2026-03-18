<script lang="ts">
import { inject, computed } from 'vue'
import type { AppConfig } from '@nuxt/schema'
import theme from '../utils/themes/img-studio-toolbar'
import type { ComponentConfig } from '../types/tv'
import type { ImageEditorContext } from '../types/editor'
import { tv } from '../utils/tv'
import type { StudioAppConfig } from '../types/studio'

export type StudioToolbar = ComponentConfig<typeof theme, AppConfig, 'studio'>

export interface StudioToolbarProps {
  ui?: StudioToolbar['slots']
}
</script>

<script setup lang="ts">
const appConfig = useAppConfig() as StudioAppConfig

const props = defineProps<StudioToolbarProps>()

const imgStudio = inject<ImageEditorContext>('imgStudio')

if (!imgStudio) {
  throw new Error('ImgStudioToolbar must be used within an ImgStudio component')
}

const resUI = computed(() => tv({ extend: tv(theme), ...(appConfig.ui?.toolbar || {}) })(props.ui))

// Map context values for easier template access
const canUndo = computed(() => imgStudio.canUndo?.value ?? false)
const canRedo = computed(() => imgStudio.canRedo?.value ?? false)
const zoomLevel = computed(() => imgStudio.zoomLevel.value)
const zoom = computed({
  get: () => imgStudio.zoomLevel.value,
  set: val => { imgStudio.zoomLevel.value = val },
})

const undo = () => imgStudio.undo?.()
const redo = () => imgStudio.redo?.()
const resetAll = () => imgStudio.resetAll?.()
const zoomIn = () => imgStudio.zoomIn?.()
const zoomOut = () => imgStudio.zoomOut?.()
const resetZoom = () => imgStudio.resetZoom?.()
</script>

<template>
  <Teleport v-if="imgStudio?.toolbarTargetRef?.value" :to="imgStudio.toolbarTargetRef.value">
    <div :class="resUI.root()">
      <!-- History Controls -->
      <div :class="resUI.history()">
        <UButton
          icon="i-lucide-undo-2"
          color="neutral"
          variant="ghost"
          :disabled="!canUndo"
          title="Undo (Ctrl+Z)"
          @click="undo" />
        <UButton
          icon="i-lucide-redo-2"
          color="neutral"
          variant="ghost"
          :disabled="!canRedo"
          title="Redo (Ctrl+Y)"
          @click="redo" />
        <UButton
          icon="i-lucide-rotate-ccw"
          color="neutral"
          variant="ghost"
          title="Reset All Changes"
          @click="resetAll" />
      </div>

      <!-- Zoom Controls -->
      <div :class="resUI.zoom()">
        <UButton
          icon="i-lucide-zoom-out"
          color="neutral"
          variant="ghost"
          size="xs"
          title="Zoom Out"
          @click="zoomOut" />

        <div :class="resUI.zoomSliderWrapper()">
          <USlider
            v-model="zoom"
            :min="imgStudio.minZoom.value"
            :max="imgStudio.maxZoom.value"
            :step="0.01"
            size="sm"
            :class="resUI.zoomSlider()" />
          <span :class="resUI.zoomText()">
            {{ Math.round(zoomLevel * 100) }}%
          </span>
        </div>

        <UButton
          icon="i-lucide-zoom-in"
          color="neutral"
          variant="ghost"
          size="xs"
          title="Zoom In"
          @click="zoomIn" />
        <UButton
          icon="i-lucide-refresh-cw"
          color="neutral"
          variant="ghost"
          size="xs"
          title="Reset Zoom"
          @click="resetZoom" />
      </div>

      <!-- Right Slot -->
      <div :class="resUI.right()">
        <slot name="right" />
      </div>
    </div>
  </Teleport>
</template>

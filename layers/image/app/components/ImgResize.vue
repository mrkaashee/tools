<script lang="ts">
import { inject, computed } from 'vue'
import type { AppConfig } from '@nuxt/schema'
import theme from '../utils/themes/img-resize'
import type { ComponentConfig } from '../types/tv'
import type { ImageEditorContext } from '../types/editor'
import { tv } from '../utils/tv'
import type { StudioAppConfig } from '../types/studio'

export type StudioResize = ComponentConfig<typeof theme, AppConfig, 'studio'>

export interface StudioResizeProps {
  headless?: boolean
  presets?: { label: string, width: number, height: number }[]
  ui?: StudioResize['slots']
}
</script>

<script setup lang="ts">
const appConfig = useAppConfig() as StudioAppConfig

const props = defineProps<StudioResizeProps>()

const imgStudio = inject<ImageEditorContext>('imgStudio')

const resUI = computed(() => tv({ extend: tv(theme), ...(appConfig.ui?.resize || {}) })(props.ui))

const applyResize = (maxWidth: number, maxHeight: number) => {
  const canvas = imgStudio?.getCanvas()
  if (!canvas) return

  const srcW = canvas.width
  const srcH = canvas.height
  if (!srcW || !srcH) return

  // Scale proportionally to fit within maxWidth × maxHeight
  const scale = Math.min(maxWidth / srcW, maxHeight / srcH)

  const outW = Math.round(srcW * scale)
  const outH = Math.round(srcH * scale)

  if (outW === srcW && outH === srcH) return

  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = outW
  tempCanvas.height = outH
  const tempCtx = tempCanvas.getContext('2d')

  if (tempCtx) {
    tempCtx.drawImage(canvas, 0, 0, outW, outH)
    imgStudio?.commit(tempCanvas, 'resize')
  }
}

defineExpose({
  applyResize,
})
</script>

<template>
  <div :class="resUI.root()">
    <slot :apply-resize="applyResize">
      <div v-if="!props.headless" :class="resUI.header()">
        <h3 :class="resUI.title()">
          Quick Sizes
        </h3>
      </div>
      <div v-if="!props.headless" :class="resUI.grid()">
        <template v-if="props.presets && props.presets.length > 0">
          <UButton
            v-for="preset in props.presets"
            :key="preset.label"
            :label="preset.label"
            size="xs"
            color="neutral"
            variant="subtle"
            :class="resUI.preset()"
            @click="applyResize(preset.width, preset.height)" />
        </template>
        <template v-else>
          <UButton
            label="SD"
            size="xs"
            color="neutral"
            variant="subtle"
            :class="resUI.preset()"
            @click="applyResize(800, 600)" />
          <UButton
            label="HD"
            size="xs"
            color="neutral"
            variant="subtle"
            :class="resUI.preset()"
            @click="applyResize(1280, 720)" />
          <UButton
            label="FHD"
            size="xs"
            color="neutral"
            variant="subtle"
            :class="resUI.preset()"
            @click="applyResize(1920, 1080)" />
        </template>
      </div>
    </slot>
  </div>
</template>

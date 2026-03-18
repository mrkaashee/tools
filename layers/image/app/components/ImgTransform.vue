<script lang="ts">
import { ref, inject, computed } from 'vue'
import type { AppConfig } from '@nuxt/schema'
import theme from '../utils/themes/img-transform'
import type { ComponentConfig } from '../types/tv'
import type { ImageEditorContext, TransformState } from '../types/editor'
import { tv } from '../utils/tv'
import type { StudioAppConfig } from '../types/studio'

export type StudioTransform = ComponentConfig<typeof theme, AppConfig, 'studio'>

export interface StudioTransformProps {
  headless?: boolean
  ui?: StudioTransform['slots']
}
</script>

<script setup lang="ts">
const appConfig = useAppConfig() as StudioAppConfig

const props = defineProps<StudioTransformProps>()

const imgStudio = inject<ImageEditorContext>('imgStudio')

const resUI = computed(() => tv({ extend: tv(theme), ...(appConfig.ui?.transform || {}) })(props.ui))

const currentTransform = ref<TransformState>({
  rotation: 0,
  flipHorizontal: false,
  flipVertical: false,
})

const applyTransform = (angle = 0, h = false, v = false) => {
  const canvas = imgStudio?.getCanvas()
  if (!canvas) return

  const needsDimensionSwap = Math.abs(angle) % 180 === 90
  const width = needsDimensionSwap ? canvas.height : canvas.width
  const height = needsDimensionSwap ? canvas.width : canvas.height

  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = width
  tempCanvas.height = height
  const tempCtx = tempCanvas.getContext('2d')
  if (!tempCtx) return

  tempCtx.save()
  tempCtx.translate(width / 2, height / 2)

  if (angle !== 0) {
    tempCtx.rotate((angle * Math.PI) / 180)
  }

  const scaleX = h ? -1 : 1
  const scaleY = v ? -1 : 1
  tempCtx.scale(scaleX, scaleY)

  tempCtx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2)
  tempCtx.restore()

  imgStudio?.commit(tempCanvas, 'transform')
  imgStudio?.resetZoom()
}

const rotate = (angle: number) => {
  applyTransform(angle, false, false)
}

const flipHorizontal = () => {
  applyTransform(0, true, false)
}

const flipVertical = () => {
  applyTransform(0, false, true)
}

const resetTransform = () => {
  // Logic could be added here if needed
}

defineExpose({
  rotate,
  flipHorizontal,
  flipVertical,
  resetTransform,
  currentTransform,
})
</script>

<template>
  <div :class="resUI.root()">
    <slot
      :rotate="rotate"
      :flip-horizontal="flipHorizontal"
      :flip-vertical="flipVertical"
      :reset-transform="resetTransform"
      :current-transform="currentTransform">
      <div v-if="!props.headless" :class="resUI.header()">
        <h3 :class="resUI.title()">
          Transform
        </h3>
      </div>
      <div v-if="!props.headless" :class="resUI.grid()">
        <UButton
          icon="i-lucide-rotate-ccw"
          color="neutral"
          variant="subtle"
          title="Rotate -90"
          :class="resUI.button()"
          @click="rotate(-90)" />
        <UButton
          icon="i-lucide-rotate-cw"
          color="neutral"
          variant="subtle"
          title="Rotate +90"
          :class="resUI.button()"
          @click="rotate(90)" />
        <UButton
          icon="i-lucide-flip-horizontal"
          :color="currentTransform.flipHorizontal ? 'primary' : 'neutral'"
          variant="subtle"
          title="Flip X"
          :class="resUI.button()"
          @click="flipHorizontal" />
        <UButton
          icon="i-lucide-flip-vertical"
          :color="currentTransform.flipVertical ? 'primary' : 'neutral'"
          variant="subtle"
          title="Flip Y"
          :class="resUI.button()"
          @click="flipVertical" />
      </div>
    </slot>
  </div>
</template>

<script lang="ts" setup>
import type { ImageEditorContext, TransformState } from '../types/editor'

const imgEditor = inject<ImageEditorContext>('imgEditor')

const currentTransform = ref<TransformState>({
  rotation: 0,
  flipHorizontal: false,
  flipVertical: false,
})

const applyTransform = (angle = 0, h = false, v = false) => {
  const canvas = imgEditor?.getCanvas()
  if (!canvas) return

  const needsDimensionSwap = angle === 90 || angle === 270
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

  // Optimization: Pass the canvas directly instead of generating
  // a blocking data URL on the main thread
  imgEditor?.commit(tempCanvas, 'transform')
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
  // For transforms, reset could mean undoing the last transform
  // but usually it's better to just provide rotate/flip as one-shot actions
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
  <div class="u-img-transform">
    <slot
      :rotate="rotate"
      :flip-horizontal="flipHorizontal"
      :flip-vertical="flipVertical"
      :reset-transform="resetTransform"
      :current-transform="currentTransform" />
  </div>
</template>

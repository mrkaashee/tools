<script lang="ts" setup>
import type { ImageEditorContext } from '../types/editor'

const imgEditor = inject<ImageEditorContext>('imgEditor')

const applyResize = (maxWidth: number, maxHeight: number) => {
  const canvas = imgEditor?.getCanvas()
  if (!canvas) return

  const srcW = canvas.width
  const srcH = canvas.height
  if (!srcW || !srcH) return

  // Scale proportionally to fit within maxWidth × maxHeight (like CSS object-fit: contain)
  const scale = Math.min(maxWidth / srcW, maxHeight / srcH)

  const outW = Math.round(srcW * scale)
  const outH = Math.round(srcH * scale)

  // Nothing to do if the image is already exactly this size
  if (outW === srcW && outH === srcH) return

  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = outW
  tempCanvas.height = outH
  const tempCtx = tempCanvas.getContext('2d')

  if (tempCtx) {
    tempCtx.drawImage(canvas, 0, 0, outW, outH)
    imgEditor?.commit(tempCanvas, 'resize')
  }
}

defineExpose({
  applyResize,
})
</script>

<template>
  <div class="u-img-resize">
    <slot :apply-resize="applyResize" />
  </div>
</template>

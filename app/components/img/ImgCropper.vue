<script lang="ts" setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useEventListener, useResizeObserver } from '@vueuse/core'
import type { CropResult, CropConfig, ZoomConfig } from './types'

const props = defineProps<{
  src: string
  crop?: CropConfig
  zoom?: ZoomConfig | false
  hideActions?: boolean
}>()

const emit = defineEmits<{
  apply: [result: CropResult]
  cancel: []
  ready: []
}>()

const config = computed(() => ({
  aspect: props.crop?.aspect ?? null,
  presets: props.crop?.presets ?? [],
  shape: props.crop?.shape ?? 'rect',
  fixed: props.crop?.fixed ?? false,
  zoom: props.zoom ?? false,
  size: props.crop?.size,
  width: props.crop?.width,
  height: props.crop?.height,
  format: props.crop?.format ?? (props.crop?.shape === 'round' ? 'image/png' : 'image/jpeg'),
  quality: props.crop?.quality ?? 0.9
}))

/**
 * Parses aspect ratio values.
 * Supports:
 * - Tailwind-like strings: 'aspect-square' (1), 'aspect-video' (16/9), 'aspect-auto' (null)
 * - Ratio strings: '3/2' (1.5), '16:9' (1.777), '1' (1)
 * - Raw numbers
 * - null/undefined
 */
function parseAspect(val: string | number | null | undefined): number | null {
  if (val === null || val === undefined || val === 'aspect-auto' || val === 'auto') return null
  if (typeof val === 'number') return val

  const v = val.trim().toLowerCase()
  if (v === 'aspect-square' || v === 'square' || v === '1' || v === '1/1' || v === '1:1') return 1
  if (v === 'aspect-video' || v === 'video') return 16 / 9

  if (v.includes('/') || v.includes(':')) {
    const delimiter = v.includes('/') ? '/' : ':'
    const parts = v.split(delimiter)
    if (parts.length === 2) {
      const w = Number(parts[0])
      const h = Number(parts[1])
      if (!isNaN(w) && !isNaN(h) && h !== 0) return w / h
    }
  }

  const num = Number(v)
  return isNaN(num) ? null : num
}

const activeAspect = ref<number | null>(
  config.value.shape === 'round'
    ? 1
    : (parseAspect(config.value.aspect) ?? (config.value.width && config.value.height ? config.value.width / config.value.height : null))
)

watch(() => config.value.aspect, val => {
  if (config.value.shape === 'round') return // always 1:1 for round
  activeAspect.value = parseAspect(val) ?? (config.value.width && config.value.height ? config.value.width / config.value.height : null)
  applyAspect()
})

watch([() => config.value.width, () => config.value.height], () => {
  if (config.value.aspect === undefined || config.value.aspect === null) {
    activeAspect.value = (config.value.width && config.value.height) ? config.value.width / config.value.height : null
    applyAspect()
  }
})

const containerRef = ref<HTMLElement>()
const canvasRef = ref<HTMLCanvasElement>()
const imgRef = ref<HTMLImageElement>()

// State for drawing and interaction
let ctx: CanvasRenderingContext2D | null = null
const imgState = { x: 0, y: 0, w: 0, h: 0, scale: 1 } // Image bounds in canvas
const cropState = { x: 0, y: 0, w: 0, h: 0 } // Crop box bounds in canvas

const isDragging = ref(false)
let dragAction = '' // 'tl', 'tr', 'bl', 'br', 'move', 'tr_round', ''
let startMouseX = 0
let startMouseY = 0
let startCrop = { x: 0, y: 0, w: 0, h: 0 }
let startImg = { x: 0, y: 0, w: 0, h: 0 }

const hoverCursor = ref('default')
const HANDLE_SIZE = 12

// --- Initialization ---
onMounted(async () => {
  if (canvasRef.value) {
    ctx = canvasRef.value.getContext('2d')
  }
  await loadImage()
})

useEventListener(canvasRef, 'wheel', onWheel, { passive: false })
useEventListener(typeof window !== 'undefined' ? window : null, 'resize', initLayout)

useResizeObserver(containerRef, () => {
  initLayout()
})

async function loadImage() {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  imgRef.value = img

  await new Promise(resolve => {
    img.onload = resolve
    img.src = props.src
  })

  initLayout()
}

function initLayout() {
  if (!containerRef.value || !canvasRef.value || !imgRef.value) return
  if (imgRef.value.naturalWidth === 0 || imgRef.value.naturalHeight === 0) return

  const oldWidth = parseFloat(canvasRef.value.style.width || '0')
  const oldHeight = parseFloat(canvasRef.value.style.height || '0')

  const { width, height } = containerRef.value.getBoundingClientRect()
  if (width === 0 || height === 0) return // Wait for layout to settle (e.g. Vue transitions)

  // High DPI canvas
  const dpr = window.devicePixelRatio || 1
  canvasRef.value.width = width * dpr
  canvasRef.value.height = height * dpr
  ctx?.scale(dpr, dpr)
  canvasRef.value.style.width = width + 'px'
  canvasRef.value.style.height = height + 'px'

  // Fit image into container
  const isFixed = config.value.fixed
  const padding = 16

  const imgW = imgRef.value.naturalWidth
  const imgH = imgRef.value.naturalHeight

  const maxWidth = width - padding * 2
  const maxHeight = height - padding * 2
  const baseScale = Math.min(maxWidth / imgW, maxHeight / imgH)

  const hasExisting = cropState.w > 0 && imgState.scale > 0 && oldWidth > 0 && oldHeight > 0

  if (!hasExisting) {
    if (isFixed) {
      const diameter = Math.max(0, Math.min(width, height) - padding * 2)
      cropState.w = diameter
      cropState.h = diameter
    }
    else {
      cropState.w = (imgW * baseScale) * 0.8
      cropState.h = (imgH * baseScale) * 0.8
    }
    cropState.x = (width - cropState.w) / 2
    cropState.y = (height - cropState.h) / 2

    imgState.scale = baseScale
    imgState.w = imgW * baseScale
    imgState.h = imgH * baseScale
    imgState.x = (width - imgState.w) / 2
    imgState.y = (height - imgState.h) / 2

    applyAspect()
  }
  else {
    // Preserve state across window resizes / phone rotations
    const oldBaseScale = Math.min((oldWidth - padding * 2) / imgW, (oldHeight - padding * 2) / imgH)
    const zoomRelative = imgState.scale / (oldBaseScale || 1)
    const newScale = baseScale * zoomRelative

    // Get physical center of what we were looking at
    const imgCenterXRaw = (oldWidth / 2 - imgState.x) / imgState.scale
    const imgCenterYRaw = (oldHeight / 2 - imgState.y) / imgState.scale

    // Get physical boundaries of the crop box
    const cropPx = (cropState.x - imgState.x) / imgState.scale
    const cropPy = (cropState.y - imgState.y) / imgState.scale
    const cropPw = cropState.w / imgState.scale
    const cropPh = cropState.h / imgState.scale

    imgState.scale = newScale
    imgState.w = imgW * newScale
    imgState.h = imgH * newScale
    imgState.x = width / 2 - (imgCenterXRaw * newScale)
    imgState.y = height / 2 - (imgCenterYRaw * newScale)

    if (isFixed) {
      const diameter = Math.max(0, Math.min(width, height) - padding * 2)
      cropState.w = diameter
      cropState.h = diameter
      cropState.x = (width - diameter) / 2
      cropState.y = (height - diameter) / 2
    }
    else {
      cropState.w = cropPw * newScale
      cropState.h = cropPh * newScale
      cropState.x = imgState.x + (cropPx * newScale)
      cropState.y = imgState.y + (cropPy * newScale)
    }

    clampCropBox()
    clampImgToCrop()
  }

  draw()
  emit('ready')
}

// --- Aspect Logic ---
function applyAspect() {
  if (activeAspect.value === null) return

  // Fix aspect ratio by adjusting height from center
  const targetRatio = activeAspect.value
  const currentRatio = cropState.w / cropState.h

  if (currentRatio > targetRatio) {
    // Too wide, reduce width
    const newW = cropState.h * targetRatio
    cropState.x += (cropState.w - newW) / 2
    cropState.w = newW
  }
  else {
    // Too tall, reduce height
    const newH = cropState.w / targetRatio
    cropState.y += (cropState.h - newH) / 2
    cropState.h = newH
  }

  clampCropBox()
  draw()
}

function setAspect(val: string | number | null) {
  activeAspect.value = parseAspect(val)
  applyAspect()
}

// --- Rendering ---
function draw() {
  if (!ctx || !canvasRef.value || !imgRef.value) return
  const dpr = window.devicePixelRatio || 1
  const w = canvasRef.value.width / dpr
  const h = canvasRef.value.height / dpr

  ctx.clearRect(0, 0, w, h)

  // 1. Draw image everywhere
  ctx.drawImage(imgRef.value, imgState.x, imgState.y, imgState.w, imgState.h)

  // 2. Overlay dark mask with hole (cutout)
  ctx.save()
  ctx.fillStyle = config.value.fixed ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.6)'
  ctx.beginPath()
  ctx.rect(0, 0, w, h) // outer boundary

  if (config.value.shape === 'round') {
    const radius = Math.max(0, cropState.w / 2)
    // Create a hole by drawing in opposite direction
    ctx.arc(cropState.x + radius, cropState.y + radius, radius, 0, Math.PI * 2, true)
  }
  else {
    // Create a hole by drawing a rect in opposite direction
    ctx.rect(cropState.x + cropState.w, cropState.y, -cropState.w, cropState.h)
  }
  ctx.fill()
  ctx.restore()

  // 4. Draw crop border
  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
  ctx.shadowBlur = 4

  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 1
  if (config.value.shape === 'round') {
    const radius = Math.max(0, cropState.w / 2)
    ctx.beginPath()
    ctx.arc(cropState.x + radius, cropState.y + radius, radius, 0, Math.PI * 2)
    ctx.stroke()
  }
  else {
    ctx.strokeRect(cropState.x, cropState.y, cropState.w, cropState.h)
  }

  // Grid lines 3x3 only for rect
  if (config.value.shape !== 'round') {
    ctx.beginPath()
    for (let i = 1; i < 3; i++) {
      // Vertical
      ctx!.moveTo(cropState.x + (cropState.w / 3) * i, cropState.y)
      ctx!.lineTo(cropState.x + (cropState.w / 3) * i, cropState.y + cropState.h)
      // Horizontal
      ctx!.moveTo(cropState.x, cropState.y + (cropState.h / 3) * i)
      ctx!.lineTo(cropState.x + cropState.w, cropState.y + (cropState.h / 3) * i)
    }
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
    ctx.stroke()
  }

  // 5. Draw handles
  if (!config.value.fixed) {
    const hs = HANDLE_SIZE
    const hs2 = hs / 2
    ctx.fillStyle = '#fff'

    if (config.value.shape === 'round') {
      const cx = cropState.x + cropState.w / 2
      const cy = cropState.y + cropState.h / 2
      const R = cropState.w / 2
      // Place handle at top-right of the circle curve (45 degrees)
      const hx = cx + R * 0.7071
      const hy = cy - R * 0.7071

      ctx.beginPath()
      ctx.arc(hx, hy, hs2 + 1, 0, Math.PI * 2) // slightly larger handle for circle
      ctx.fill()
    }
    else {
      // Corner paths
      const rects: [number, number, number, number][] = [
        [cropState.x - hs2, cropState.y - hs2, hs, hs], // tl
        [cropState.x + cropState.w - hs2, cropState.y - hs2, hs, hs], // tr
        [cropState.x - hs2, cropState.y + cropState.h - hs2, hs, hs], // bl
        [cropState.x + cropState.w - hs2, cropState.y + cropState.h - hs2, hs, hs] // br
      ]
      rects.forEach(([rx, ry, rw, rh]) => ctx!.fillRect(rx, ry, rw, rh))
    }
  }

  ctx.restore()
}

// --- Interaction ---
function getMousePos(e: MouseEvent | TouchEvent) {
  if (!canvasRef.value) return { x: 0, y: 0 }
  const rect = canvasRef.value.getBoundingClientRect()
  const clientX = 'touches' in e ? e.touches[0]?.clientX ?? 0 : (e as MouseEvent).clientX
  const clientY = 'touches' in e ? e.touches[0]?.clientY ?? 0 : (e as MouseEvent).clientY
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  }
}

function getHitAction(x: number, y: number) {
  if (config.value.fixed) return 'pan'

  const hs2 = HANDLE_SIZE / 2 + 6 // +6px slop for easier grabbing

  if (config.value.shape === 'round') {
    const cx = cropState.x + cropState.w / 2
    const cy = cropState.y + cropState.h / 2
    const R = cropState.w / 2
    const hx = cx + R * 0.7071
    const hy = cy - R * 0.7071

    const trHit = Math.abs(x - hx) <= hs2 && Math.abs(y - hy) <= hs2
    if (trHit) return 'tr_round'
  }
  else {
    const tlHit = x >= cropState.x - hs2 && x <= cropState.x + hs2 && y >= cropState.y - hs2 && y <= cropState.y + hs2
    if (tlHit) return 'tl'
    const trHit = x >= cropState.x + cropState.w - hs2 && x <= cropState.x + cropState.w + hs2 && y >= cropState.y - hs2 && y <= cropState.y + hs2
    if (trHit) return 'tr'
    const blHit = x >= cropState.x - hs2 && x <= cropState.x + hs2 && y >= cropState.y + cropState.h - hs2 && y <= cropState.y + cropState.h + hs2
    if (blHit) return 'bl'
    const brHit = x >= cropState.x + cropState.w - hs2 && x <= cropState.x + cropState.w + hs2 && y >= cropState.y + cropState.h - hs2 && y <= cropState.y + cropState.h + hs2
    if (brHit) return 'br'
  }

  const moveHit = x >= cropState.x && x <= cropState.x + cropState.w && y >= cropState.y && y <= cropState.y + cropState.h
  if (moveHit) return 'move'

  return ''
}

function onHoverMove(e: MouseEvent | TouchEvent) {
  if (isDragging.value) return
  if (config.value.fixed) {
    hoverCursor.value = 'move'
    return
  }

  const { x, y } = getMousePos(e)
  const action = getHitAction(x, y)

  if (action === 'move') {
    hoverCursor.value = 'move'
  }
  else if (action === 'tl' || action === 'br') {
    hoverCursor.value = 'nwse-resize'
  }
  else if (action === 'tr' || action === 'bl' || action === 'tr_round') {
    hoverCursor.value = 'nesw-resize'
  }
  else {
    hoverCursor.value = 'default'
  }
}

function onPointerDown(e: MouseEvent | TouchEvent) {
  if (!imgRef.value) return
  isDragging.value = true

  const { x, y } = getMousePos(e)
  dragAction = getHitAction(x, y)
  if (!dragAction) return

  startMouseX = x
  startMouseY = y
  startCrop = { ...cropState }
  startImg = { ...imgState }

  if (typeof window !== 'undefined') {
    const moveEvent = e.type === 'touchstart' ? 'touchmove' : 'mousemove'
    const upEvent = e.type === 'touchstart' ? 'touchend' : 'mouseup'

    const removeMove = useEventListener(window, moveEvent, onPointerMove, { passive: false })
    const removeUp = useEventListener(window, upEvent, (ev: MouseEvent | TouchEvent) => {
      onPointerUp(ev)
      removeMove()
      removeUp()
    })
  }
}

function clampImgToCrop() {
  if (imgState.x > cropState.x) imgState.x = cropState.x
  if (imgState.y > cropState.y) imgState.y = cropState.y

  if (imgState.x + imgState.w < cropState.x + cropState.w) {
    imgState.x = cropState.x + cropState.w - imgState.w
  }
  if (imgState.y + imgState.h < cropState.y + cropState.h) {
    imgState.y = cropState.y + cropState.h - imgState.h
  }

  // Edge case Center
  if (imgState.w < cropState.w) imgState.x = cropState.x + (cropState.w - imgState.w) / 2
  if (imgState.h < cropState.h) imgState.y = cropState.y + (cropState.h - imgState.h) / 2
}

function clampCropBox() {
  // Min size
  const minSize = 20
  if (cropState.w < minSize) {
    if (dragAction === 'tl' || dragAction === 'bl') cropState.x -= (minSize - cropState.w)
    cropState.w = minSize
  }
  if (cropState.h < minSize) {
    if (dragAction === 'tl' || dragAction === 'tr' || dragAction === 'tr_round') cropState.y -= (minSize - cropState.h)
    cropState.h = minSize
  }

  // Constrain to image bounds only in non-fixed mode
  // In fixed mode the crop box is fixed-size and floats above the image
  if (!config.value.fixed) {
    if (cropState.x < imgState.x) {
      if (dragAction !== 'move') cropState.w -= (imgState.x - cropState.x)
      cropState.x = imgState.x
    }
    if (cropState.y < imgState.y) {
      if (dragAction !== 'move') cropState.h -= (imgState.y - cropState.y)
      cropState.y = imgState.y
    }
    if (cropState.x + cropState.w > imgState.x + imgState.w) {
      if (dragAction !== 'move') cropState.w = imgState.x + imgState.w - cropState.x
      else cropState.x = imgState.x + imgState.w - cropState.w
    }
    if (cropState.y + cropState.h > imgState.y + imgState.h) {
      if (dragAction !== 'move') cropState.h = imgState.y + imgState.h - cropState.y
      else cropState.y = imgState.y + imgState.h - cropState.h
    }
  }

  // Restore aspect ratio if squished by boundaries during a resize
  if (activeAspect.value !== null && dragAction !== 'move') {
    const ratio = activeAspect.value
    const maxW = cropState.w
    const maxH = cropState.h

    const restrictW = Math.min(maxW, maxH * ratio)
    const restrictH = restrictW / ratio

    if (dragAction.includes('t') || dragAction === 'tr_round') {
      cropState.y += (cropState.h - restrictH)
    }
    if (dragAction.includes('l')) {
      cropState.x += (cropState.w - restrictW)
    }

    cropState.w = restrictW
    cropState.h = restrictH
  }
}

function onPointerMove(e: MouseEvent | TouchEvent) {
  if (!isDragging.value) return
  e.preventDefault()

  const { x, y } = getMousePos(e)
  let dx = x - startMouseX
  let dy = y - startMouseY

  // Aspect ratio lock during drag
  if (activeAspect.value !== null && dragAction !== 'move' && dragAction !== 'tr_round') {
    const ratio = activeAspect.value
    // Use the dominant mouse movement axis to drive the opposite axis
    if (Math.abs(dx) > Math.abs(dy) * ratio) {
      if (dragAction === 'br' || dragAction === 'tl') dy = dx / ratio
      else if (dragAction === 'tr' || dragAction === 'bl') dy = -dx / ratio
    }
    else {
      if (dragAction === 'br' || dragAction === 'tl') dx = dy * ratio
      else if (dragAction === 'tr' || dragAction === 'bl') dx = -dy * ratio
    }
  }

  if (dragAction === 'pan') {
    imgState.x = startImg.x + dx
    imgState.y = startImg.y + dy
    clampImgToCrop()
  }
  else if (dragAction === 'tr_round') {
    // scale dx so mouse stays on handle, keeping bottom-left anchored
    const dx_scaled = dx * 1.17157
    cropState.w = startCrop.w + dx_scaled
    cropState.h = cropState.w // aspect 1
    cropState.y = startCrop.y + startCrop.h - cropState.h
  }
  else if (dragAction === 'move') {
    cropState.x = startCrop.x + dx
    cropState.y = startCrop.y + dy
  }
  else {
    if (dragAction.includes('t')) {
      cropState.y = startCrop.y + dy
      cropState.h = startCrop.h - dy
    }
    if (dragAction.includes('b')) {
      cropState.h = startCrop.h + dy
    }
    if (dragAction.includes('l')) {
      cropState.x = startCrop.x + dx
      cropState.w = startCrop.w - dx
    }
    if (dragAction.includes('r')) {
      cropState.w = startCrop.w + dx
    }
  }

  clampCropBox()
  draw()
}

function onPointerUp(_e: MouseEvent | TouchEvent) {
  isDragging.value = false
  if (typeof window !== 'undefined') {
    window.removeEventListener('mousemove', onPointerMove)
    window.removeEventListener('touchmove', onPointerMove)
    window.removeEventListener('mouseup', onPointerUp)
    window.removeEventListener('touchend', onPointerUp)
  }
}

function onWheel(e: WheelEvent) {
  if (config.value.zoom === false || !imgRef.value) return
  e.preventDefault()

  const zc = typeof config.value.zoom === 'object' ? config.value.zoom : {}
  const zoomStep = zc.step ?? 0.05
  const delta = e.deltaY > 0 ? -zoomStep : zoomStep

  const oldScale = imgState.scale
  let newScale = oldScale + oldScale * delta

  // Constrain zoom out, allowing empty space (contain behavior)
  const minScaleX = Math.max(0, cropState.w / imgRef.value.naturalWidth)
  const minScaleY = Math.max(0, cropState.h / imgRef.value.naturalHeight)
  const baseScale = Math.min(minScaleX, minScaleY)
  const minScale = Math.max(0.01, zc.min ?? baseScale)
  const maxScale = zc.max ?? (baseScale * 10)

  if (newScale < minScale) newScale = minScale
  if (newScale > maxScale) newScale = maxScale

  // Focus zoom on the mouse pointer position or center
  let focusX = cropState.x + cropState.w / 2
  let focusY = cropState.y + cropState.h / 2

  const { x, y } = getMousePos(e)
  // Re-center focus to mouse if mouse is inside bounds
  const moveHit = x >= cropState.x && x <= cropState.x + cropState.w && y >= cropState.y && y <= cropState.y + cropState.h
  if (moveHit) {
    focusX = x
    focusY = y
  }

  const imgFocusX = (focusX - imgState.x) / oldScale
  const imgFocusY = (focusY - imgState.y) / oldScale

  imgState.scale = newScale
  imgState.w = imgRef.value.naturalWidth * newScale
  imgState.h = imgRef.value.naturalHeight * newScale

  imgState.x = focusX - imgFocusX * newScale
  imgState.y = focusY - imgFocusY * newScale

  clampImgToCrop()
  draw()
}

// --- Output ---
function apply() {
  if (!imgRef.value) return

  // Physical image pixels
  const px = (cropState.x - imgState.x) / imgState.scale
  const py = (cropState.y - imgState.y) / imgState.scale
  const pw = cropState.w / imgState.scale
  const ph = cropState.h / imgState.scale

  const outW = config.value.width || config.value.size || pw
  const outH = config.value.height || config.value.size || ph

  const c = document.createElement('canvas')
  c.width = outW
  c.height = outH
  const outCtx = c.getContext('2d')!

  if (config.value.shape === 'round') {
    outCtx.beginPath()
    outCtx.arc(outW / 2, outH / 2, outW / 2, 0, Math.PI * 2)
    outCtx.clip()
  }

  // Draw mapping exactly as it sits relative to the crop box
  const outputScaleX = outW / pw
  const outputScaleY = outH / ph

  outCtx.save()
  outCtx.scale(outputScaleX, outputScaleY)
  outCtx.drawImage(imgRef.value, -px, -py)
  outCtx.restore()

  emit('apply', {
    x: px,
    y: py,
    width: pw,
    height: ph,
    outWidth: outW,
    outHeight: outH,
    dataUrl: c.toDataURL(config.value.format, config.value.quality)
  })
}

function cancel() {
  emit('cancel')
}

defineExpose({
  apply,
  cancel
})
</script>

<template>
  <div class="flex flex-col w-full h-full">
    <!-- Optional Presets Header -->
    <div v-if="config.presets.length > 0" class="absolute top-0 left-0 right-0 z-20 flex justify-center gap-2 px-4 py-3 overflow-x-auto pointer-events-none *:pointer-events-auto">
      <UButton
        v-for="preset in config.presets"
        :key="preset.label"
        :label="preset.label"
        :variant="activeAspect === parseAspect(preset.value) ? 'solid' : 'soft'"
        size="xs"
        @click="setAspect(preset.value)" />
    </div>

    <!-- Canvas Area -->
    <div
      ref="containerRef"
      class="flex-1 w-full h-full relative overflow-hidden select-none"
      :style="{ touchAction: isDragging ? 'none' : 'pan-y' }">
      <canvas
        ref="canvasRef"
        class="absolute top-0 left-0"
        :class="{ 'cursor-grabbing': hoverCursor === 'grabbing' }"
        :style="{ cursor: hoverCursor }"
        @mousemove="onHoverMove"
        @mousedown="onPointerDown"
        @touchstart="onPointerDown" />
    </div>

    <!-- Action Footer -->
    <div v-if="!hideActions" class="absolute bottom-0 left-0 right-0 z-20 flex justify-center gap-3 px-4 py-3 pointer-events-none *:pointer-events-auto">
      <UButton
        label="Cancel"
        color="neutral"
        variant="solid"
        class="shadow-md"
        icon="i-lucide-x"
        @click="cancel" />
      <UButton
        label="Apply Crop"
        color="primary"
        variant="solid"
        class="shadow-md"
        icon="i-lucide-check"
        @click="apply" />
    </div>
  </div>
</template>

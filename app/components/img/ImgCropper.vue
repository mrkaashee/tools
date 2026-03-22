<script lang="ts" setup>
import { ref, onMounted, watch, computed, reactive } from 'vue'
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
  naked: props.crop?.naked ?? false,
  zoom: props.zoom ?? false,
  size: props.crop?.size,
  width: props.crop?.width,
  height: props.crop?.height,
  format: props.crop?.format ?? (props.crop?.shape === 'round' ? 'image/png' : 'image/jpeg'),
  quality: props.crop?.quality ?? 0.9
}))

/**
 * Parses aspect ratio values.
 */
function parseAspect(val: string | number | null | undefined): number | null {
  if (val === null || val === undefined || val === 'aspect-auto' || val === 'auto') return null
  if (typeof val === 'number') return val

  const v = val.trim().toLowerCase()
  const square = ['aspect-square', 'square', '1', '1/1', '1:1']
  if (square.includes(v)) return 1
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
  if (config.value.shape === 'round') return
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
const isDragging = ref(false)
const imgState = reactive({ x: 0, y: 0, w: 0, h: 0, scale: 0 })
const cropState = reactive({ x: 0, y: 0, w: 0, h: 0 })
let dragAction = ''
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

useEventListener(canvasRef, 'wheel', e => onWheel(e), { passive: false })
useEventListener(typeof window !== 'undefined' ? window : null, 'resize', () => initLayout(false))

useResizeObserver(containerRef, () => {
  initLayout(false)
})

async function loadImage() {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  imgRef.value = img
  await new Promise(resolve => {
    img.onload = resolve
    img.src = props.src
  })

  // Delay to allow aspect-ratio layouts to settle
  await new Promise(resolve => setTimeout(resolve, 60))

  // Reset state
  cropState.w = 0
  imgState.scale = 0

  initLayout(true)
}

function initLayout(forceReCenter = false) {
  if (!containerRef.value || !canvasRef.value || !imgRef.value) return
  if (imgRef.value.naturalWidth === 0 || imgRef.value.naturalHeight === 0) return

  const oldWidth = parseFloat(canvasRef.value.style.width || '0')
  const oldHeight = parseFloat(canvasRef.value.style.height || '0')

  const { width, height } = containerRef.value.getBoundingClientRect()
  if (width === 0 || height === 0) return

  const dpr = window.devicePixelRatio || 1
  canvasRef.value.width = width * dpr
  canvasRef.value.height = height * dpr
  ctx?.scale(dpr, dpr)
  canvasRef.value.style.width = width + 'px'
  canvasRef.value.style.height = height + 'px'

  const isFixed = config.value.naked ? true : config.value.fixed
  const padding = config.value.naked ? 0 : 16

  const imgW = imgRef.value.naturalWidth
  const imgH = imgRef.value.naturalHeight
  const maxWidth = width - padding * 2
  const maxHeight = height - padding * 2
  const baseScale = isFixed
    ? Math.max(maxWidth / imgW, maxHeight / imgH)
    : Math.min(maxWidth / imgW, maxHeight / imgH)

  const hasExisting = cropState.w > 0 && imgState.scale > 0 && oldWidth > 0 && oldHeight > 0

  if (!hasExisting) {
    if (isFixed) {
      if (config.value.naked) {
        cropState.w = width
        cropState.h = height
        cropState.x = 0
        cropState.y = 0
      }
      else {
        // Maximize initial crop box based on target aspect
        const target = activeAspect.value || 1
        const containerAspect = width / height
        const pad2 = padding * 2
        if (containerAspect > target) {
          // Container is wider than target, height is limiting
          cropState.h = height - pad2
          cropState.w = cropState.h * target
        }
        else {
          // Container is taller than target, width is limiting
          cropState.w = width - pad2
          cropState.h = cropState.w / target
        }
        cropState.x = (width - cropState.w) / 2
        cropState.y = (height - cropState.h) / 2
      }
    }
    else {
      // Free mode: 80% of image size
      cropState.w = (imgW * baseScale) * 0.8
      cropState.h = (imgH * baseScale) * 0.8
      cropState.x = (width - cropState.w) / 2
      cropState.y = (height - cropState.h) / 2
    }

    imgState.scale = baseScale
    imgState.w = imgW * baseScale
    imgState.h = imgH * baseScale
    imgState.x = (width - imgState.w) / 2
    imgState.y = (height - imgState.h) / 2

    applyAspect()
    clampImgToCrop() // Ensure image covers the newly sized crop box
  }
  else {
    const oldBaseS = Math.min((oldWidth - padding * 2) / imgW, (oldHeight - padding * 2) / imgH)
    const zoomRel = imgState.scale / (oldBaseS || 1)
    const newScale = baseScale * zoomRel

    const imgCXRaw = (oldWidth / 2 - imgState.x) / imgState.scale
    const imgCYRaw = (oldHeight / 2 - imgState.y) / imgState.scale

    const cropPx = (cropState.x - imgState.x) / imgState.scale
    const cropPy = (cropState.y - imgState.y) / imgState.scale
    const cropPw = cropState.w / imgState.scale
    const cropPh = cropState.h / imgState.scale

    imgState.scale = newScale
    imgState.w = imgW * newScale
    imgState.h = imgH * newScale

    if (!forceReCenter) {
      imgState.x = width / 2 - (imgCXRaw * newScale)
      imgState.y = height / 2 - (imgCYRaw * newScale)
    }
    else {
      imgState.x = (width - imgState.w) / 2
      imgState.y = (height - imgState.h) / 2
    }

    if (isFixed) {
      if (config.value.naked) {
        cropState.w = width
        cropState.h = height
        cropState.x = 0
        cropState.y = 0
      }
      else {
        const d = Math.max(0, Math.min(width, height) - padding * 2)
        cropState.w = d
        cropState.h = d
        cropState.x = (width - d) / 2
        cropState.y = (height - d) / 2
      }
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

function applyAspect() {
  const isNaked = config.value.naked
  if (activeAspect.value === null || isNaked) {
    if (isNaked && containerRef.value) {
      const { width, height } = containerRef.value.getBoundingClientRect()
      cropState.x = 0
      cropState.y = 0
      cropState.w = width
      cropState.h = height
    }
    draw()
    return
  }

  const target = activeAspect.value
  const current = cropState.w / cropState.h
  if (current > target) {
    const newW = cropState.h * target
    cropState.x += (cropState.w - newW) / 2
    cropState.w = newW
  }
  else {
    const newH = cropState.w / target
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

function draw() {
  if (!ctx || !canvasRef.value || !imgRef.value) return
  const dpr = window.devicePixelRatio || 1
  const w = canvasRef.value.width / dpr
  const h = canvasRef.value.height / dpr

  ctx.clearRect(0, 0, w, h)
  ctx.drawImage(imgRef.value, imgState.x, imgState.y, imgState.w, imgState.h)

  if (!config.value.naked) {
    ctx.save()
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.beginPath()
    ctx.rect(0, 0, w, h)
    if (config.value.shape === 'round') {
      const r = Math.max(0, cropState.w / 2)
      ctx.arc(cropState.x + r, cropState.y + r, r, 0, Math.PI * 2, true)
    }
    else {
      ctx.rect(cropState.x + cropState.w, cropState.y, -cropState.w, cropState.h)
    }
    ctx.fill()
    ctx.restore()

    ctx.save()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 1
    if (config.value.shape === 'round') {
      const r = Math.max(0, cropState.w / 2)
      ctx.beginPath()
      ctx.arc(cropState.x + r, cropState.y + r, r, 0, Math.PI * 2)
      ctx.stroke()
    }
    else {
      ctx.strokeRect(cropState.x, cropState.y, cropState.w, cropState.h)
      ctx.beginPath()
      for (let i = 1; i < 3; i++) {
        ctx.moveTo(cropState.x + (cropState.w / 3) * i, cropState.y)
        ctx.lineTo(cropState.x + (cropState.w / 3) * i, cropState.y + cropState.h)
        ctx.moveTo(cropState.x, cropState.y + (cropState.h / 3) * i)
        ctx.lineTo(cropState.x + cropState.w, cropState.y + (cropState.h / 3) * i)
      }
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
      ctx.stroke()
    }
    ctx.restore()

    if (!config.value.fixed) {
      const hs = HANDLE_SIZE
      const hs2 = hs / 2
      ctx.save()
      ctx.fillStyle = '#fff'
      if (config.value.shape === 'round') {
        const cx = cropState.x + cropState.w / 2
        const cy = cropState.y + cropState.h / 2
        const r = cropState.w / 2
        ctx.beginPath()
        ctx.arc(cx + r * 0.7071, cy - r * 0.7071, hs2 + 1, 0, Math.PI * 2)
        ctx.fill()
      }
      else {
        const rects: [number, number, number, number][] = [
          [cropState.x - hs2, cropState.y - hs2, hs, hs],
          [cropState.x + cropState.w - hs2, cropState.y - hs2, hs, hs],
          [cropState.x - hs2, cropState.y + cropState.h - hs2, hs, hs],
          [cropState.x + cropState.w - hs2, cropState.y + cropState.h - hs2, hs, hs]
        ]
        rects.forEach(r => ctx!.fillRect(r[0], r[1], r[2], r[3]))
      }
      ctx.restore()
    }
  }
}

function getMousePos(e: MouseEvent | TouchEvent) {
  if (!canvasRef.value) return { x: 0, y: 0 }
  const rect = canvasRef.value.getBoundingClientRect()
  const cx = 'touches' in e ? e.touches[0]?.clientX ?? 0 : (e as MouseEvent).clientX
  const cy = 'touches' in e ? e.touches[0]?.clientY ?? 0 : (e as MouseEvent).clientY
  return { x: cx - rect.left, y: cy - rect.top }
}

function getHitAction(x: number, y: number) {
  if (config.value.fixed) return 'pan'
  const hs2 = HANDLE_SIZE / 2 + 6
  if (config.value.shape === 'round') {
    const cx = cropState.x + cropState.w / 2
    const cy = cropState.y + cropState.h / 2
    const r = cropState.w / 2
    if (Math.abs(x - (cx + r * 0.7071)) <= hs2 && Math.abs(y - (cy - r * 0.7071)) <= hs2) return 'tr_round'
  }
  else {
    if (x >= cropState.x - hs2 && x <= cropState.x + hs2 && y >= cropState.y - hs2 && y <= cropState.y + hs2) return 'tl'
    if (x >= cropState.x + cropState.w - hs2 && x <= cropState.x + cropState.w + hs2 && y >= cropState.y - hs2 && y <= cropState.y + hs2) return 'tr'
    if (x >= cropState.x - hs2 && x <= cropState.x + hs2 && y >= cropState.y + cropState.h - hs2 && y <= cropState.y + cropState.h + hs2) return 'bl'
    if (x >= cropState.x + cropState.w - hs2 && x <= cropState.x + cropState.w + hs2 && y >= cropState.y + cropState.h - hs2 && y <= cropState.y + cropState.h + hs2) return 'br'
  }
  if (x >= cropState.x && x <= cropState.x + cropState.w && y >= cropState.y && y <= cropState.y + cropState.h) return 'move'
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
  if (action === 'move') hoverCursor.value = 'move'
  else if (action === 'tl' || action === 'br') hoverCursor.value = 'nwse-resize'
  else if (action === 'tr' || action === 'bl' || action === 'tr_round') hoverCursor.value = 'nesw-resize'
  else hoverCursor.value = 'default'
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
    const move = e.type === 'touchstart' ? 'touchmove' : 'mousemove'
    const up = e.type === 'touchstart' ? 'touchend' : 'mouseup'
    const removeMove = useEventListener(window, move, onPointerMove, { passive: false })
    const removeUp = useEventListener(window, up, (ev: MouseEvent | TouchEvent) => {
      onPointerUp(ev)
      removeMove()
      removeUp()
    })
  }
}

function clampImgToCrop() {
  const isNaked = config.value.naked
  const cx = isNaked ? 0 : cropState.x
  const cy = isNaked ? 0 : cropState.y
  const dpr = window.devicePixelRatio || 1
  const cw = isNaked ? (canvasRef.value?.width ? canvasRef.value.width / dpr : 0) : cropState.w
  const ch = isNaked ? (canvasRef.value?.height ? canvasRef.value.height / dpr : 0) : cropState.h

  if (imgState.x > cx) imgState.x = cx
  if (imgState.y > cy) imgState.y = cy
  if (imgState.x + imgState.w < cx + cw) imgState.x = cx + cw - imgState.w
  if (imgState.y + imgState.h < cy + ch) imgState.y = cy + ch - imgState.h

  if (imgState.w < cw - 0.5) imgState.x = cx + (cw - imgState.w) / 2
  if (imgState.h < ch - 0.5) imgState.y = cy + (ch - imgState.h) / 2
}

function clampCropBox() {
  const minSize = 20
  if (cropState.w < minSize) {
    if (dragAction === 'tl' || dragAction === 'bl') cropState.x -= (minSize - cropState.w)
    cropState.w = minSize
  }
  if (cropState.h < minSize) {
    if (dragAction === 'tl' || dragAction === 'tr' || dragAction === 'tr_round') {
      cropState.y -= (minSize - cropState.h)
    }
    cropState.h = minSize
  }
  if (!config.value.fixed) {
    if (cropState.x < imgState.x) {
      if (dragAction !== 'move') cropState.w -= (imgState.x - cropState.x)
      cropState.x = imgState.x
    }
    if (cropState.y < imgState.y) {
      if (dragAction !== 'move') cropState.h -= (imgState.y - cropState.y)
      cropState.y = imgState.y
    }
    const maxCW = imgState.x + imgState.w
    const maxCH = imgState.y + imgState.h
    if (cropState.x + cropState.w > maxCW) {
      if (dragAction !== 'move') cropState.w = maxCW - cropState.x
      else cropState.x = maxCW - cropState.w
    }
    if (cropState.y + cropState.h > maxCH) {
      if (dragAction !== 'move') cropState.h = maxCH - cropState.y
      else cropState.y = maxCH - cropState.h
    }
  }
  if (activeAspect.value !== null && dragAction !== 'move') {
    const r = activeAspect.value
    const rw = Math.min(cropState.w, cropState.h * r)
    const rh = rw / r
    if (dragAction.includes('t') || dragAction === 'tr_round') cropState.y += (cropState.h - rh)
    if (dragAction.includes('l')) cropState.x += (cropState.w - rw)
    cropState.w = rw
    cropState.h = rh
  }
}

function onPointerMove(e: MouseEvent | TouchEvent) {
  if (!isDragging.value) return
  e.preventDefault()
  const { x, y } = getMousePos(e)
  let dx = x - startMouseX
  let dy = y - startMouseY
  if (activeAspect.value !== null && !['move', 'tr_round', 'pan'].includes(dragAction)) {
    const r = activeAspect.value
    if (Math.abs(dx) > Math.abs(dy) * r) {
      if (['br', 'tl'].includes(dragAction)) dy = dx / r
      else if (['tr', 'bl'].includes(dragAction)) dy = -dx / r
    }
    else {
      if (['br', 'tl'].includes(dragAction)) dx = dy * r
      else if (['tr', 'bl'].includes(dragAction)) dx = -dy * r
    }
  }
  if (dragAction === 'pan') {
    imgState.x = startImg.x + dx
    imgState.y = startImg.y + dy
    clampImgToCrop()
  }
  else if (dragAction === 'tr_round') {
    const d = dx * 1.17157
    cropState.w = startCrop.w + d
    cropState.h = cropState.w
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
    if (dragAction.includes('b')) cropState.h = startCrop.h + dy
    if (dragAction.includes('l')) {
      cropState.x = startCrop.x + dx
      cropState.w = startCrop.w - dx
    }
    if (dragAction.includes('r')) cropState.w = startCrop.w + dx
  }
  clampCropBox()
  draw()
}

function onPointerUp(_e: MouseEvent | TouchEvent) {
  isDragging.value = false
}

function onWheel(e: WheelEvent) {
  if (config.value.zoom === false || !imgRef.value) return
  e.preventDefault()
  const zc = typeof config.value.zoom === 'object' ? config.value.zoom : {}
  const step = zc.step ?? 0.05
  const delta = e.deltaY > 0 ? -step : step
  const oldS = imgState.scale
  let newS = oldS + oldS * delta
  const msX = Math.max(0, cropState.w / imgRef.value.naturalWidth)
  const msY = Math.max(0, cropState.h / imgRef.value.naturalHeight)
  const bs = config.value.fixed ? Math.max(msX, msY) : Math.min(msX, msY)
  const minS = Math.max(0.01, zc.min ?? bs)
  const maxS = zc.max ?? (bs * 10)
  if (newS < minS) newS = minS
  if (newS > maxS) newS = maxS
  let focusX = cropState.x + cropState.w / 2
  let focusY = cropState.y + cropState.h / 2
  const { x, y } = getMousePos(e)
  if (x >= cropState.x && x <= cropState.x + cropState.w && y >= cropState.y && y <= cropState.y + cropState.h) {
    focusX = x
    focusY = y
  }
  const ifX = (focusX - imgState.x) / oldS
  const ifY = (focusY - imgState.y) / oldS
  imgState.scale = newS
  imgState.w = imgRef.value.naturalWidth * newS
  imgState.h = imgRef.value.naturalHeight * newS
  imgState.x = focusX - ifX * newS
  imgState.y = focusY - ifY * newS
  clampImgToCrop()
  draw()
}

function apply() {
  if (!imgRef.value) return
  const px = (cropState.x - imgState.x) / imgState.scale
  const py = (cropState.y - imgState.y) / imgState.scale
  const pw = cropState.w / imgState.scale
  const ph = cropState.h / imgState.scale
  const ow = config.value.width || config.value.size || pw
  const oh = config.value.height || config.value.size || ph
  const c = document.createElement('canvas')
  c.width = ow
  c.height = oh
  const octx = c.getContext('2d')!
  if (config.value.shape === 'round') {
    octx.beginPath()
    octx.arc(ow / 2, oh / 2, ow / 2, 0, Math.PI * 2)
    octx.clip()
  }
  octx.save()
  octx.scale(ow / pw, oh / ph)
  octx.drawImage(imgRef.value, -px, -py)
  octx.restore()
  emit('apply', {
    x: px,
    y: py,
    width: pw,
    height: ph,
    outWidth: ow,
    outHeight: oh,
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
    <div
      v-if="config.presets.length > 0"
      class="absolute top-0 left-0 right-0 z-20 flex justify-center gap-2 px-4 py-3 overflow-x-auto pointer-events-none *:pointer-events-auto">
      <UButton
        v-for="preset in config.presets"
        :key="preset.label"
        :label="preset.label"
        :variant="activeAspect === parseAspect(preset.value) ? 'solid' : 'soft'"
        size="xs"
        @click="setAspect(preset.value)" />
    </div>

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

    <div
      v-if="!hideActions"
      class="absolute bottom-0 left-0 right-0 z-20 flex justify-center gap-3 px-4 py-3 pointer-events-none *:pointer-events-auto">
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

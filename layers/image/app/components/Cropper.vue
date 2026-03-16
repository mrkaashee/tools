<!-- eslint-disable vue/multi-word-component-names -->
<script lang="ts" setup>
import { useResizeObserver, useEventListener } from '@vueuse/core'
import type { CropperProps, CropperEmits } from '../types/cropper'

const props = withDefaults(defineProps<CropperProps>(), {
  src: null,
  mode: 'move-box',
  shape: 'rectangle',
  aspectRatio: 0,
  minWidth: 50,
  minHeight: 50,
  maxWidth: Infinity,
  maxHeight: Infinity,
  initialCropPercent: 80,
  borderStyle: 'solid',
  enableZoom: true,
  minZoom: 1,
  maxZoom: 5,
  zoomStep: 0.1,
  zoomSpeed: 0.1,
  showZoomControls: true,
})

const emit = defineEmits<CropperEmits>()

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const containerRef = ref<HTMLElement | null>(null)
const bgImageRef = ref<HTMLImageElement | null>(null)

// ─── Zoom (initialize first if enabled) ──────────────────────────────────────
const zoomLevel = ref(1)

// ─── Composables ──────────────────────────────────────────────────────────────
const {
  containerSize,
  imgNatural,
  imageLoaded,
  imageError,
  isInteracting,
  crop,
  imagePan,
  moveImageCropSize,
  effectiveAspectRatio,
  display,
  initializeCrop,
  getCurrentCoordinates,
  transformState,
  rotateRight,
  rotateLeft,
  rotateTo,
  flipHorizontal,
  flipVertical,
  resetTransforms,
  getTransformState,
} = useCropper(
  {
    mode: props.mode,
    shape: props.shape,
    aspectRatio: props.aspectRatio,
    minWidth: props.minWidth,
    minHeight: props.minHeight,
    maxWidth: props.maxWidth,
    maxHeight: props.maxHeight,
    initialCropPercent: props.initialCropPercent,
    enableZoom: props.enableZoom,
    minZoom: props.minZoom,
    maxZoom: props.maxZoom,
    zoomStep: props.zoomStep,
    zoomSpeed: props.zoomSpeed,
  },
  props.enableZoom ? zoomLevel : undefined,
  emit
)

// Initialize zoom composable after cropper
const zoom = props.enableZoom
  ? useCropperZoom(imgNatural, containerSize, {
      minZoom: props.minZoom,
      maxZoom: props.maxZoom,
      zoomStep: props.zoomStep,
      zoomSpeed: props.zoomSpeed,
    })
  : null

// Sync zoom levels
if (zoom) {
  watch(() => zoom.zoomLevel.value, newZoom => {
    zoomLevel.value = newZoom
  })
}

const { imageStyle, stencilStyle, stencilImageStyle } = useCropperStyles(
  crop,
  imagePan,
  moveImageCropSize,
  containerSize,
  display,
  props.mode,
  transformState,
  300 // transformDuration
)

const notifyChange = () => {
  emit('change', getCurrentCoordinates())
}

// ─── Interaction ──────────────────────────────────────────────────────────────
const { startInteraction, circleCursor, updateCircleCursor } = useCropperInteraction(
  crop,
  imagePan,
  moveImageCropSize,
  imgNatural,
  display,
  isInteracting,
  containerRef,
  {
    mode: props.mode,
    shape: props.shape,
    minWidth: props.minWidth,
    minHeight: props.minHeight,
    maxWidth: props.maxWidth,
    maxHeight: props.maxHeight,
    effectiveAspectRatio: effectiveAspectRatio.value,
  },
  notifyChange
)

// ─── Zoom event handlers ──────────────────────────────────────────────────────
const handleWheel = (e: WheelEvent) => {
  if (!props.enableZoom || !zoom || !containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  const cursorPos = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  }
  zoom.handleWheel(e, cursorPos)
}

// Pinch zoom state
let pinchStartDistance = 0

const handleTouchStart = (e: TouchEvent) => {
  if (!props.enableZoom || !zoom || e.touches.length !== 2) return
  const touch1 = e.touches[0]
  const touch2 = e.touches[1]
  if (!touch1 || !touch2) return
  pinchStartDistance = Math.hypot(
    touch2.clientX - touch1.clientX,
    touch2.clientY - touch1.clientY
  )
}

const handleTouchMove = (e: TouchEvent) => {
  if (!props.enableZoom || !zoom || e.touches.length !== 2) return
  e.preventDefault()

  const touch1 = e.touches[0]
  const touch2 = e.touches[1]
  if (!touch1 || !touch2) return

  const currentDistance = Math.hypot(
    touch2.clientX - touch1.clientX,
    touch2.clientY - touch1.clientY
  )

  if (pinchStartDistance > 0) {
    const scale = currentDistance / pinchStartDistance

    const centerX = (touch1.clientX + touch2.clientX) / 2
    const centerY = (touch1.clientY + touch2.clientY) / 2

    if (containerRef.value) {
      const rect = containerRef.value.getBoundingClientRect()
      zoom.handlePinch(scale, {
        x: centerX - rect.left,
        y: centerY - rect.top,
      })
    }
  }
}

// ─── Image load ───────────────────────────────────────────────────────────────
const handleLoad = () => {
  if (!bgImageRef.value) return
  imgNatural.value = { width: bgImageRef.value.naturalWidth, height: bgImageRef.value.naturalHeight }
  imageLoaded.value = true
  imageError.value = false
  initializeCrop()
  emit('ready')
  notifyChange()
}

const handleError = () => {
  imageError.value = true
  imageLoaded.value = false
  emit('error', new Error('Failed to load image'))
}

watch(() => props.src, () => {
  imageLoaded.value = false
  imageError.value = false
})

// ─── Canvas export ────────────────────────────────────────────────────────────
const getCanvas = (opts: { width?: number, height?: number } = {}) => {
  if (!bgImageRef.value || !imageLoaded.value) return null
  const coords = getCurrentCoordinates()
  return cropToCanvas(
    bgImageRef.value,
    coords.x,
    coords.y,
    coords.width,
    coords.height,
    { ...opts, isCircle: props.shape === 'circle', transforms: getTransformState() }
  )
}

const getBlob = async (opts: { width?: number, height?: number, format?: 'image/png' | 'image/jpeg' | 'image/webp', quality?: number } = {}) => {
  const canvas = getCanvas(opts)
  if (!canvas) return null
  return canvasToBlob(canvas, opts.format, opts.quality)
}

const getDataURL = (opts: { width?: number, height?: number, format?: 'image/png' | 'image/jpeg' | 'image/webp', quality?: number } = {}) => {
  const canvas = getCanvas(opts)
  if (!canvas) return null
  return canvasToDataURL(canvas, opts.format, opts.quality)
}

const getResult = () => ({
  coordinates: getCurrentCoordinates(),
  image: { ...imgNatural.value },
  canvas: getCanvas(),
})

// ─── Keyboard shortcuts ───────────────────────────────────────────────────────
const handleKeydown = (e: KeyboardEvent) => {
  if (!imageLoaded.value || props.mode === 'fixed') return

  const step = e.shiftKey ? 10 : 1
  let handled = false

  if (props.mode === 'move-box') {
    const iw = imgNatural.value.width
    const ih = imgNatural.value.height

    switch (e.key) {
      case 'ArrowLeft':
        crop.value.x = Math.max(0, crop.value.x - step)
        handled = true
        break
      case 'ArrowRight':
        crop.value.x = Math.min(iw - crop.value.width, crop.value.x + step)
        handled = true
        break
      case 'ArrowUp':
        crop.value.y = Math.max(0, crop.value.y - step)
        handled = true
        break
      case 'ArrowDown':
        crop.value.y = Math.min(ih - crop.value.height, crop.value.y + step)
        handled = true
        break
    }
  }
  else if (props.mode === 'move-image') {
    const iw = imgNatural.value.width
    const ih = imgNatural.value.height

    switch (e.key) {
      case 'ArrowLeft':
        imagePan.value.x = Math.max(0, imagePan.value.x - step)
        handled = true
        break
      case 'ArrowRight':
        imagePan.value.x = Math.min(iw - moveImageCropSize.value.width, imagePan.value.x + step)
        handled = true
        break
      case 'ArrowUp':
        imagePan.value.y = Math.max(0, imagePan.value.y - step)
        handled = true
        break
      case 'ArrowDown':
        imagePan.value.y = Math.min(ih - moveImageCropSize.value.height, imagePan.value.y + step)
        handled = true
        break
    }
  }

  if (handled) {
    e.preventDefault()
    notifyChange()
  }
}

// ─── Container resize ─────────────────────────────────────────────────────────
const updateSize = () => {
  if (containerRef.value) {
    containerSize.value = { width: containerRef.value.clientWidth, height: containerRef.value.clientHeight }
  }
}

useResizeObserver(containerRef, updateSize)
useEventListener(containerRef, 'keydown', handleKeydown)

onMounted(() => { updateSize() })

defineExpose({
  getCanvas,
  getBlob,
  getDataURL,
  getResult,
  // Zoom methods
  zoomIn: () => zoom?.zoomIn(),
  zoomOut: () => zoom?.zoomOut(),
  zoomTo: (level: number) => zoom?.zoomTo(level),
  fitToContainer: () => zoom?.fitToContainer(),
  fillContainer: () => zoom?.fillContainer(),
  actualSize: () => zoom?.actualSize(),
  resetZoom: () => zoom?.resetZoom(),
  getZoomLevel: () => zoom?.zoomLevel.value ?? 1,
  // Transform methods
  rotateRight,
  rotateLeft,
  rotateTo,
  flipHorizontal,
  flipVertical,
  resetTransforms,
  getTransformState,
})
</script>

<template>
  <div
    ref="containerRef"
    class="relative w-full h-full min-h-50 overflow-hidden bg-elevated select-none touch-action-none outline-none focus-visible:outline-2 focus-visible:outline-primary/50 focus-visible:-outline-offset-2"
    tabindex="0"
    @wheel="handleWheel"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove">
    <div v-if="!src" class="flex items-center justify-center h-full text-muted text-sm">
      No image provided
    </div>

    <div v-else-if="imageError" class="flex items-center justify-center h-full text-error text-sm">
      Failed to load image
    </div>

    <template v-else>
      <div v-if="!imageLoaded" class="absolute inset-0 flex items-center justify-center">
        <div class="w-10 h-10 border-[3px] border-inverted/10 border-t-inverted/60 rounded-full animate-spin" />
      </div>

      <!-- Zoom Controls -->
      <div
        v-if="imageLoaded && enableZoom && showZoomControls && zoom"
        class="absolute bottom-4 right-4 flex items-center gap-1 bg-inverted/75 backdrop-blur-md rounded-lg p-1.5 z-30 shadow-lg text-inverted">
        <UButton
          icon="i-lucide-plus"
          size="xs"
          color="neutral"
          variant="ghost"
          :disabled="!zoom.canZoomIn.value"
          title="Zoom In (Scroll Up)"
          @click="zoom.zoomIn()" />

        <div class="min-w-12 text-center text-inverted text-[11px] font-bold px-2 select-none" title="Current Zoom Level">
          {{ zoom.zoomPercentage.value }}%
        </div>

        <UButton
          icon="i-lucide-minus"
          size="xs"
          color="neutral"
          variant="ghost"
          :disabled="!zoom.canZoomOut.value"
          title="Zoom Out (Scroll Down)"
          @click="zoom.zoomOut()" />

        <UButton
          icon="i-lucide-maximize"
          size="xs"
          color="neutral"
          variant="ghost"
          title="Fit to Container"
          @click="zoom.fitToContainer()" />

        <UButton
          label="1:1"
          size="xs"
          color="neutral"
          variant="ghost"
          class="text-[10px] px-1"
          title="Actual Size (100%)"
          @click="zoom.actualSize()" />
      </div>

      <div class="absolute inset-0">
        <img
          ref="bgImageRef"
          :src="src"
          class="absolute block pointer-events-none max-w-none opacity-0 transition-opacity duration-200 blur-xs"
          :class="{ 'opacity-35': imageLoaded }"
          :style="imageStyle"
          draggable="false"
          @load="handleLoad"
          @error="handleError">
      </div>

      <div
        v-if="imageLoaded"
        class="absolute box-border border-2 border-inverted/85 shadow-[0_0_0_9999px_--theme(--color-inverted/0.45)] transition-shadow duration-150"
        :class="{
          'cursor-move': mode === 'move-box' && shape === 'rectangle',
          'cursor-grab active:cursor-grabbing': mode === 'move-image',
          'rounded-full': shape === 'circle',
          'shadow-[0_0_0_9999px_--theme(--color-inverted/0.6)]': isInteracting,
          'border-dashed border-[3px]': borderStyle === 'dashed',
        }"
        :style="[stencilStyle, shape === 'circle' && mode === 'move-box' ? { cursor: 'move' } : {}]"
        @mousedown="mode === 'move-box' && shape === 'rectangle' ? startInteraction($event, 'move-box')
          : mode === 'move-image' ? startInteraction($event, 'pan')
            : undefined"
        @touchstart="mode === 'move-box' && shape === 'rectangle' ? startInteraction($event, 'move-box')
          : mode === 'move-image' ? startInteraction($event, 'pan')
            : undefined">
        <div
          class="absolute inset-0 overflow-hidden"
          :class="{ 'rounded-full': shape === 'circle' }"
          @mousedown="shape === 'circle' && mode === 'move-box' ? startInteraction($event, 'move-box') : undefined"
          @touchstart="shape === 'circle' && mode === 'move-box' ? startInteraction($event, 'move-box') : undefined">
          <img :src="src" class="absolute block pointer-events-none max-w-none" :style="stencilImageStyle" draggable="false">
        </div>

        <div
          v-if="shape === 'circle' && mode === 'move-box'"
          class="absolute -inset-3 rounded-full border-16 border-transparent z-20 pointer-events-auto transition-colors duration-200 hover:border-primary/15"
          :style="{ cursor: circleCursor }"
          @mousedown.stop="startInteraction($event, 'resize-circle')"
          @touchstart.stop="startInteraction($event, 'resize-circle')"
          @mousemove="updateCircleCursor($event)" />

        <template v-else-if="mode === 'move-box'">
          <div
            v-for="h in ['tl', 'tr', 'bl', 'br', 't', 'b', 'l', 'r']"
            :key="h"
            class="absolute w-2.75 h-2.75 bg-inverted border-2 border-primary rounded-[2px] z-10 transition-all duration-150 hover:scale-[1.3] hover:bg-primary"
            :class="{
              '-top-1.5 -left-1.5 cursor-nw-resize': h === 'tl',
              '-top-1.5 -right-1.5 cursor-ne-resize': h === 'tr',
              '-bottom-1.5 -left-1.5 cursor-sw-resize': h === 'bl',
              '-bottom-1.5 -right-1.5 cursor-se-resize': h === 'br',
              '-top-1.5 left-1/2 -translate-x-1/2 cursor-n-resize hover:scale-x-[1.3] hover:scale-y-[1.3]': h === 't',
              '-bottom-1.5 left-1/2 -translate-x-1/2 cursor-s-resize hover:scale-x-[1.3] hover:scale-y-[1.3]': h === 'b',
              '-left-1.5 top-1/2 -translate-y-1/2 cursor-w-resize hover:scale-x-[1.3] hover:scale-y-[1.3]': h === 'l',
              '-right-1.5 top-1/2 -translate-y-1/2 cursor-e-resize hover:scale-x-[1.3] hover:scale-y-[1.3]': h === 'r',
            }"
            @mousedown.stop="startInteraction($event, 'resize', h)"
            @touchstart.stop="startInteraction($event, 'resize', h)" />
        </template>

        <div v-if="shape !== 'circle'" class="absolute inset-0 pointer-events-none">
          <div class="absolute top-0 bottom-0 w-px bg-inverted/20" style="left:33.33%" />
          <div class="absolute top-0 bottom-0 w-px bg-inverted/20" style="left:66.66%" />
          <div class="absolute left-0 right-0 h-px bg-inverted/20" style="top:33.33%" />
          <div class="absolute left-0 right-0 h-px bg-inverted/20" style="top:66.66%" />
        </div>
      </div>
    </template>
  </div>
</template>

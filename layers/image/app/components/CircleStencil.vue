<script setup lang="ts">
import { useResizeObserver, useEventListener } from '@vueuse/core'
import type { ImageEditorContext } from '../types/editor'

const props = withDefaults(defineProps<{
  /** Fixed mode: the mask stays center, the image pans behind it (fixedStencil) */
  fixed?: boolean
  /** Shape of the crop area: 'circle' or 'rect'. Default: 'circle' */
  shape?: 'circle' | 'rect'
  /** Aspect ratio for rect shape (e.g. 16/9). Default: 1 */
  aspectRatio?: number
  /** Percentage of the viewport the fixed mask area occupies. Default: 85 */
  cropPercent?: number
  /** Initial crop percentage for the movable stencil mode. Default: 80 */
  initialCropPercent?: number
  /** Show rule-of-thirds grid lines while dragging (movable mode only). Default: true */
  gridLines?: boolean
  /** Exact width in pixels for the exported crop. Default: undefined (uses scaled dimensions) */
  outputWidth?: number
  /** Exact height in pixels for the exported crop. Default: undefined (uses scaled dimensions) */
  outputHeight?: number
}>(), {
  fixed: false,
  shape: 'circle',
  aspectRatio: 1,
  cropPercent: 100,
  initialCropPercent: 80,
  gridLines: true,
})

const emit = defineEmits<{
  (e: 'change', coords: { x: number, y: number, radius: number }): void
}>()

const imgEditor = inject<ImageEditorContext>('imgEditor')

// ─── MODE DETECTION ────────────────────────────────────────────────────────────
// Fixed mode: always active when fixedStencil is on, OR when tool is 'fixed-crop'
// Movable mode: active only when tool is 'stencil-circle'
const isFixed = computed(() => props.fixed && !!imgEditor?.fixedStencil?.value)
const isMovable = computed(() => !props.fixed && imgEditor?.activeTool.value === 'stencil-circle')
const isActive = computed(() => isFixed.value || isMovable.value)

// ─── FIXED MODE STATE ──────────────────────────────────────────────────────────
const cropWidth = ref(0)
const cropHeight = ref(0)
const fixedPos = ref({ top: 0, left: 0 })

const updateFixedMetrics = () => {
  const el = imgEditor?.fixedOverlayRef?.value
  if (!el) return

  const w = el.offsetWidth
  const h = el.offsetHeight
  const pct = props.cropPercent / 100

  // If cropPercent is 100, we skip complex math to ensure absolute 1:1 fit
  if (props.cropPercent === 100) {
    cropWidth.value = w
    cropHeight.value = h
    fixedPos.value = { top: 0, left: 0 }
  }
  else {
    const availW = w * pct
    const availH = h * pct
    const parentRatio = availW / availH
    const targetRatio = props.shape === 'circle' ? 1 : props.aspectRatio

    if (targetRatio > parentRatio) {
      cropWidth.value = availW
      cropHeight.value = availW / targetRatio
    }
    else {
      cropHeight.value = availH
      cropWidth.value = availH * targetRatio
    }
    fixedPos.value = {
      top: Math.round((h - cropHeight.value) / 2),
      left: Math.round((w - cropWidth.value) / 2),
    }
  }

  // Update editor's pan bounds
  if (imgEditor?.panBounds) {
    imgEditor.panBounds.value = {
      top: fixedPos.value.top,
      left: fixedPos.value.left,
      width: cropWidth.value,
      height: cropHeight.value,
    }
  }
}

useEventListener(window, 'resize', updateFixedMetrics)

if (imgEditor?.fixedOverlayRef?.value) {
  useResizeObserver(imgEditor.fixedOverlayRef, () => {
    updateFixedMetrics()
  })
}

onMounted(() => {
  if (props.fixed)
    setTimeout(updateFixedMetrics, 100)
})

onUnmounted(() => {
  // Logic cleanup handled by VueUse
})

// ─── FIXED MODE APPLY ──────────────────────────────────────────────────────────
const applyFixed = async () => {
  const canvas = imgEditor?.getCanvas()
  const state = imgEditor?.getImageState()
  if (!canvas || !state || !imgEditor?.panX || !imgEditor?.panY) return

  const zoom = imgEditor.zoomLevel.value
  const panX = imgEditor.panX.value
  const panY = imgEditor.panY.value
  const overlayRect = imgEditor.fixedOverlayRef?.value?.getBoundingClientRect()
  if (!overlayRect) return

  const vpCenterX = overlayRect.width / 2
  const vpCenterY = overlayRect.height / 2
  const imgCenterX = (vpCenterX - panX) / zoom
  const imgCenterY = (vpCenterY - panY) / zoom
  const imgCropW = cropWidth.value / zoom
  const imgCropH = cropHeight.value / zoom

  const isStrictOutput = props.outputWidth && props.outputHeight
  const destW = isStrictOutput ? props.outputWidth! : imgCropW
  const destH = isStrictOutput ? props.outputHeight! : imgCropH

  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = destW
  tempCanvas.height = destH
  const tempCtx = tempCanvas.getContext('2d')

  if (tempCtx) {
    tempCtx.beginPath()
    if (props.shape === 'circle') {
      const scaleX = isStrictOutput ? (props.outputWidth! / imgCropW) : 1
      const scaleY = isStrictOutput ? (props.outputHeight! / imgCropH) : 1
      const rX = (imgCropW / 2) * scaleX
      const rY = (imgCropH / 2) * scaleY
      tempCtx.ellipse(destW / 2, destH / 2, rX, rY, 0, 0, Math.PI * 2)
    }
    else {
      tempCtx.rect(0, 0, destW, destH)
    }
    tempCtx.clip()
    tempCtx.drawImage(canvas, imgCenterX - imgCropW / 2, imgCenterY - imgCropH / 2, imgCropW, imgCropH, 0, 0, destW, destH)
    imgEditor?.commit(tempCanvas, 'fixed-crop')
    imgEditor.panX.value = overlayRect.width / 2 - imgCropW / 2
    imgEditor.panY.value = overlayRect.height / 2 - imgCropH / 2
  }
}

// ─── MOVABLE MODE STATE ────────────────────────────────────────────────────────
const stencil = ref({ x: 0, y: 0, radius: 0 })

const initializeStencil = () => {
  const state = imgEditor?.getImageState()
  if (!state?.width || !state?.height) return
  const diameter = Math.min(state.width, state.height) * (props.initialCropPercent / 100)
  const radius = diameter / 2
  stencil.value = { x: state.width / 2, y: state.height / 2, radius }
  emit('change', stencil.value)
}

const dragMode = ref<'move' | 'resize' | null>(null)

const { isInteracting, startInteraction, startData: startStencil } = useInteraction(
  computed(() => imgEditor?.zoomLevel.value || 1),
  (dx, dy, p) => {
    const start = startStencil.value as { x: number, y: number, radius: number }
    if (!start || !imgEditor) return
    const state = imgEditor.getImageState()

    if (dragMode.value === 'move') {
      stencil.value.x = Math.max(start.radius, Math.min(start.x + dx, state.width - start.radius))
      stencil.value.y = Math.max(start.radius, Math.min(start.y + dy, state.height - start.radius))
    }
    else if (dragMode.value === 'resize') {
      const rect = imgEditor.overlayRef.value?.getBoundingClientRect()
      if (!rect) return
      const scale = imgEditor.zoomLevel.value
      const absX = p.clientX - rect.left
      const absY = p.clientY - rect.top
      const centerX = start.x * scale
      const centerY = start.y * scale
      const distPx = Math.hypot(absX - centerX, absY - centerY) / scale
      const maxRadius = Math.min(start.x, state.width - start.x, start.y, state.height - start.y)
      stencil.value.radius = Math.max(25, Math.min(distPx, maxRadius))
    }
    emit('change', stencil.value)
  }
)

const startInteractionHandler = (e: MouseEvent | TouchEvent, kind: 'move' | 'resize') => {
  dragMode.value = kind
  startInteraction(e, kind, stencil.value)
}

// ─── MOVABLE MODE APPLY ────────────────────────────────────────────────────────
const applyStencil = () => {
  const canvas = imgEditor?.getCanvas()
  if (!canvas) return

  const { x, y, radius } = stencil.value
  const srcW = radius * 2
  const srcH = radius * 2

  const isStrictOutput = props.outputWidth && props.outputHeight
  const destW = isStrictOutput ? props.outputWidth! : srcW
  const destH = isStrictOutput ? props.outputHeight! : srcH

  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = destW
  tempCanvas.height = destH
  const tempCtx = tempCanvas.getContext('2d')

  if (tempCtx) {
    tempCtx.beginPath()
    if (props.shape === 'circle') {
      const scaleX = isStrictOutput ? (props.outputWidth! / srcW) : 1
      const scaleY = isStrictOutput ? (props.outputHeight! / srcH) : 1
      const rX = radius * scaleX
      const rY = radius * scaleY
      tempCtx.ellipse(destW / 2, destH / 2, rX, rY, 0, 0, Math.PI * 2)
    }
    else {
      tempCtx.rect(0, 0, destW, destH)
    }
    tempCtx.clip()
    tempCtx.drawImage(canvas, x - radius, y - radius, srcW, srcH, 0, 0, destW, destH)

    imgEditor?.commit(tempCanvas, 'stencil-circle')
  }
}

// ─── LIFECYCLE ─────────────────────────────────────────────────────────────────
const applyFn = computed(() => props.fixed ? applyFixed : applyStencil)

watch(isActive, val => {
  if (val) {
    if (!props.fixed) initializeStencil()
    else updateFixedMetrics()
    imgEditor?.registerApplyHook(applyFn.value)
  }
  else {
    imgEditor?.unregisterApplyHook(applyFn.value)
  }
}, { immediate: true })

onUnmounted(() => {
  imgEditor?.unregisterApplyHook(applyFn.value)
  if (imgEditor?.panBounds) {
    imgEditor.panBounds.value = null
  }
})

defineExpose({
  stencil, initializeStencil, applyStencil,
  applyFixed
})
</script>

<template>
  <!-- ── FIXED MODE ──────────────────────────────────────────────── -->
  <Teleport v-if="isFixed && imgEditor?.fixedOverlayRef?.value" :to="imgEditor.fixedOverlayRef.value">
    <div class="absolute inset-0 pointer-events-none">
      <div
        class="absolute pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.85)] z-40"
        :class="{
          'rounded-full': shape === 'circle',
          'rounded-lg': shape === 'rect',
        }"
        :style="{
          // left: props.cropPercent === 100 ? '0' : fixedPos.left + 'px',
          // top: props.cropPercent === 100 ? '0' : fixedPos.top + 'px',
          // width: props.cropPercent === 100 ? '100%' : cropWidth + 'px',
          // height: props.cropPercent === 100 ? '100%' : cropHeight + 'px',
          left: fixedPos.left + 'px',
          top: fixedPos.top + 'px',
          width: cropWidth + 'px',
          height: cropHeight + 'px',
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.85)',
          backfaceVisibility: 'hidden',
          transform: 'translateZ(0)',
        }">
        <!-- Subtle crosshair helps to center faces / subjects -->
        <div class="absolute inset-x-0 top-1/2 h-px bg-white/10 -translate-y-1/2" />
        <div class="absolute inset-y-0 left-1/2 w-px bg-white/10 -translate-x-1/2" />
      </div>
    </div>
  </Teleport>

  <!-- ── MOVABLE MODE ───────────────────────────────────────────── -->
  <Teleport v-else-if="isMovable && imgEditor?.overlayRef.value" :to="imgEditor.overlayRef.value">
    <div
      class="absolute inset-0 pointer-events-none group"
      :class="{ 'is-interacting': isInteracting }">
      <!-- Dimmed background with circular cutout -->
      <div
        class="absolute inset-0 bg-inverted/60 backdrop-blur-[1px]"
        :style="{
          maskImage: `radial-gradient(circle at ${stencil.x}px ${stencil.y}px, transparent ${stencil.radius}px, black ${stencil.radius}px)`,
          WebkitMaskImage: `radial-gradient(circle at ${stencil.x}px ${stencil.y}px, transparent ${stencil.radius}px, black ${stencil.radius}px)`,
        }" />

      <!-- Selection Circle -->
      <div
        class="absolute pointer-events-auto cursor-move rounded-full z-40"
        :style="{
          left: (stencil.x - stencil.radius) + 'px',
          top: (stencil.y - stencil.radius) + 'px',
          width: (stencil.radius * 2) + 'px',
          height: (stencil.radius * 2) + 'px',
        }"
        @mousedown="startInteractionHandler($event, 'move')"
        @touchstart="startInteractionHandler($event, 'move')">
        <!-- Animated Grid Lines (inscribed square) -->
        <transition
          enter-active-class="transition-opacity duration-200"
          enter-from-class="opacity-0"
          leave-active-class="transition-opacity duration-200"
          leave-to-class="opacity-0">
          <div v-if="gridLines && isInteracting" class="absolute inset-[15%] overflow-hidden rounded-sm">
            <div class="absolute left-0 w-full h-px bg-inverted/30 top-1/3" />
            <div class="absolute left-0 w-full h-px bg-inverted/30 top-2/3" />
            <div class="absolute top-0 h-full w-px bg-inverted/30 left-1/3" />
            <div class="absolute top-0 h-full w-px bg-inverted/30 left-2/3" />
          </div>
        </transition>

        <!-- Stencil Border -->
        <div class="absolute inset-0 border-[1.5px] border-inverted rounded-full shadow-[0_0_20px_--theme(--color-primary-500/0.4)] transition-all duration-200 group-[.is-interacting]:border-primary group-[.is-interacting]:shadow-[0_0_30px_--theme(--color-primary-500/0.6)] shadow-inverted/30" />

        <!-- Resize Handle -->
        <ImgHandler
          position="br"
          :active="isInteracting"
          @mousedown.stop="startInteractionHandler($event, 'resize')"
          @touchstart.stop="startInteractionHandler($event, 'resize')" />
      </div>
    </div>
  </Teleport>
</template>

<script lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, inject } from 'vue'
import { useResizeObserver, useEventListener } from '@vueuse/core'
import type { AppConfig } from '@nuxt/schema'
import theme from '../utils/themes/circle-stencil'
import type { ComponentConfig } from '../types/tv'
import type { ImageEditorContext } from '../types/editor'
import { useInteraction } from '../composables/useInteraction'
import { tv } from '../utils/tv'
import { useAppConfig } from '#imports'

export type StudioCircleStencil = ComponentConfig<typeof theme, AppConfig, 'circleStencil'>

export interface StudioCircleStencilProps {
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
  ui?: StudioCircleStencil['slots']
}
</script>

<script setup lang="ts">
const appConfig = useAppConfig() as StudioCircleStencil['AppConfig']

const props = withDefaults(defineProps<StudioCircleStencilProps>(), {
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

const imgStudio = inject<ImageEditorContext>('imgStudio')

const resUI = computed(() => tv({ extend: tv(theme), ...(appConfig.ui?.circleStencil || {}) })({
  shape: props.shape,
  interacting: isInteracting.value,
}))

// ─── MODE DETECTION ────────────────────────────────────────────────────────────
const isFixed = computed(() => props.fixed && !!imgStudio?.fixedStencil?.value)
const isMovable = computed(() => !props.fixed && imgStudio?.activeTool.value === 'stencil-circle')
const isActive = computed(() => isFixed.value || isMovable.value)

// ─── FIXED MODE STATE ──────────────────────────────────────────────────────────
const cropWidth = ref(0)
const cropHeight = ref(0)
const fixedPos = ref({ top: 0, left: 0 })

const updateFixedMetrics = () => {
  const el = imgStudio?.fixedOverlayRef?.value
  if (!el) return

  const w = el.offsetWidth
  const h = el.offsetHeight
  const pct = props.cropPercent / 100

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

  if (imgStudio?.panBounds) {
    imgStudio.panBounds.value = {
      top: fixedPos.value.top,
      left: fixedPos.value.left,
      width: cropWidth.value,
      height: cropHeight.value,
    }
  }
}

useEventListener(window, 'resize', updateFixedMetrics)

if (imgStudio?.fixedOverlayRef?.value) {
  useResizeObserver(imgStudio.fixedOverlayRef, () => {
    updateFixedMetrics()
  })
}

onMounted(() => {
  if (props.fixed)
    setTimeout(updateFixedMetrics, 100)
})

const applyFixed = async () => {
  const canvas = imgStudio?.getCanvas()
  const state = imgStudio?.getImageState()
  if (!canvas || !state || !imgStudio?.panX || !imgStudio?.panY) return

  const zoom = imgStudio.zoomLevel.value
  const panX = imgStudio.panX.value
  const panY = imgStudio.panY.value
  const overlayRect = imgStudio.fixedOverlayRef?.value?.getBoundingClientRect()
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
    imgStudio?.commit(tempCanvas, 'fixed-crop')
    imgStudio.panX.value = overlayRect.width / 2 - imgCropW / 2
    imgStudio.panY.value = overlayRect.height / 2 - imgCropH / 2
  }
}

// ─── MOVABLE MODE STATE ────────────────────────────────────────────────────────
const stencil = ref({ x: 0, y: 0, radius: 0 })

const initializeStencil = () => {
  const state = imgStudio?.getImageState()
  if (!state?.width || !state?.height) return
  const diameter = Math.min(state.width, state.height) * (props.initialCropPercent / 100)
  const radius = diameter / 2
  stencil.value = { x: state.width / 2, y: state.height / 2, radius }
  emit('change', stencil.value)
}

const dragMode = ref<'move' | 'resize' | null>(null)

const { isInteracting, startInteraction, startData: startStencil } = useInteraction(
  computed(() => imgStudio?.zoomLevel.value || 1),
  (dx, dy, p) => {
    const start = startStencil.value as { x: number, y: number, radius: number }
    if (!start || !imgStudio) return
    const state = imgStudio.getImageState()

    if (dragMode.value === 'move') {
      stencil.value.x = Math.max(start.radius, Math.min(start.x + dx, state.width - start.radius))
      stencil.value.y = Math.max(start.radius, Math.min(start.y + dy, state.height - start.radius))
    }
    else if (dragMode.value === 'resize') {
      const rect = imgStudio.overlayRef.value?.getBoundingClientRect()
      if (!rect) return
      const scale = imgStudio.zoomLevel.value
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

const applyStencil = () => {
  const canvas = imgStudio?.getCanvas()
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

    imgStudio?.commit(tempCanvas, 'stencil-circle')
  }
}

// ─── LIFECYCLE ─────────────────────────────────────────────────────────────────
const applyFn = computed(() => props.fixed ? applyFixed : applyStencil)

watch(isActive, val => {
  if (val) {
    if (!props.fixed) initializeStencil()
    else updateFixedMetrics()
    imgStudio?.registerApplyHook(applyFn.value)
  }
  else {
    imgStudio?.unregisterApplyHook(applyFn.value)
  }
}, { immediate: true })

onUnmounted(() => {
  imgStudio?.unregisterApplyHook(applyFn.value)
  if (imgStudio?.panBounds) {
    imgStudio.panBounds.value = null
  }
})

defineExpose({
  stencil, initializeStencil, applyStencil,
  applyFixed
})
</script>

<template>
  <!-- ── FIXED MODE ──────────────────────────────────────────────── -->
  <Teleport v-if="isFixed && imgStudio?.fixedOverlayRef?.value" :to="imgStudio.fixedOverlayRef.value">
    <div :class="resUI.fixedWrapper()">
      <div
        :class="resUI.fixedMask()"
        :style="{
          left: fixedPos.left + 'px',
          top: fixedPos.top + 'px',
          width: cropWidth + 'px',
          height: cropHeight + 'px',
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.85)',
          backfaceVisibility: 'hidden',
          transform: 'translateZ(0)',
        }">
        <div :class="resUI.fixedCrosshairX()" />
        <div :class="resUI.fixedCrosshairY()" />
      </div>
    </div>
  </Teleport>

  <!-- ── MOVABLE MODE ───────────────────────────────────────────── -->
  <Teleport v-else-if="isMovable && imgStudio?.overlayRef.value" :to="imgStudio.overlayRef.value">
    <div
      :class="resUI.movableWrapper()">
      <div
        :class="resUI.movableMask()"
        :style="{
          maskImage: `radial-gradient(circle at ${stencil.x}px ${stencil.y}px, transparent ${stencil.radius}px, black ${stencil.radius}px)`,
          WebkitMaskImage: `radial-gradient(circle at ${stencil.x}px ${stencil.y}px, transparent ${stencil.radius}px, black ${stencil.radius}px)`,
        }" />

      <div
        :class="resUI.movableStencil()"
        :style="{
          left: (stencil.x - stencil.radius) + 'px',
          top: (stencil.y - stencil.radius) + 'px',
          width: (stencil.radius * 2) + 'px',
          height: (stencil.radius * 2) + 'px',
        }"
        @mousedown="startInteractionHandler($event, 'move')"
        @touchstart="startInteractionHandler($event, 'move')">
        <transition
          enter-active-class="transition-opacity duration-200"
          enter-from-class="opacity-0"
          leave-active-class="transition-opacity duration-200"
          leave-to-class="opacity-0">
          <div v-if="gridLines && isInteracting" :class="resUI.gridWrapper()">
            <div :class="resUI.gridLineX() + ' top-1/3'" />
            <div :class="resUI.gridLineX() + ' top-2/3'" />
            <div :class="resUI.gridLineY() + ' left-1/3'" />
            <div :class="resUI.gridLineY() + ' left-2/3'" />
          </div>
        </transition>

        <div :class="resUI.border()" />

        <ImgHandler
          position="bottom-right"
          :active="isInteracting"
          @mousedown.stop="startInteractionHandler($event, 'resize')"
          @touchstart.stop="startInteractionHandler($event, 'resize')" />
      </div>
    </div>
  </Teleport>
</template>

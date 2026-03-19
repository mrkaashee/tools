<script lang="ts">
import { computed, watch, ref } from 'vue'
import { useResizeObserver } from '@vueuse/core'
import type { AppConfig } from '@nuxt/schema'
import theme from '../utils/themes/cropper'
import type { ComponentConfig } from '../types/tv'
import type { CropperProps, CropperEmits, UseCropperOptions } from '../types/cropper'
import { useCropper } from '../composables/useCropper'
import { useCropperZoom } from '../composables/useCropperZoom'
import { useCropperStyles } from '../composables/useCropperStyles'
import { useCropperInteraction } from '../composables/useCropperInteraction'
import { tv } from '../utils/tv'
import type { StudioAppConfig } from '../types/studio'

export type StudioCropper = ComponentConfig<typeof theme, AppConfig, 'cropper'>

export interface StudioCropperProps extends CropperProps {
  ui?: StudioCropper['slots']
}

export type { CropperEmits }
</script>

<script lang="ts" setup>
const appConfig = useAppConfig() as StudioAppConfig

const props = withDefaults(defineProps<StudioCropperProps>(), {
  src: null,
  mode: 'move-box',
  shape: 'rectangle',
  aspectRatio: 0,
  initialCropPercent: 80,
  grid: true,
  borderStyle: 'solid',
  enableZoom: false,
  minZoom: 1,
  maxZoom: 5,
  zoomStep: 0.1,
  zoomSpeed: 0.1,
  showZoomControls: false,
})

const emit = defineEmits<CropperEmits>()

const resUI = computed(() => tv({ extend: tv(theme), ...(appConfig.ui?.cropper || {}) })({
  loaded: imageLoaded.value,
  moving: props.mode === 'move-box' && props.shape === 'rectangle',
  panning: props.mode === 'move-image',
  circle: props.shape === 'circle',
  interacting: isInteracting.value,
  dashed: props.borderStyle === 'dashed',
  ...props.ui
}))

const cropperOptions = computed<UseCropperOptions>(() => ({
  mode: props.mode,
  shape: props.shape,
  aspectRatio: props.aspectRatio,
  minWidth: props.size?.width ?? 50,
  minHeight: props.size?.height ?? 50,
  maxWidth: Infinity,
  maxHeight: Infinity,
  initialCropPercent: props.initialCropPercent,
  enableZoom: props.enableZoom,
  minZoom: props.minZoom,
  maxZoom: props.maxZoom,
  zoomStep: props.zoomStep,
  zoomSpeed: props.zoomSpeed,
}))

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
  cropperOptions,
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
  300, // transformDuration
  isInteracting
)

const notifyChange = () => {
  emit('change', getCurrentCoordinates())
}

// Watch for aspect ratio changes from parent
watch(() => props.aspectRatio, () => {
  if (imageLoaded.value) {
    isInteracting.value = true
    initializeCrop()
    notifyChange()
    setTimeout(() => {
      isInteracting.value = false
    }, 50)
  }
})

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
    minWidth: props.size?.width ?? 50,
    minHeight: props.size?.height ?? 50,
    maxWidth: Infinity,
    maxHeight: Infinity,
    effectiveAspectRatio: effectiveAspectRatio.value,
  },
  notifyChange
)

const handleWheel = (e: WheelEvent) => {
  if (!props.enableZoom || !zoom) return
  zoom.handleWheel(e)
}

const handleLoad = () => {
  if (bgImageRef.value) {
    imgNatural.value = {
      width: bgImageRef.value.naturalWidth,
      height: bgImageRef.value.naturalHeight,
    }
  }
  imageLoaded.value = true
  imageError.value = false
  initializeCrop()
  notifyChange()
}

const handleError = () => {
  imageLoaded.value = false
  imageError.value = true
}

useResizeObserver(containerRef, entries => {
  const entry = entries[0]
  if (!entry) return

  const { width, height } = entry.contentRect
  containerSize.value.width = width
  containerSize.value.height = height
  if (imageLoaded.value) {
    initializeCrop()
  }
})

// Public API
defineExpose({
  rotateRight,
  rotateLeft,
  rotateTo,
  flipHorizontal,
  flipVertical,
  resetTransforms,
  getTransformState,
  getResult: getCurrentCoordinates,
  refresh: () => {
    initializeCrop()
    notifyChange()
  }
})
</script>

<template>
  <div
    ref="containerRef"
    :class="resUI.root()"
    @wheel.prevent="handleWheel">
    <div v-if="!src" :class="resUI.empty()">
      No image source provided.
    </div>
    <div v-else-if="imageError" :class="resUI.error()">
      Failed to load image.
    </div>

    <template v-else>
      <div v-if="!imageLoaded" :class="resUI.loader()">
        <slot name="loader">
          <div :class="resUI.spinner()" />
        </slot>
      </div>

      <div v-if="imageLoaded && showZoomControls && zoom" :class="resUI.zoomContainer()">
        <UButton
          icon="i-lucide-minus"
          size="xs"
          color="neutral"
          variant="ghost"
          @click="zoom.zoomOut()" />
        <span :class="resUI.zoomPercentage()">{{ Math.round(zoomLevel * 100) }}%</span>
        <UButton
          icon="i-lucide-plus"
          size="xs"
          color="neutral"
          variant="ghost"
          @click="zoom.zoomIn()" />
        <div class="w-px h-3 bg-inverted/20 mx-1" />
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

      <div :class="resUI.viewport()">
        <img
          ref="bgImageRef"
          :src="src"
          :class="resUI.bgImage()"
          :style="imageStyle"
          draggable="false"
          @load="handleLoad"
          @error="handleError">
      </div>

      <div
        v-if="imageLoaded"
        :class="resUI.stencil()"
        :style="[stencilStyle, shape === 'circle' && mode === 'move-box' ? { cursor: 'move' } : {}]"
        @mousedown="mode === 'move-box' && shape === 'rectangle' ? startInteraction($event, 'move-box')
          : mode === 'move-image' ? startInteraction($event, 'pan')
            : undefined"
        @touchstart="mode === 'move-box' && shape === 'rectangle' ? startInteraction($event, 'move-box')
          : mode === 'move-image' ? startInteraction($event, 'pan')
            : undefined">
        <div
          :class="resUI.stencilWrapper()"
          @mousedown="shape === 'circle' && mode === 'move-box' ? startInteraction($event, 'move-box') : undefined"
          @touchstart="shape === 'circle' && mode === 'move-box' ? startInteraction($event, 'move-box') : undefined">
          <img :src="src" :class="resUI.stencilImage()" :style="stencilImageStyle" draggable="false">
        </div>

        <div
          v-if="shape === 'circle' && mode === 'move-box'"
          :class="resUI.circleHandle()"
          :style="{ cursor: circleCursor }"
          @mousedown.stop="startInteraction($event, 'resize-circle')"
          @touchstart.stop="startInteraction($event, 'resize-circle')"
          @mousemove="updateCircleCursor($event)" />

        <template v-else-if="mode === 'move-box'">
          <div
            v-for="h in ['tl', 'tr', 'bl', 'br', 't', 'b', 'l', 'r']"
            :key="h"
            :class="resUI.handle({ position: h as any })"
            @mousedown.stop="startInteraction($event, 'resize', h)"
            @touchstart.stop="startInteraction($event, 'resize', h)" />
        </template>

        <div v-if="shape !== 'circle'" :class="resUI.grid()">
          <div :class="resUI.gridLine()" style="left:33.33%; top:0; bottom:0; width:1px;" />
          <div :class="resUI.gridLine()" style="left:66.66%; top:0; bottom:0; width:1px;" />
          <div :class="resUI.gridLine()" style="top:33.33%; left:0; right:0; height:1px;" />
          <div :class="resUI.gridLine()" style="top:66.66%; left:0; right:0; height:1px;" />
        </div>
      </div>
    </template>
  </div>
</template>

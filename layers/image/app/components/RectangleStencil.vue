<script setup lang="ts">
import { inject, ref, computed, watch, onUnmounted } from 'vue'
import type { ImageEditorContext } from '../types/editor'
import type { CropArea as Rect } from '../types/cropper'
import ImgHandler from './ImgHandler.vue'
import { useInteraction } from '../composables/useInteraction'
import { calculateMove, calculateResize } from '../utils/interaction'

const props = withDefaults(defineProps<{
  aspectRatio?: number
  minWidth?: number
  minHeight?: number
  initialCropPercent?: number
  gridLines?: boolean
  outputWidth?: number
  outputHeight?: number
}>(), {
  initialCropPercent: 80,
  minWidth: 50,
  minHeight: 50,
  gridLines: true,
})

const emit = defineEmits<{
  (e: 'change', coords: { x: number, y: number, width: number, height: number }): void
}>()

const imgStudio = inject<ImageEditorContext>('imgStudio')

const isActive = computed(() => imgStudio?.activeTool.value === 'crop' || imgStudio?.activeTool.value === 'stencil-rect')

// Stencil selection state (in image pixels)
const stencil = ref({ x: 0, y: 0, width: 0, height: 0 })

const initializeStencil = () => {
  const state = imgStudio?.getImageState()
  if (!state?.width || !state?.height) return

  const iw = state.width
  const ih = state.height
  const ar = imgStudio?.aspectRatio.value || props.aspectRatio || 0

  let w = Math.min(iw, ih) * (props.initialCropPercent / 100)
  let h = ar ? w / ar : w

  if (h > ih) { h = ih; w = ar ? h * ar : h }
  if (w > iw) { w = iw; h = ar ? w / ar : h }

  stencil.value = {
    x: (iw - w) / 2,
    y: (ih - h) / 2,
    width: w,
    height: h
  }
  emit('change', stencil.value)
}

// Interaction logic using reusable composable
const dragMode = ref<'move' | 'resize' | null>(null)
const dragHandle = ref<string | null>(null)

const {
  isInteracting,
  startInteraction,
  startData: startStencil
} = useInteraction(
  computed(() => imgStudio?.zoomLevel.value || 1),
  (dx, dy) => {
    const start = startStencil.value as Rect
    if (!start || !imgStudio) return
    const state = imgStudio.getImageState()
    const bounds = { width: state.width, height: state.height }

    if (dragMode.value === 'move') {
      stencil.value = calculateMove(start, dx, dy, bounds)
    }
    else if (dragMode.value === 'resize') {
      stencil.value = calculateResize(start, dx, dy, dragHandle.value!, {
        aspectRatio: imgStudio.aspectRatio.value || props.aspectRatio,
        minWidth: props.minWidth,
        minHeight: props.minHeight,
        bounds
      })
    }
    emit('change', stencil.value)
  }
)

const startInteractionHandler = (e: MouseEvent | TouchEvent, kind: 'move' | 'resize', handle?: string) => {
  dragMode.value = kind
  dragHandle.value = handle || null
  startInteraction(e, kind, stencil.value, handle)
}

const applyStencil = () => {
  const canvas = imgStudio?.getCanvas()
  if (!canvas || !imgStudio) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const isStrictOutput = props.outputWidth && props.outputHeight
  const destW = isStrictOutput ? props.outputWidth! : stencil.value.width
  const destH = isStrictOutput ? props.outputHeight! : stencil.value.height

  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = destW
  tempCanvas.height = destH
  const tempCtx = tempCanvas.getContext('2d')
  if (!tempCtx) return

  tempCtx.drawImage(
    canvas,
    stencil.value.x, stencil.value.y, stencil.value.width, stencil.value.height,
    0, 0, destW, destH
  )

  imgStudio.commit(tempCanvas, 'stencil-rectangle')
}

watch(isActive, val => {
  if (val) {
    initializeStencil()
    imgStudio?.registerApplyHook(applyStencil)
  }
  else {
    imgStudio?.unregisterApplyHook(applyStencil)
  }
}, { immediate: true })

watch(() => imgStudio?.aspectRatio.value, () => {
  if (isActive.value) initializeStencil()
})

onUnmounted(() => {
  imgStudio?.unregisterApplyHook(applyStencil)
})

defineExpose({
  stencil,
  initializeStencil,
  applyStencil,
})
</script>

<template>
  <Teleport v-if="isActive && imgStudio?.overlayRef.value" :to="imgStudio.overlayRef.value">
    <div
      class="absolute inset-0 pointer-events-none group"
      :class="{ 'is-interacting': isInteracting }">
      <!-- Dimmed background outside stencil area -->
      <div
        class="absolute inset-0 bg-inverted/60 backdrop-blur-[1px] transition-colors duration-300 group-[.is-interacting]:bg-inverted/40"
        :style="{
          clipPath: `polygon(
            0% 0%, 0% 100%,
            ${stencil.x}px 100%, ${stencil.x}px ${stencil.y}px,
            ${stencil.x + stencil.width}px ${stencil.y}px,
            ${stencil.x + stencil.width}px ${stencil.y + stencil.height}px,
            ${stencil.x}px ${stencil.y + stencil.height}px, ${stencil.x}px 100%,
            100% 100%, 100% 0%
          )`,
        }" />

      <!-- Selection box -->
      <div
        class="absolute pointer-events-auto cursor-move z-40"
        :style="{
          left: stencil.x + 'px',
          top: stencil.y + 'px',
          width: stencil.width + 'px',
          height: stencil.height + 'px',
        }"
        @mousedown="startInteractionHandler($event, 'move')"
        @touchstart="startInteractionHandler($event, 'move')">
        <!-- Animated Grid Lines -->
        <transition
          enter-active-class="transition-opacity duration-200"
          enter-from-class="opacity-0"
          leave-active-class="transition-opacity duration-200"
          leave-to-class="opacity-0">
          <div v-if="gridLines && isInteracting" class="absolute inset-0 overflow-hidden">
            <div class="absolute left-0 w-full h-px bg-inverted/30 top-1/3" />
            <div class="absolute left-0 w-full h-px bg-inverted/30 top-2/3" />
            <div class="absolute top-0 h-full w-px bg-inverted/30 left-1/3" />
            <div class="absolute top-0 h-full w-px bg-inverted/30 left-2/3" />
          </div>
        </transition>

        <!-- Stencil Border (futuristic glow) -->
        <div class="absolute inset-0 border border-inverted shadow-[0_0_15px_--theme(--color-primary-500/0.3),inset_0_0_10px_--theme(--color-primary-500/0.2)] transition-all duration-200 group-[.is-interacting]:border-primary group-[.is-interacting]:border-[1.5px]" />

        <!-- High-end Handlers -->
        <ImgHandler position="top-left" @mousedown.stop="startInteractionHandler($event, 'resize', 'top-left')" />
        <ImgHandler position="top-right" @mousedown.stop="startInteractionHandler($event, 'resize', 'top-right')" />
        <ImgHandler position="bottom-left" @mousedown.stop="startInteractionHandler($event, 'resize', 'bottom-left')" />
        <ImgHandler position="bottom-right" @mousedown.stop="startInteractionHandler($event, 'resize', 'bottom-right')" />

        <!-- Edge Handlers for non-fixed AR -->
        <template v-if="!imgStudio?.aspectRatio.value">
          <ImgHandler position="top" @mousedown.stop="startInteractionHandler($event, 'resize', 'top')" />
          <ImgHandler position="bottom" @mousedown.stop="startInteractionHandler($event, 'resize', 'bottom')" />
          <ImgHandler position="left" @mousedown.stop="startInteractionHandler($event, 'resize', 'left')" />
          <ImgHandler position="right" @mousedown.stop="startInteractionHandler($event, 'resize', 'right')" />
        </template>
      </div>
    </div>
  </Teleport>
</template>

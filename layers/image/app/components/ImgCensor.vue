<script setup lang="ts">
import { computed, inject, watch, onUnmounted } from 'vue'
import type { ImageEditorContext } from '../types/editor'
import ImgHandler from './ImgHandler.vue'

const props = defineProps<{
  /** Hide internal UI controls — useful when controls are in a separate sidebar. */
  headless?: boolean
  /** Shared state from parent (optional, fallbacks to internal if not provided) */
  censorState?: any
}>()

const imgEditor = inject<ImageEditorContext>('imgEditor')

// If no state provided, use local (backwards compatibility)
const internalState = props.censorState ? null : useCensor(computed(() => imgEditor?.zoomLevel.value || 1))

// Resolve state source correctly
const state = computed(() => props.censorState || internalState)

// Destructure for template convenience
const mode = computed(() => state.value.mode.value)
const intensity = computed(() => state.value.intensity.value)
const useArea = computed(() => state.value.useArea.value)
const selection = computed(() => state.value.selection.value)
const isInteracting = computed(() => state.value.isInteracting.value)

const isActive = computed(() => imgEditor?.activeTool.value === 'censor')

const applyCensor = () => {
  if (!imgEditor) return
  const canvas = imgEditor.getCanvas()
  if (!canvas) return

  const tempCanvas = state.value.getCensoredCanvas(canvas)
  if (tempCanvas) {
    imgEditor.commit(tempCanvas, 'censor')
    imgEditor.deactivateTool()
  }
}

onMounted(() => {
  console.log('ImgCensor: COMPONENT MOUNTED', {
    isActive: isActive.value,
    headless: props.headless,
    editor: !!imgEditor,
    overlay: !!imgEditor?.overlayRef.value
  })
})

watch(isActive, val => {
  console.log('ImgCensor: isActive changed to', val)
  if (val) {
    imgEditor?.registerApplyHook(applyCensor)
    // Initialization check
    const editorState = imgEditor?.getImageState()
    if (editorState?.width && editorState?.height) {
      if (!selection.value.width) {
        state.value.initializeSelection(editorState.width, editorState.height)
      }
    }
  }
  else {
    imgEditor?.unregisterApplyHook(applyCensor)
  }
}, { immediate: true })

onUnmounted(() => {
  imgEditor?.unregisterApplyHook(applyCensor)
})

// Interaction Handler
const handleMouseDown = (e: MouseEvent | TouchEvent) => {
  if (!isActive.value || !useArea.value || !imgEditor) return

  const target = e.target as HTMLElement
  if (target.closest('.u-img-censor-box')) {
    return
  }

  const container = e.currentTarget as HTMLElement
  const rect = container.getBoundingClientRect()

  const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX
  const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY

  const x = (clientX - rect.left) / imgEditor.zoomLevel.value
  const y = (clientY - rect.top) / imgEditor.zoomLevel.value

  console.log('ImgCensor: Starting selection via handleMouseDown', x, y)
  state.value.startNewSelection(e, x, y)
}

const counterScale = computed(() => 1 / (imgEditor?.zoomLevel.value || 1))

defineExpose({
  mode: state.value.mode,
  intensity: state.value.intensity,
  useArea: state.value.useArea,
  isActive,
  applyCensor
})
</script>

<template>
  <div class="u-img-censor">
    <!-- Sidebar Controls (only if not headless) -->
    <div v-if="!props.headless" class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-[10px] font-bold uppercase tracking-widest text-muted">
          Censor Tool
        </h3>
        <UBadge v-if="isActive" color="primary" size="xs">
          Active
        </UBadge>
      </div>

      <div v-if="!isActive">
        <UButton
          label="Activate Censor"
          icon="i-lucide-shield-alert"
          color="neutral"
          variant="soft"
          block
          @click="imgEditor?.activateTool('censor')" />
      </div>

      <div v-else class="space-y-4 pt-2">
        <div class="grid grid-cols-2 gap-2">
          <UButton
            label="Blur"
            :color="mode === 'blur' ? 'primary' : 'neutral'"
            :variant="mode === 'blur' ? 'solid' : 'soft'"
            size="xs"
            @click="state.value.mode.value = 'blur'" />
          <UButton
            label="Pixelate"
            :color="mode === 'pixelate' ? 'primary' : 'neutral'"
            :variant="mode === 'pixelate' ? 'solid' : 'soft'"
            size="xs"
            @click="state.value.mode.value = 'pixelate'" />
        </div>

        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-[10px] text-muted uppercase font-medium">Use Selection</span>
            <USwitch v-model="state.value.useArea.value" size="xs" />
          </div>

          <div class="space-y-1.5">
            <div class="flex justify-between text-[10px] text-muted uppercase font-medium">
              <span>Intensity</span>
              <span>{{ intensity }}</span>
            </div>
            <USlider v-model="state.value.intensity.value" :min="1" :max="50" size="sm" />
          </div>
        </div>

        <div class="flex gap-2">
          <UButton
            label="Cancel"
            color="neutral"
            variant="ghost"
            class="flex-1"
            @click="imgEditor?.cancelTool()" />
          <UButton
            label="Apply"
            color="primary"
            class="flex-1"
            @click="applyCensor" />
        </div>
      </div>
    </div>

    <!-- The Interaction Overlay -->
    <div
      v-if="isActive"
      class="u-img-censor-overlay absolute inset-0 w-full h-full pointer-events-auto cursor-crosshair overflow-visible border-4 border-dashed border-red-500/50 z-9999"
      @mousedown.stop.prevent="handleMouseDown"
      @touchstart.stop.prevent="handleMouseDown">
      <!-- Debug Label -->
      <div
        class="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold px-2 py-1 z-10000"
        :style="{ transform: `scale(${counterScale})`, transformOrigin: 'top right' }">
        DEBUG: CENSOR TOOL READY
      </div>

      <!-- Helper Instructions -->
      <div
        v-if="useArea && selection.width <= 1"
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white p-4 rounded-xl text-center shadow-2xl z-10"
        :style="{ transform: `translate(-50%, -50%) scale(${counterScale})` }">
        <UIcon name="i-lucide-mouse-pointer-2" class="w-8 h-8 mx-auto mb-2 text-primary" />
        <p>
          Click and Drag anywhere
        </p>
        <p class="text-xs opacity-70">
          to draw a blur area
        </p>
      </div>

      <!-- The Selection Box -->
      <div
        v-if="useArea && selection.width > 0"
        class="u-img-censor-box absolute pointer-events-auto cursor-move group"
        :class="{ 'is-interacting': isInteracting }"
        :style="{
          left: selection.x + 'px',
          top: selection.y + 'px',
          width: selection.width + 'px',
          height: selection.height + 'px',
          outline: `${4 * counterScale}px solid rgba(255,255,255,0.9)`,
          boxShadow: `0 0 0 ${1 * counterScale}px black, 0 0 0 9999px rgba(0,0,0,0.6)`,
        }"
        @mousedown.stop.prevent="state.value.initiateInteraction($event, 'move')"
        @touchstart.stop.prevent="state.value.initiateInteraction($event, 'move')">
        <!-- Selection Area Highlight -->
        <div
          class="absolute inset-0 border-dashed transition-all duration-200 group-[.is-interacting]:bg-primary/30"
          :class="isInteracting ? 'border-primary' : 'border-white'"
          :style="{ borderWidth: (2 * counterScale) + 'px' }" />

        <!-- High-Visibility Handles -->
        <ImgHandler position="tl" :active="isInteracting" :style="{ transform: `scale(${counterScale * 2.5})` }" @mousedown.stop.prevent="state.value.initiateInteraction($event, 'resize', 'tl')" />
        <ImgHandler position="tr" :active="isInteracting" :style="{ transform: `scale(${counterScale * 2.5})` }" @mousedown.stop.prevent="state.value.initiateInteraction($event, 'resize', 'tr')" />
        <ImgHandler position="bl" :active="isInteracting" :style="{ transform: `scale(${counterScale * 2.5})` }" @mousedown.stop.prevent="state.value.initiateInteraction($event, 'resize', 'bl')" />
        <ImgHandler position="br" :active="isInteracting" :style="{ transform: `scale(${counterScale * 2.5})` }" @mousedown.stop.prevent="state.value.initiateInteraction($event, 'resize', 'br')" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.u-img-censor {
  display: contents;
}
</style>

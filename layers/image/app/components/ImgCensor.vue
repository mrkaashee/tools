<script setup lang="ts">
import { computed, inject, watch, onUnmounted, onMounted } from 'vue'
import type { ImageEditorContext } from '../types/editor'
import { getEventPoint } from '../utils/interaction'
import ImgHandler from './ImgHandler.vue'

const props = defineProps<{
  /** Hide internal UI controls — useful when controls are in a separate sidebar. */
  headless?: boolean
  censorState?: ReturnType<typeof useCensor>
}>()

const imgEditor = inject<ImageEditorContext>('imgEditor')

// If no state provided, use local (backwards compatibility)
const internalState = props.censorState ? undefined : useCensor(computed(() => imgEditor?.zoomLevel.value || 1))

// Resolve state source correctly
const state = computed(() => (props.censorState || internalState) as ReturnType<typeof useCensor>)

const setBoxRef = (id: string, el: HTMLElement | null) => {
  if (el) state.value.boxRefs.set(id, el)
  else state.value.boxRefs.delete(id)
}

// Proxy state values to top-level writable computeds for the template
const mode = computed({
  get: () => state.value.mode.value,
  set: val => state.value.mode.value = val
})
const intensity = computed({
  get: () => state.value.intensity.value,
  set: val => state.value.intensity.value = val
})
const useArea = computed({
  get: () => state.value.useArea.value,
  set: val => state.value.useArea.value = val
})
const selections = computed(() => state.value.selections.value)
const activeSelectionId = computed(() => state.value.activeSelectionId.value)
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
  console.log('ImgCensor: Performance layer active', { selections: selections.value.length })
})

watch(isActive, val => {
  if (val) {
    imgEditor?.registerApplyHook(applyCensor)
    const editorState = imgEditor?.getImageState()
    if (editorState?.width && editorState?.height) {
      if (selections.value.length === 0) {
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
  if (target.closest('.u-img-censor-box')) return

  const container = e.currentTarget as HTMLElement
  const rect = container.getBoundingClientRect()
  const p = getEventPoint(e)
  if (!p) return

  const x = (p.clientX - rect.left) / imgEditor.zoomLevel.value
  const y = (p.clientY - rect.top) / imgEditor.zoomLevel.value

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
            @click="mode = 'blur'" />
          <UButton
            label="Pixelate"
            :color="mode === 'pixelate' ? 'primary' : 'neutral'"
            :variant="mode === 'pixelate' ? 'solid' : 'soft'"
            size="xs"
            @click="mode = 'pixelate'" />
        </div>

        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-[10px] text-muted uppercase font-medium">Use Selection</span>
            <USwitch v-model="useArea" size="xs" />
          </div>

          <div class="space-y-1.5">
            <div class="flex justify-between text-[10px] text-muted uppercase font-medium">
              <span>Intensity</span>
              <span>{{ intensity }}</span>
            </div>
            <USlider v-model="intensity" :min="1" :max="50" size="sm" />
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

    <!-- The Interaction Overlay / Drawing Surface -->
    <div
      v-if="isActive"
      class="u-img-censor-overlay absolute inset-0 w-full h-full pointer-events-auto cursor-crosshair overflow-visible"
      @mousedown.stop.prevent="handleMouseDown"
      @touchstart.stop.prevent="handleMouseDown">
      <!-- Multiple Selection Boxes -->
      <template v-if="useArea">
        <div
          v-for="sel in selections"
          :key="sel.id"
          :ref="el => setBoxRef(sel.id, el as HTMLElement | null)"
          class="u-img-censor-box absolute pointer-events-auto cursor-move group"
          :class="[
            { 'is-interacting': activeSelectionId === sel.id && isInteracting },
            { 'is-active': activeSelectionId === sel.id },
            { 'is-blur': sel.mode === 'blur' },
            { 'is-pixelate': sel.mode === 'pixelate' },
          ]"
          :style="{
            'transform': `translate3d(${sel.x}px, ${sel.y}px, 0)`,
            'width': sel.width + 'px',
            'height': sel.height + 'px',
            'zIndex': activeSelectionId === sel.id ? 100 : 10,
            '--intensity': sel.intensity + 'px',
            '--pixel-intensity': (sel.intensity / 2) + 'px',
            '--outline-width': (2 * counterScale) + 'px',
            '--active-outline': (4 * counterScale) + 'px',
            '--shadow-width': (1 * counterScale) + 'px',
          }"
          @mousedown.stop.prevent="state.initiateInteraction($event, sel.id, 'move')"
          @touchstart.stop.prevent="state.initiateInteraction($event, sel.id, 'move')">
          <!-- Delete button for active selection -->
          <div
            v-if="activeSelectionId === sel.id && !isInteracting"
            class="absolute pointer-events-auto bg-black text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-red-500 transition-colors z-50 shadow-lg"
            :style="{
              width: `${24 * counterScale}px`,
              height: `${24 * counterScale}px`,
              top: `-${12 * counterScale}px`,
              right: `-${12 * counterScale}px`,
            }"
            title="Remove this area"
            @mousedown.stop.prevent="state.removeSelection(sel.id)"
            @touchstart.stop.prevent="state.removeSelection(sel.id)">
            <UIcon name="i-lucide-x" :style="{ width: `${14 * counterScale}px`, height: `${14 * counterScale}px` }" />
          </div>

          <!-- Selection Area Highlight -->
          <div
            class="absolute inset-0 group-[.is-interacting]:bg-primary/30"
            :class="[
              (activeSelectionId === sel.id && isInteracting) ? 'border-primary' : 'border-transparent',
              { 'transition-all duration-200': !isInteracting },
            ]"
            :style="{ borderWidth: (2 * counterScale) + 'px' }" />

          <!-- High-Visibility Handles (Only for active selection) -->
          <template v-if="activeSelectionId === sel.id">
            <ImgHandler position="tl" :active="isInteracting" :style="{ transform: `scale(${counterScale * 0.6})` }" @mousedown.stop.prevent="state.initiateInteraction($event, sel.id, 'resize', 'tl')" />
            <ImgHandler position="tr" :active="isInteracting" :style="{ transform: `scale(${counterScale * 0.6})` }" @mousedown.stop.prevent="state.initiateInteraction($event, sel.id, 'resize', 'tr')" />
            <ImgHandler position="bl" :active="isInteracting" :style="{ transform: `scale(${counterScale * 0.6})` }" @mousedown.stop.prevent="state.initiateInteraction($event, sel.id, 'resize', 'bl')" />
            <ImgHandler position="br" :active="isInteracting" :style="{ transform: `scale(${counterScale * 0.6})` }" @mousedown.stop.prevent="state.initiateInteraction($event, sel.id, 'resize', 'br')" />
          </template>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.u-img-censor {
  display: contents;
}

.u-img-censor-box {
  contain: layout size style;
  will-change: transform, width, height;
  outline: var(--outline-width) dashed rgba(255,255,255,0.5);
  transition: outline 0.2s;
}

.u-img-censor-box.is-active {
  outline: var(--active-outline) solid rgba(255,255,255,0.9);
}

.u-img-censor-box.is-active:not(.is-interacting) {
  box-shadow: 0 0 0 var(--shadow-width) black, 0 0 0 4000px rgba(0,0,0,0.4);
}

/* Fast CSS variables for backdrop filters instead of string interpolation */
.u-img-censor-box:not(.is-interacting).is-blur {
  backdrop-filter: blur(var(--intensity));
}

.u-img-censor-box:not(.is-interacting).is-pixelate {
  backdrop-filter: blur(var(--pixel-intensity)) contrast(200%) grayscale(50%);
}
</style>

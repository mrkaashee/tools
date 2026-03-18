<script setup lang="ts">
import { computed, inject, watch, onUnmounted, onMounted } from 'vue'
import { useCensor } from '../composables/useCensor'
import type { ImageEditorContext } from '../types/editor'
import { getEventPoint } from '../utils/interaction'
import ImgHandler from './ImgHandler.vue'

const props = defineProps<{
  /** Hide internal UI controls — useful when controls are in a separate sidebar. */
  headless?: boolean
  mode?: 'blur' | 'pixelate'
  intensity?: number
  state?: ReturnType<typeof useCensor>
}>()

const imgStudio = inject<ImageEditorContext>('imgStudio')

// If no state provided, use local (backwards compatibility)
const localState = props.state ? undefined : useCensor(computed(() => imgStudio?.zoomLevel.value || 1))

// Resolve state source correctly
const censor = computed(() => (props.state || localState) as ReturnType<typeof useCensor>)

const setBoxRef = (id: string, el: HTMLElement | null) => {
  if (el) censor.value.boxRefs.set(id, el)
  else censor.value.boxRefs.delete(id)
}

// Proxy state values to top-level writable computeds for the template
const censorMode = computed({
  get: () => censor.value.mode.value,
  set: val => censor.value.mode.value = val
})
const censorIntensity = computed({
  get: () => censor.value.intensity.value,
  set: val => censor.value.intensity.value = val
})

// Initialize defaults from props if provided
watch(() => props.mode, newMode => {
  if (newMode) censorMode.value = newMode
}, { immediate: true })

watch(() => props.intensity, newIntensity => {
  if (newIntensity !== undefined) censorIntensity.value = newIntensity
}, { immediate: true })

const useArea = computed({
  get: () => censor.value.useArea.value,
  set: val => censor.value.useArea.value = val
})
const selections = computed(() => censor.value.selections.value)
const activeSelectionId = computed(() => censor.value.activeSelectionId.value)
const isInteracting = computed(() => censor.value.isInteracting.value)

const isActive = computed(() => imgStudio?.activeTool.value === 'censor')

const applyCensor = () => {
  if (!imgStudio) return
  const canvas = imgStudio.getCanvas()
  if (!canvas) return

  const tempCanvas = censor.value.getCensoredCanvas(canvas)
  if (tempCanvas) {
    imgStudio.commit(tempCanvas, 'censor')
    imgStudio.deactivateTool()
  }
}

onMounted(() => {
  console.log('ImgCensor: Performance layer active', { selections: selections.value.length })
})

watch(isActive, val => {
  if (val) {
    imgStudio?.registerApplyHook(applyCensor)
    const editorState = imgStudio?.getImageState()
    if (editorState?.width && editorState?.height) {
      if (selections.value.length === 0) {
        censor.value.initializeSelection(editorState.width, editorState.height)
      }
    }
  }
  else {
    imgStudio?.unregisterApplyHook(applyCensor)
  }
}, { immediate: true })

onUnmounted(() => {
  imgStudio?.unregisterApplyHook(applyCensor)
})

// Interaction Handler
const handleMouseDown = (e: MouseEvent | TouchEvent) => {
  if (!isActive.value || !useArea.value || !imgStudio) return

  const target = e.target as HTMLElement
  if (target.closest('.u-img-censor-box')) return

  const container = e.currentTarget as HTMLElement
  const rect = container.getBoundingClientRect()
  const p = getEventPoint(e)
  if (!p) return

  const x = (p.clientX - rect.left) / imgStudio.zoomLevel.value
  const y = (p.clientY - rect.top) / imgStudio.zoomLevel.value

  censor.value.startNewSelection(e, x, y)
}

const counterScale = computed(() => 1 / (imgStudio?.zoomLevel.value || 1))

defineExpose({
  mode: censorMode,
  intensity: censorIntensity,
  useArea: censor.value.useArea,
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
          @click="imgStudio?.activateTool('censor')" />
      </div>

      <div v-else class="space-y-4 pt-2">
        <div class="grid grid-cols-2 gap-2">
          <UButton
            label="Blur"
            :color="censorMode === 'blur' ? 'primary' : 'neutral'"
            :variant="censorMode === 'blur' ? 'solid' : 'soft'"
            size="xs"
            @click="censorMode = 'blur'" />
          <UButton
            label="Pixelate"
            :color="censorMode === 'pixelate' ? 'primary' : 'neutral'"
            :variant="censorMode === 'pixelate' ? 'solid' : 'soft'"
            size="xs"
            @click="censorMode = 'pixelate'" />
        </div>

        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-[10px] text-muted uppercase font-medium">Use Selection</span>
            <USwitch v-model="useArea" size="xs" />
          </div>

          <div class="space-y-1.5">
            <div class="flex justify-between text-[10px] text-muted uppercase font-medium">
              <span>Intensity</span>
              <span>{{ censorIntensity }}</span>
            </div>
            <USlider v-model="censorIntensity" :min="1" :max="50" size="sm" />
          </div>
        </div>

        <div class="flex gap-2">
          <UButton
            label="Cancel"
            color="neutral"
            variant="ghost"
            class="flex-1"
            @click="imgStudio?.cancelTool()" />
          <UButton
            label="Apply"
            color="primary"
            class="flex-1"
            @click="applyCensor" />
        </div>
      </div>
    </div>

    <!-- The Interaction Overlay / Drawing Surface -->
    <Teleport v-if="isActive && imgStudio?.overlayRef.value" :to="imgStudio.overlayRef.value">
      <div
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
            @mousedown.stop.prevent="censor.initiateInteraction($event, sel.id, 'move')"
            @touchstart.stop.prevent="censor.initiateInteraction($event, sel.id, 'move')">
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
              @mousedown.stop.prevent="censor.removeSelection(sel.id)"
              @touchstart.stop.prevent="censor.removeSelection(sel.id)">
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
              <ImgHandler position="top-left" :active="isInteracting" :style="{ transform: `scale(${counterScale * 0.6})` }" @mousedown.stop.prevent="censor.initiateInteraction($event, sel.id, 'resize', 'top-left')" />
              <ImgHandler position="top-right" :active="isInteracting" :style="{ transform: `scale(${counterScale * 0.6})` }" @mousedown.stop.prevent="censor.initiateInteraction($event, sel.id, 'resize', 'top-right')" />
              <ImgHandler position="bottom-left" :active="isInteracting" :style="{ transform: `scale(${counterScale * 0.6})` }" @mousedown.stop.prevent="censor.initiateInteraction($event, sel.id, 'resize', 'bottom-left')" />
              <ImgHandler position="bottom-right" :active="isInteracting" :style="{ transform: `scale(${counterScale * 0.6})` }" @mousedown.stop.prevent="censor.initiateInteraction($event, sel.id, 'resize', 'bottom-right')" />
            </template>
          </div>
        </template>
      </div>
    </Teleport>
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

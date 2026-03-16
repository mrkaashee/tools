<script setup lang="ts">
import type { ImageEditorContext } from '../types/editor'
import ImgHandler from './ImgHandler.vue'

const imgEditor = inject<ImageEditorContext>('imgEditor')

const {
  mode,
  intensity,
  useArea,
  selection,
  isInteracting,
  initializeSelection,
  initiateInteraction,
  getCensoredCanvas
} = useCensor(computed(() => imgEditor?.zoomLevel.value || 1))

const isActive = computed(() => imgEditor?.activeTool.value === 'censor')

const applyCensor = () => {
  if (!imgEditor) return
  const canvas = imgEditor.getCanvas()
  if (!canvas) return

  const tempCanvas = getCensoredCanvas(canvas)
  if (tempCanvas) {
    imgEditor.commit(tempCanvas, 'censor')
    imgEditor.deactivateTool()
  }
}

watch(isActive, val => {
  if (val) {
    if (!selection.value.width) {
      const state = imgEditor?.getImageState()
      if (state?.width && state?.height) {
        initializeSelection(state.width, state.height)
      }
    }
    imgEditor?.registerApplyHook(applyCensor)
  }
  else {
    imgEditor?.unregisterApplyHook(applyCensor)
  }
}, { immediate: true })

onUnmounted(() => {
  imgEditor?.unregisterApplyHook(applyCensor)
})
</script>

<template>
  <div class="u-img-censor space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-[10px] font-bold uppercase tracking-widest text-muted">
        Censoring Tool
      </h3>
      <UBadge v-if="isActive" color="primary" size="xs" variant="subtle">
        Active
      </UBadge>
    </div>

    <div v-if="!isActive">
      <UButton
        label="Censor Image"
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
          <span class="text-[10px] text-muted uppercase font-medium">Censor Area</span>
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
          @click="imgEditor?.deactivateTool()" />
        <UButton
          label="Apply"
          color="primary"
          class="flex-1"
          @click="applyCensor" />
      </div>
    </div>

    <!-- Selection Overlay (Teleported to Editor Overlay) -->
    <Teleport v-if="isActive && useArea && imgEditor?.overlayRef.value" :to="imgEditor.overlayRef.value">
      <div
        class="absolute pointer-events-auto cursor-move z-40 group"
        :class="{ 'is-interacting': isInteracting }"
        :style="{
          left: selection.x + 'px',
          top: selection.y + 'px',
          width: selection.width + 'px',
          height: selection.height + 'px',
        }"
        @mousedown="initiateInteraction($event, 'move')">
        <!-- Selection Border -->
        <div class="absolute inset-0 border border-dashed border-inverted/50 shadow-[0_0_0_9999px_oklch(0_0_0/0.4)] transition-all duration-200 group-[.is-interacting]:border-primary group-[.is-interacting]:border-solid group-[.is-interacting]:border-[1.5px]" />

        <!-- Resize Handles -->
        <ImgHandler position="tl" @mousedown.stop="initiateInteraction($event, 'resize', 'tl')" />
        <ImgHandler position="tr" @mousedown.stop="initiateInteraction($event, 'resize', 'tr')" />
        <ImgHandler position="bl" @mousedown.stop="initiateInteraction($event, 'resize', 'bl')" />
        <ImgHandler position="br" @mousedown.stop="initiateInteraction($event, 'resize', 'br')" />

        <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
          <UIcon name="i-lucide-shield-alert" class="text-inverted/20 w-8 h-8" />
        </div>
      </div>
    </Teleport>
  </div>
</template>

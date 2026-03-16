<script setup lang="ts">
import type { ImageEditorContext } from '../types/editor'

const imgEditor = inject<ImageEditorContext>('imgEditor')

if (!imgEditor) {
  throw new Error('ImgEditorToolbar must be used within an ImgEditor component')
}

// Map context values for easier template access
const canUndo = computed(() => imgEditor.canUndo?.value ?? false)
const canRedo = computed(() => imgEditor.canRedo?.value ?? false)
const zoomLevel = computed(() => imgEditor.zoomLevel.value)
const zoom = computed({
  get: () => imgEditor.zoomLevel.value,
  set: val => { imgEditor.zoomLevel.value = val },
})

const undo = () => imgEditor.undo?.()
const redo = () => imgEditor.redo?.()
const resetAll = () => imgEditor.resetAll?.()
const zoomIn = () => imgEditor.zoomIn?.()
const zoomOut = () => imgEditor.zoomOut?.()
const resetZoom = () => imgEditor.resetZoom?.()
</script>

<template>
  <Teleport v-if="imgEditor?.toolbarTargetRef?.value" :to="imgEditor.toolbarTargetRef.value">
    <div class="flex items-center justify-between gap-4 px-4 py-2 bg-elevated/80 backdrop-blur-md border-b border-muted z-20">
      <!-- History Controls -->
      <div class="flex items-center gap-2">
        <UButton
          icon="i-lucide-undo-2"
          color="neutral"
          variant="ghost"
          :disabled="!canUndo"
          title="Undo (Ctrl+Z)"
          @click="undo" />
        <UButton
          icon="i-lucide-redo-2"
          color="neutral"
          variant="ghost"
          :disabled="!canRedo"
          title="Redo (Ctrl+Y)"
          @click="redo" />
        <UButton
          icon="i-lucide-rotate-ccw"
          color="neutral"
          variant="ghost"
          title="Reset All Changes"
          @click="resetAll" />
      </div>

      <!-- Zoom Controls -->
      <div class="flex items-center gap-3 flex-1 max-w-sm justify-center">
        <UButton
          icon="i-lucide-zoom-out"
          color="neutral"
          variant="ghost"
          size="xs"
          title="Zoom Out"
          @click="zoomOut" />

        <div class="flex-1 px-2 group flex items-center gap-3">
          <USlider
            v-model="zoom"
            :min="imgEditor.minZoom.value"
            :max="imgEditor.maxZoom.value"
            :step="0.01"
            size="sm"
            class="flex-1" />
          <span class="min-w-10 text-right text-muted text-[10px] font-mono font-bold tabular-nums">
            {{ Math.round(zoomLevel * 100) }}%
          </span>
        </div>

        <UButton
          icon="i-lucide-zoom-in"
          color="neutral"
          variant="ghost"
          size="xs"
          title="Zoom In"
          @click="zoomIn" />
        <UButton
          icon="i-lucide-refresh-cw"
          color="neutral"
          variant="ghost"
          size="xs"
          title="Reset Zoom"
          @click="resetZoom" />
      </div>

      <!-- Right Slot -->
      <div class="flex items-center gap-2">
        <slot name="right" />
      </div>
    </div>
  </Teleport>
</template>

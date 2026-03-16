<script lang="ts" setup>
import type { ImageEditorContext } from '../types/editor'

const props = defineProps<{
  avatarMode?: boolean
  size?: number
}>()

const imgEditor = inject<ImageEditorContext>('imgEditor')

const isComparing = ref(false)

const currentImage = computed(() => {
  if (!imgEditor) return ''
  return isComparing.value && imgEditor.imageState.value.original && !props.avatarMode
    ? imgEditor.imageState.value.original
    : imgEditor.imageState.value.current
})

const width = computed(() => imgEditor?.imageState.value.width || 0)
const height = computed(() => imgEditor?.imageState.value.height || 0)

const avatarPreviewStyle = computed(() => {
  if (!imgEditor || !imgEditor.panBounds?.value || !props.size || !props.avatarMode) return {}

  const S = props.size
  const cropW = imgEditor.panBounds.value.width || 1
  const P = S / cropW

  const imgW = imgEditor.imageState.value.width * imgEditor.zoomLevel.value
  const imgH = imgEditor.imageState.value.height * imgEditor.zoomLevel.value

  const relativeX = imgEditor.panX.value - imgEditor.panBounds.value.left
  const relativeY = imgEditor.panY.value - imgEditor.panBounds.value.top

  return {
    width: `${imgW * P}px`,
    height: `${imgH * P}px`,
    transform: `translate(${relativeX * P}px, ${relativeY * P}px)`,
  }
})
</script>

<template>
  <!-- Avatar Mode -->
  <div v-if="props.avatarMode" :style="{ width: (props.size || 80) + 'px', height: (props.size || 80) + 'px' }" class="relative rounded-full overflow-hidden shrink-0 bg-inverted/5 border border-default shadow-sm">
    <!-- Checked background pattern for transparent images -->
    <div
      class="absolute inset-0 z-0 opacity-20"
      style="background-image: linear-gradient(45deg, #808080 25%, transparent 25%), linear-gradient(-45deg, #808080 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #808080 75%), linear-gradient(-45deg, transparent 75%, #808080 75%); background-size: 10px 10px; background-position: 0 0, 0 5px, 5px -5px, -5px 0px;" />

    <img
      v-if="currentImage"
      :src="currentImage"
      class="absolute top-0 left-0 max-w-none origin-top-left z-10"
      :style="avatarPreviewStyle">
    <div v-else class="absolute inset-0 flex items-center justify-center z-10">
      <UIcon name="i-heroicons-user" class="w-1/2 h-1/2 text-muted" />
    </div>
  </div>

  <!-- Normal Mode -->
  <div v-else-if="imgEditor?.hasImage" class="space-y-3">
    <div class="flex items-center justify-between px-1">
      <h3 class="text-[10px] font-bold uppercase tracking-widest text-muted">
        Preview & Compare
      </h3>
      <UBadge color="neutral" variant="subtle" size="xs">
        {{ width }} x {{ height }}
      </UBadge>
    </div>

    <div class="relative group rounded-xl overflow-hidden border border-default bg-muted/50 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.1)]">
      <!-- Checked background pattern for transparent images -->
      <div
        class="absolute inset-0 z-0 opacity-20"
        style="background-image: linear-gradient(45deg, #808080 25%, transparent 25%), linear-gradient(-45deg, #808080 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #808080 75%), linear-gradient(-45deg, transparent 75%, #808080 75%); background-size: 10px 10px; background-position: 0 0, 0 5px, 5px -5px, -5px 0px;" />

      <!-- The Image -->
      <div class="relative w-full aspect-video flex items-center justify-center p-2 z-10 backdrop-blur-[2px]">
        <img
          v-if="currentImage"
          :src="currentImage"
          class="max-w-full max-h-full object-contain rounded drop-shadow-md transition-all duration-200"
          :class="{ 'opacity-80 scale-95': isComparing }">
      </div>

      <!-- Compare Overlay Instruction (Only shows on hover) -->
      <div class="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-black/40">
        <UBadge v-if="!isComparing" color="neutral" variant="solid" class="shadow-lg backdrop-blur-md bg-white/90 text-black">
          Hold 'Compare' to see original
        </UBadge>
        <UBadge v-else color="primary" variant="solid" class="shadow-lg animate-pulse">
          Showing Original
        </UBadge>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex gap-2">
      <UButton
        block
        color="neutral"
        variant="soft"
        icon="i-lucide-split-square-horizontal"
        class="flex-1 transition-transform duration-200 active:scale-[0.97]"
        @mousedown="isComparing = true"
        @mouseup="isComparing = false"
        @mouseleave="isComparing = false"
        @touchstart="isComparing = true"
        @touchend="isComparing = false">
        Compare
      </UButton>

      <!-- Fullscreen/Pop-out action if needed in future -->
      <UTooltip text="Quick Export">
        <UButton
          icon="i-lucide-download"
          color="primary"
          variant="soft"
          @click="imgEditor?.applyAndExport('preview-export.png')" />
      </UTooltip>
    </div>
  </div>
</template>

<script lang="ts">
import { ref, computed, inject } from 'vue'
import type { AppConfig } from '@nuxt/schema'
import theme from '../utils/themes/img-preview'
import type { ComponentConfig } from '../types/tv'
import type { ImageEditorContext } from '../types/editor'
import { tv } from '../utils/tv'
import type { StudioAppConfig } from '../types/studio'

export type StudioPreview = ComponentConfig<typeof theme, AppConfig, 'studio'>

export interface StudioPreviewProps {
  headless?: boolean
  avatarMode?: boolean
  size?: number
  ui?: StudioPreview['slots']
}
</script>

<script lang="ts" setup>
const appConfig = useAppConfig() as StudioAppConfig

const props = defineProps<StudioPreviewProps>()

const imgStudio = inject<ImageEditorContext>('imgStudio')

const resUI = computed(() => tv({ extend: tv(theme), ...(appConfig.ui?.preview || {}) })(props.ui))

const isComparing = ref(false)

const currentImage = computed(() => {
  if (!imgStudio) return ''
  return isComparing.value && imgStudio.imageState.value.original && !props.avatarMode
    ? imgStudio.imageState.value.original
    : imgStudio.imageState.value.current
})

const width = computed(() => imgStudio?.imageState.value.width || 0)
const height = computed(() => imgStudio?.imageState.value.height || 0)

const avatarPreviewStyle = computed(() => {
  if (!imgStudio || !imgStudio.panBounds?.value || !props.size || !props.avatarMode) return {}

  const S = props.size
  const cropW = imgStudio.panBounds.value.width || 1
  const P = S / cropW

  const imgW = imgStudio.imageState.value.width * imgStudio.zoomLevel.value
  const imgH = imgStudio.imageState.value.height * imgStudio.zoomLevel.value

  const relativeX = imgStudio.panX.value - imgStudio.panBounds.value.left
  const relativeY = imgStudio.panY.value - imgStudio.panBounds.value.top

  return {
    width: `${imgW * P}px`,
    height: `${imgH * P}px`,
    transform: `translate(${relativeX * P}px, ${relativeY * P}px)`,
  }
})
</script>

<template>
  <!-- Avatar Mode -->
  <div v-if="props.avatarMode" :class="resUI.avatarRoot()" :style="{ width: (props.size || 80) + 'px', height: (props.size || 80) + 'px' }">
    <!-- Checked background pattern for transparent images -->
    <div :class="resUI.checkerboard()" style="background-image: linear-gradient(45deg, #808080 25%, transparent 25%), linear-gradient(-45deg, #808080 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #808080 75%), linear-gradient(-45deg, transparent 75%, #808080 75%); background-size: 10px 10px; background-position: 0 0, 0 5px, 5px -5px, -5px 0px;" />

    <img
      v-if="currentImage"
      :src="currentImage"
      :class="resUI.avatarImage()"
      :style="avatarPreviewStyle">
    <div v-else :class="resUI.avatarPlaceholder()">
      <UIcon name="i-heroicons-user" class="w-1/2 h-1/2 text-muted" />
    </div>
  </div>

  <!-- Normal Mode -->
  <div v-else-if="imgStudio?.hasImage" :class="resUI.root()">
    <div v-if="!props.headless" :class="resUI.header()">
      <h3 :class="resUI.title()">
        Preview & Compare
      </h3>
      <UBadge color="neutral" variant="subtle" size="xs" :class="resUI.badge()">
        {{ width }} x {{ height }}
      </UBadge>
    </div>

    <div :class="resUI.previewContainer()">
      <!-- Checked background pattern for transparent images -->
      <div :class="resUI.checkerboard()" style="background-image: linear-gradient(45deg, #808080 25%, transparent 25%), linear-gradient(-45deg, #808080 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #808080 75%), linear-gradient(-45deg, transparent 75%, #808080 75%); background-size: 10px 10px; background-position: 0 0, 0 5px, 5px -5px, -5px 0px;" />

      <!-- The Image -->
      <div :class="resUI.imageWrapper()">
        <img
          v-if="currentImage"
          :src="currentImage"
          :class="[resUI.image(), { 'opacity-80 scale-95': isComparing }]">
      </div>

      <!-- Compare Overlay Instruction (Only shows on hover) -->
      <div :class="resUI.compareOverlay()">
        <UBadge v-if="!isComparing" color="neutral" variant="solid" :class="resUI.compareBadge()" class="bg-white/90 text-black">
          Hold 'Compare' to see original
        </UBadge>
        <UBadge v-else color="primary" variant="solid" :class="resUI.compareBadge()" class="animate-pulse">
          Showing Original
        </UBadge>
      </div>
    </div>

    <!-- Actions -->
    <div :class="resUI.actions()">
      <UButton
        block
        color="neutral"
        variant="soft"
        icon="i-lucide-split-square-horizontal"
        :class="resUI.compareButton()"
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
          :class="resUI.exportButton()"
          @click="imgStudio?.applyAndExport('preview-export.png')" />
      </UTooltip>
    </div>
  </div>
</template>

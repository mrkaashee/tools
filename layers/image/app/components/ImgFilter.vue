<script lang="ts">
import { ref, inject, watch, onUnmounted, computed } from 'vue'
import type { AppConfig } from '@nuxt/schema'
import theme from '../utils/themes/img-filter'
import type { ComponentConfig } from '../types/tv'
import type { ImageEditorContext, FilterOptions } from '../types/editor'
import { tv } from '../utils/tv'
import type { StudioAppConfig } from '../types/studio'

export type StudioFilter = ComponentConfig<typeof theme, AppConfig, 'studio'>

export interface StudioFilterProps {
  headless?: boolean
  ui?: StudioFilter['slots']
}

export const PRESET_FILTERS = [
  { id: 'none', label: 'Original', preset: {} },
  { id: 'vivid', label: 'Vivid', preset: { saturate: 150, contrast: 110, brightness: 105 } },
  { id: 'mono', label: 'B&W', preset: { grayscale: 100, contrast: 120 } },
  { id: 'warm', label: 'Warm', preset: { sepia: 30, saturate: 120, temperature: 20 } },
  { id: 'cool', label: 'Cool', preset: { hueRotate: 10, saturate: 90, temperature: -20 } },
  { id: 'dramatic', label: 'Dramatic', preset: { contrast: 150, brightness: 90, exposure: -10 } },
  { id: 'fade', label: 'Fade', preset: { brightness: 110, contrast: 85, saturate: 80, blacks: 20 } },
]
</script>

<script setup lang="ts">
const appConfig = useAppConfig() as StudioAppConfig

const props = defineProps<StudioFilterProps>()

const imgStudio = inject<ImageEditorContext>('imgStudio')

const resUI = computed(() => tv({ extend: tv(theme), ...(appConfig.ui?.filter || {}) })(props.ui))

const currentFilters = ref<FilterOptions>({
  brightness: 100,
  contrast: 100,
  saturate: 100,
  blur: 0,
  grayscale: 0,
  sepia: 0,
  hueRotate: 0,
  exposure: 0,
  highlights: 0,
  shadows: 0,
  vibrance: 0,
  clarity: 0,
  temperature: 0,
  tint: 0,
  whites: 0,
  blacks: 0,
  sharpen: 0,
  lastPreset: 'none',
})

// Snapshot of the image BEFORE adjustment starts
let commitTimeout: ReturnType<typeof setTimeout> | null = null

const bakeFilters = async (shouldCommit: boolean = true) => {
  const canvas = imgStudio?.getCanvas()
  if (!canvas || !imgStudio || !imgStudio.processImage) return

  const filters = currentFilters.value
  const needsWorker = filters.exposure !== 0
    || filters.highlights !== 0
    || filters.shadows !== 0
    || filters.vibrance !== 0
    || filters.hueRotate !== 0
    || filters.clarity !== 0
    || filters.temperature !== 0
    || filters.tint !== 0
    || filters.whites !== 0
    || filters.blacks !== 0
    || filters.sharpen !== 0

  if (!needsWorker) {
    // Basic CSS baking (legacy path for speed with basic filters)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const filterStr = buildFilterString(currentFilters.value)
    if (filterStr === 'none') return

    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = canvas.width
    tempCanvas.height = canvas.height
    const tempCtx = tempCanvas.getContext('2d')
    if (tempCtx) {
      tempCtx.drawImage(canvas, 0, 0)
      ctx.filter = filterStr
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(tempCanvas, 0, 0)
      ctx.filter = 'none'
      imgStudio.canvasPreviewStyle.value = {}
      if (shouldCommit) imgStudio.commit(canvas, 'filter')
    }
    return
  }

  // Worker Processing (Professional-grade)
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

  const result = await imgStudio.processImage(imageData, {
    brightness: currentFilters.value.brightness ?? 100,
    contrast: currentFilters.value.contrast ?? 100,
    saturate: currentFilters.value.saturate ?? 100,
    grayscale: currentFilters.value.grayscale ?? 0,
    sepia: currentFilters.value.sepia ?? 0,
    hueRotate: currentFilters.value.hueRotate ?? 0,
    exposure: currentFilters.value.exposure ?? 0,
    highlights: currentFilters.value.highlights ?? 0,
    shadows: currentFilters.value.shadows ?? 0,
    vibrance: currentFilters.value.vibrance ?? 0,
    clarity: currentFilters.value.clarity ?? 0,
    temperature: currentFilters.value.temperature ?? 0,
    tint: currentFilters.value.tint ?? 0,
    whites: currentFilters.value.whites ?? 0,
    blacks: currentFilters.value.blacks ?? 0,
    sharpen: currentFilters.value.sharpen ?? 0,
  })

  ctx.putImageData(result, 0, 0)
  imgStudio.canvasPreviewStyle.value = {}
  if (shouldCommit) imgStudio.commit(canvas, 'filter')
}

const applyFilter = (filters: FilterOptions) => {
  currentFilters.value = { ...currentFilters.value, ...filters }

  const filterStr = buildFilterString(currentFilters.value)

  // CSS Preview for zero-lag interaction
  if (imgStudio) {
    imgStudio.canvasPreviewStyle.value = { filter: filterStr }
  }

  // Debounce the actual canvas baking (expensive)
  if (commitTimeout) clearTimeout(commitTimeout)
  commitTimeout = setTimeout(() => {
    bakeFilters(false) // Bake for preview, but don't commit to history yet
  }, 1000)
}

watch(() => imgStudio?.activeTool.value, tool => {
  if (tool === 'filter') {
    imgStudio?.registerApplyHook(bakeFilters)
  }
  else {
    imgStudio?.unregisterApplyHook(bakeFilters)
    // Clear preview style on tool change to avoid ghosting
    if (imgStudio) imgStudio.canvasPreviewStyle.value = {}
  }
}, { immediate: true })

const buildFilterString = (filters: FilterOptions): string => {
  const parts = []

  // Approximations for CSS preview
  const brightness = (filters.brightness ?? 100) + (filters.exposure ?? 0)
  const saturation = (filters.saturate ?? 100) + (filters.vibrance ?? 0)
  const contrast = (filters.contrast ?? 100) + ((filters.highlights ?? 0) - (filters.shadows ?? 0)) / 2 + ((filters.clarity ?? 0) * 0.5)

  if (brightness !== 100) parts.push(`brightness(${brightness}%)`)
  if (contrast !== 100) parts.push(`contrast(${contrast}%)`)
  if (saturation !== 100) parts.push(`saturate(${saturation}%)`)
  if (filters.blur && filters.blur > 0) parts.push(`blur(${filters.blur}px)`)
  if (filters.grayscale && filters.grayscale > 0) parts.push(`grayscale(${filters.grayscale}%)`)
  if (filters.sepia && filters.sepia > 0) parts.push(`sepia(${filters.sepia}%)`)

  const hue = (filters.hueRotate ?? 0) + ((filters.temperature ?? 0) * 0.5) + ((filters.tint ?? 0) * 0.3)
  if (hue !== 0) parts.push(`hue-rotate(${hue}deg)`)

  return parts.length > 0 ? parts.join(' ') : 'none'
}

const resetFilters = async () => {
  // Reset slider state
  currentFilters.value = {
    brightness: 100,
    contrast: 100,
    saturate: 100,
    blur: 0,
    grayscale: 0,
    sepia: 0,
    hueRotate: 0,
    exposure: 0,
    highlights: 0,
    shadows: 0,
    vibrance: 0,
    clarity: 0,
    temperature: 0,
    tint: 0,
    whites: 0,
    blacks: 0,
    sharpen: 0,
    lastPreset: 'none',
  }

  // Cancel any pending debounced bake
  if (commitTimeout) {
    clearTimeout(commitTimeout)
    commitTimeout = null
  }

  // Clear the CSS preview filter immediately
  if (imgStudio) imgStudio.canvasPreviewStyle.value = {}

  // Reload the canvas from the last committed snapshot.
  const lastCommitted = imgStudio?.imageState.value.current
  if (lastCommitted && imgStudio) {
    await imgStudio.loadImage(lastCommitted, true, true)
  }
}

onUnmounted(() => {
  if (commitTimeout) clearTimeout(commitTimeout)
})

defineExpose({
  applyFilter,
  resetFilters,
  currentFilters,
})
</script>

<template>
  <div :class="resUI.root()">
    <slot :apply-filter="applyFilter" :reset-filters="resetFilters" :current-filters="currentFilters">
      <div v-if="!props.headless" :class="resUI.header()">
        <h3 :class="resUI.title()">
          Filters &amp; Effects
        </h3>
        <UButton
          label="Reset"
          variant="subtle"
          color="error"
          size="xs"
          icon="i-lucide-rotate-ccw"
          :class="resUI.resetButton()"
          @click="resetFilters" />
      </div>

      <!-- Presets Gallery -->
      <div v-if="!props.headless" :class="resUI.presets()">
        <UButton
          v-for="preset in PRESET_FILTERS"
          :key="preset.id"
          :icon="preset.id === 'none' ? 'i-lucide-image' : 'i-lucide-sparkles'"
          :label="preset.label"
          :variant="currentFilters.lastPreset === preset.id ? 'solid' : 'subtle'"
          :color="currentFilters.lastPreset === preset.id ? 'primary' : 'neutral'"
          size="xs"
          :class="resUI.preset()"
          @click="preset.id === 'none' ? (resetFilters(), currentFilters.lastPreset = 'none') : (applyFilter(preset.preset), currentFilters.lastPreset = preset.id)" />
      </div>

      <UAccordion
        v-if="!props.headless"
        multiple
        :class="resUI.accordion()"
        :items="[
          { label: 'Professional Controls', icon: 'i-lucide-settings-2', slot: 'pro' },
        ]">
        <template #basic>
          <div :class="resUI.control()">
            <div :class="resUI.controlHeader()">
              <span :class="resUI.controlLabel()">Brightness</span>
              <span :class="resUI.controlValue()">{{ currentFilters.brightness }}%</span>
            </div>
            <USlider
              v-model="currentFilters.brightness"
              :min="0"
              :max="200"
              :step="1"
              :class="resUI.slider()"
              @update:model-value="applyFilter({})" />

            <div :class="resUI.controlHeader()">
              <span :class="resUI.controlLabel()">Contrast</span>
              <span :class="resUI.controlValue()">{{ currentFilters.contrast }}%</span>
            </div>
            <USlider
              v-model="currentFilters.contrast"
              :min="0"
              :max="200"
              :step="1"
              :class="resUI.slider()"
              @update:model-value="applyFilter({})" />

            <div :class="resUI.controlHeader()">
              <span :class="resUI.controlLabel()">Saturation</span>
              <span :class="resUI.controlValue()">{{ currentFilters.saturate }}%</span>
            </div>
            <USlider
              v-model="currentFilters.saturate"
              :min="0"
              :max="200"
              :step="1"
              :class="resUI.slider()"
              @update:model-value="applyFilter({})" />

            <div :class="resUI.controlHeader()">
              <span :class="resUI.controlLabel()">Blur</span>
              <span :class="resUI.controlValue()">{{ currentFilters.blur }}px</span>
            </div>
            <USlider
              v-model="currentFilters.blur"
              :min="0"
              :max="20"
              :step="0.1"
              :class="resUI.slider()"
              @update:model-value="applyFilter({})" />
          </div>
        </template>

        <template #color>
          <div :class="resUI.control()">
            <div :class="resUI.controlHeader()">
              <span :class="resUI.controlLabel()">Temperature</span>
              <span :class="resUI.controlValue()">{{ currentFilters.temperature }}%</span>
            </div>
            <USlider
              v-model="currentFilters.temperature"
              :min="-100"
              :max="100"
              :step="1"
              :class="resUI.slider()"
              @update:model-value="applyFilter({})" />

            <div :class="resUI.controlHeader()">
              <span :class="resUI.controlLabel()">Tint</span>
              <span :class="resUI.controlValue()">{{ currentFilters.tint }}%</span>
            </div>
            <USlider
              v-model="currentFilters.tint"
              :min="-100"
              :max="100"
              :step="1"
              :class="resUI.slider()"
              @update:model-value="applyFilter({})" />

            <div :class="resUI.controlHeader()">
              <span :class="resUI.controlLabel()">Vibrance</span>
              <span :class="resUI.controlValue()">{{ currentFilters.vibrance }}%</span>
            </div>
            <USlider
              v-model="currentFilters.vibrance"
              :min="-100"
              :max="100"
              :step="1"
              :class="resUI.slider()"
              @update:model-value="applyFilter({})" />
          </div>
        </template>

        <template #pro>
          <div :class="resUI.control()">
            <div :class="resUI.controlHeader()">
              <span :class="resUI.controlLabel()">Exposure</span>
              <span :class="resUI.controlValue()">{{ currentFilters.exposure }}%</span>
            </div>
            <USlider
              v-model="currentFilters.exposure"
              :min="-100"
              :max="100"
              :step="1"
              :class="resUI.slider()"
              @update:model-value="applyFilter({})" />

            <div :class="resUI.controlHeader()">
              <span :class="resUI.controlLabel()">Highlights</span>
              <span :class="resUI.controlValue()">{{ currentFilters.highlights }}%</span>
            </div>
            <USlider
              v-model="currentFilters.highlights"
              :min="-100"
              :max="100"
              :step="1"
              :class="resUI.slider()"
              @update:model-value="applyFilter({})" />

            <div :class="resUI.controlHeader()">
              <span :class="resUI.controlLabel()">Shadows</span>
              <span :class="resUI.controlValue()">{{ currentFilters.shadows }}%</span>
            </div>
            <USlider
              v-model="currentFilters.shadows"
              :min="-100"
              :max="100"
              :step="1"
              :class="resUI.slider()"
              @update:model-value="applyFilter({})" />

            <div :class="resUI.controlHeader()">
              <span :class="resUI.controlLabel()">Clarity</span>
              <span :class="resUI.controlValue()">{{ currentFilters.clarity }}%</span>
            </div>
            <USlider
              v-model="currentFilters.clarity"
              :min="-100"
              :max="100"
              :step="1"
              :class="resUI.slider()"
              @update:model-value="applyFilter({})" />
          </div>
        </template>
      </UAccordion>
    </slot>
  </div>
</template>

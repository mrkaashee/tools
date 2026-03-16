<script lang="ts" setup>
import type { ImageEditorContext, FilterOptions } from '../types/editor'

const imgEditor = inject<ImageEditorContext>('imgEditor')

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
})

// Snapshot of the image BEFORE adjustment starts
let commitTimeout: ReturnType<typeof setTimeout> | null = null

const bakeFilters = async (shouldCommit: boolean = true) => {
  const canvas = imgEditor?.getCanvas()
  if (!canvas || !imgEditor || !imgEditor.processImage) return

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
      imgEditor.canvasPreviewStyle.value = {}
      if (shouldCommit) imgEditor.commit(canvas, 'filter')
    }
    return
  }

  // Worker Processing (Professional-grade)
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

  const result = await imgEditor.processImage(imageData, {
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
  imgEditor.canvasPreviewStyle.value = {}
  if (shouldCommit) imgEditor.commit(canvas, 'filter')
}

const applyFilter = (filters: FilterOptions) => {
  currentFilters.value = { ...currentFilters.value, ...filters }

  const filterStr = buildFilterString(currentFilters.value)

  // CSS Preview for zero-lag interaction
  if (imgEditor) {
    imgEditor.canvasPreviewStyle.value = { filter: filterStr }
  }

  // Debounce the actual canvas baking (expensive)
  if (commitTimeout) clearTimeout(commitTimeout)
  commitTimeout = setTimeout(() => {
    bakeFilters(false) // Bake for preview, but don't commit to history yet
  }, 1000)
}

watch(() => imgEditor?.activeTool.value, tool => {
  if (tool === 'filter') {
    imgEditor?.registerApplyHook(bakeFilters)
  }
  else {
    imgEditor?.unregisterApplyHook(bakeFilters)
    // Clear preview style on tool change to avoid ghosting
    if (imgEditor) imgEditor.canvasPreviewStyle.value = {}
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
  }

  // Cancel any pending debounced bake
  if (commitTimeout) {
    clearTimeout(commitTimeout)
    commitTimeout = null
  }

  // Clear the CSS preview filter immediately
  if (imgEditor) imgEditor.canvasPreviewStyle.value = {}

  // Reload the canvas from the last committed snapshot.
  // Non-committing bakeFilters(false) calls never update imageState.current,
  // so reloading it discards any baked preview pixels without touching history.
  const lastCommitted = imgEditor?.imageState.value.current
  if (lastCommitted && imgEditor) {
    await imgEditor.loadImage(lastCommitted, true, true)
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
  <div class="u-img-filter">
    <slot :apply-filter="applyFilter" :reset-filters="resetFilters" :current-filters="currentFilters" />
  </div>
</template>

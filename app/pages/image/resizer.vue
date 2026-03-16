<script lang="ts" setup>
const {
  originalWidth,
  originalHeight,
  newWidth,
  newHeight,
  maintainAspectRatio,
  resizeMode,
  percentage,
  selectedPreset,
  updateWidth,
  updateHeight,
  updatePercentage,
  applyPreset,
  resetSize,
  getBlob,
  setSource,
  fileSizeEstimate,
  presets,
} = useImageResize()

const imgRef = ref<HTMLImageElement | null>(null)

const handleLoad = () => {
  if (imgRef.value) {
    setSource(imgRef.value)
  }
}

const downloadResult = async () => {
  const blob = await getBlob()
  if (blob) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `resized-${newWidth.value}x${newHeight.value}.png`
    a.click()
    URL.revokeObjectURL(url)
  }
}

// Local state for inputs to defer updates until blur
const localWidth = ref(newWidth.value)
const localHeight = ref(newHeight.value)

// Sync local state when global state changes (presets, percentage, manual update)
watch(newWidth, val => localWidth.value = val)
watch(newHeight, val => localHeight.value = val)

const applyWidth = () => {
  const val = Number(localWidth.value)
  if (val > 0 && val !== newWidth.value) {
    updateWidth(val)
  }
  else {
    localWidth.value = newWidth.value
  }
}

const applyHeight = () => {
  const val = Number(localHeight.value)
  if (val > 0 && val !== newHeight.value) {
    updateHeight(val)
  }
  else {
    localHeight.value = newHeight.value
  }
}

// Visual Preview logic
const previewStyles = computed(() => {
  if (!originalWidth.value || !originalHeight.value) return { width: '100%', height: 'auto' }

  // We want to scale the preview dimensions to fit a reasonable viewport
  // while maintaining the relative scale of the new dimensions
  const ratio = newWidth.value / newHeight.value
  if (ratio > 1) {
    return { width: '100%', height: `${100 / ratio}%` }
  }
  else {
    return { width: `${100 * ratio}%`, height: '100%' }
  }
})
</script>

<template>
  <ImgToolPage
    title="Image Resizer"
    description="Scale images to custom dimensions or popular presets while maintaining quality."
    icon="i-lucide-scaling">
    <template #default="{ img }">
      <div class="relative w-full h-full flex items-center justify-center p-8 overflow-auto">
        <div
          class="relative bg-muted/20 border border-dashed border-muted transition-all duration-300 ease-in-out flex items-center justify-center overflow-hidden shadow-xl"
          :style="{
            width: previewStyles.width,
            height: previewStyles.height,
            maxWidth: '100%',
            maxHeight: '100%',
          }">
          <img
            ref="imgRef"
            :src="img"
            class="w-full h-full object-contain"
            @load="handleLoad">

          <!-- Preview Labels -->
          <div class="absolute bottom-2 right-2 bg-inverted/80 backdrop-blur-md px-2 py-1 rounded text-[10px] font-mono text-default border border-muted/20 pointer-events-none">
            {{ Math.round(newWidth) }} × {{ Math.round(newHeight) }}
          </div>
        </div>
      </div>
    </template>

    <template #actions>
      <UButton
        label="Download Resized Image"
        icon="i-lucide-download"
        @click="downloadResult" />
    </template>

    <template #sidebar>
      <!-- Resize Mode -->
      <div class="bg-elevated p-6 rounded-xl border border-muted space-y-4">
        <h3 class="font-semibold text-sm">
          Resize Mode
        </h3>
        <div class="flex gap-2">
          <UButton
            v-for="mode in ['custom', 'percentage', 'preset']"
            :key="mode"
            :label="mode.charAt(0).toUpperCase() + mode.slice(1)"
            size="xs"
            class="flex-1 justify-center"
            :color="resizeMode === mode ? 'primary' : 'neutral'"
            :variant="resizeMode === mode ? 'soft' : 'outline'"
            @click="resizeMode = (mode as any)" />
        </div>
      </div>

      <!-- Custom Dimensions -->
      <div v-if="resizeMode === 'custom'" class="bg-elevated p-6 rounded-xl border border-muted space-y-4">
        <h3 class="font-semibold text-sm">
          Dimensions
        </h3>
        <div class="space-y-4">
          <UFormField label="Width (px)">
            <UInput
              v-model="localWidth"
              type="number"
              @blur="applyWidth"
              @keydown.enter="applyWidth" />
          </UFormField>
          <UFormField label="Height (px)">
            <UInput
              v-model="localHeight"
              type="number"
              @blur="applyHeight"
              @keydown.enter="applyHeight" />
          </UFormField>
          <UCheckbox v-model="maintainAspectRatio" label="Maintain aspect ratio" />
        </div>
      </div>

      <!-- Percentage -->
      <div v-if="resizeMode === 'percentage'" class="bg-elevated p-6 rounded-xl border border-muted space-y-4">
        <h3 class="font-semibold text-sm">
          Scale ({{ percentage }}%)
        </h3>
        <USlider
          :model-value="percentage"
          :min="10"
          :max="200"
          @update:model-value="updatePercentage(Number($event))" />
      </div>

      <!-- Presets -->
      <div v-if="resizeMode === 'preset'" class="bg-elevated p-6 rounded-xl border border-muted space-y-4 max-h-75 overflow-y-auto">
        <h3 class="font-semibold text-sm">
          Presets
        </h3>
        <div class="space-y-2">
          <UButton
            v-for="preset in presets"
            :key="preset.label"
            block
            color="neutral"
            :variant="selectedPreset === preset.label ? 'soft' : 'outline'"
            class="justify-start text-left h-auto py-2"
            @click="applyPreset(preset)">
            <div class="flex flex-col">
              <span class="font-medium text-highlighted">{{ preset.label }}</span>
              <span class="text-xs text-muted">{{ preset.width }} × {{ preset.height }}</span>
            </div>
          </UButton>
        </div>
      </div>

      <div class="bg-elevated p-6 rounded-xl border border-muted space-y-4 text-sm text-muted">
        <div class="flex justify-between">
          <span>Original:</span>
          <span class="text-default font-medium">{{ originalWidth }} × {{ originalHeight }}</span>
        </div>
        <div class="flex justify-between">
          <span>Estimated size:</span>
          <span class="text-default font-medium">{{ fileSizeEstimate }}</span>
        </div>
        <UButton
          label="Reset to Original"
          icon="i-lucide-rotate-ccw"
          color="neutral"
          variant="subtle"
          block
          @click="resetSize" />
      </div>
    </template>
  </ImgToolPage>
</template>

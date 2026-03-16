<script lang="ts" setup>
const img = ref('https://images.pexels.com/photos/4323307/pexels-photo-4323307.jpeg')
const imageUrl = ref('')
const fileInputRef = ref<HTMLInputElement>()
const originalImageRef = ref<HTMLImageElement | null>(null)

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

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader()
    reader.onload = e => {
      img.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const handleUrlSubmit = async () => {
  if (imageUrl.value.trim()) {
    try {
      const response = await fetch(imageUrl.value.trim())
      const blob = await response.blob()
      img.value = URL.createObjectURL(blob)
      imageUrl.value = ''
    }
    catch (error) {
      if (import.meta.dev) {
        console.error('Failed to load image from URL', error)
      }
      img.value = imageUrl.value.trim()
      imageUrl.value = ''
    }
  }
}

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const handleImageLoad = () => {
  if (originalImageRef.value) {
    setSource(originalImageRef.value)
  }
}

const downloadImage = async () => {
  const blob = await getBlob()
  if (blob) {
    downloadBlob(blob, `resized-${newWidth.value}x${newHeight.value}.png`)
  }
}
</script>

<template>
  <UDashboardPanel>
    <template #body>
      <!-- Header -->
      <div class="mb-8 text-center">
        <h1 class="text-3xl font-bold tracking-tight text-highlighted mb-2">
          Resize Image
        </h1>
        <p class="text-muted text-sm">
          Scale images to custom dimensions or popular presets
        </p>
      </div>

      <!-- Image Upload Section -->
      <div class="mb-8 p-6 bg-elevated rounded-xl border border-muted shadow-sm">
        <h2 class="text-lg font-semibold text-highlighted mb-4">
          Choose Your Image
        </h2>

        <div class="flex flex-col md:flex-row gap-4">
          <div class="flex-1">
            <input
              ref="fileInputRef"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleFileUpload">
            <UButton
              label="Upload Image"
              icon="i-lucide-upload"
              size="lg"
              color="neutral"
              variant="subtle"
              class="w-full h-14 border-2 border-dashed border-muted hover:border-primary justify-center"
              @click="triggerFileInput" />
          </div>

          <div class="flex-1">
            <div class="flex gap-2">
              <UInput
                v-model="imageUrl"
                type="url"
                placeholder="Or paste image URL..."
                size="lg"
                class="flex-1"
                @keyup.enter="handleUrlSubmit" />
              <UButton
                label="Load"
                color="primary"
                size="lg"
                @click="handleUrlSubmit" />
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Preview -->
        <div class="lg:col-span-2">
          <div class="rounded-xl overflow-hidden border border-muted shadow-sm bg-default">
            <div class="px-4 py-3 bg-muted border-b border-muted">
              <h3 class="text-sm font-semibold text-default">
                Preview
              </h3>
            </div>
            <div class="relative h-125 flex items-center justify-center p-4">
              <img
                ref="originalImageRef"
                :src="img"
                crossorigin="anonymous"
                class="max-w-full max-h-full object-contain"
                alt="Preview"
                @load="handleImageLoad">
            </div>
          </div>

          <!-- Image Info -->
          <div class="mt-4 grid grid-cols-2 gap-4">
            <div class="p-4 bg-elevated rounded-lg border border-muted">
              <div class="text-xs text-muted mb-1">
                Original Size
              </div>
              <div class="text-lg font-semibold text-highlighted">
                {{ originalWidth }} × {{ originalHeight }}
              </div>
            </div>
            <div class="p-4 bg-elevated rounded-lg border border-muted">
              <div class="text-xs text-muted mb-1">
                New Size
              </div>
              <div class="text-lg font-semibold text-primary">
                {{ newWidth }} × {{ newHeight }}
              </div>
            </div>
          </div>
        </div>

        <!-- Controls -->
        <div class="space-y-6">
          <!-- Resize Mode -->
          <div
            class="rounded-xl overflow-hidden border border-muted shadow-sm bg-elevated">
            <div class="px-4 py-3 bg-muted border-b border-muted">
              <h3 class="text-sm font-semibold text-default">
                Resize Mode
              </h3>
            </div>

            <div class="p-4">
              <div class="flex gap-2">
                <UButton
                  label="Custom"
                  size="sm"
                  class="flex-1 justify-center"
                  :color="resizeMode === 'custom' ? 'primary' : 'neutral'"
                  :variant="resizeMode === 'custom' ? 'soft' : 'outline'"
                  @click="resizeMode = 'custom'" />
                <UButton
                  label="Percentage"
                  size="sm"
                  class="flex-1 justify-center"
                  :color="resizeMode === 'percentage' ? 'primary' : 'neutral'"
                  :variant="resizeMode === 'percentage' ? 'soft' : 'outline'"
                  @click="resizeMode = 'percentage'" />
                <UButton
                  label="Preset"
                  size="sm"
                  class="flex-1 justify-center"
                  :color="resizeMode === 'preset' ? 'primary' : 'neutral'"
                  :variant="resizeMode === 'preset' ? 'soft' : 'outline'"
                  @click="resizeMode = 'preset'" />
              </div>
            </div>
          </div>

          <!-- Custom Dimensions -->
          <div
            v-if="resizeMode === 'custom'"
            class="rounded-xl overflow-hidden border border-muted shadow-sm bg-elevated">
            <div class="px-4 py-3 bg-muted border-b border-muted">
              <h3 class="text-sm font-semibold text-default">
                Custom Dimensions
              </h3>
            </div>

            <div class="p-4 space-y-4">
              <!-- Width -->
              <div>
                <label class="text-[10px] font-bold uppercase tracking-widest text-muted mb-2 block">
                  Width (px)
                </label>
                <UInput
                  :model-value="newWidth"
                  type="number"
                  min="1"
                  size="sm"
                  @update:model-value="updateWidth(Number($event))" />
              </div>

              <!-- Height -->
              <div>
                <label class="text-[10px] font-bold uppercase tracking-widest text-muted mb-2 block">
                  Height (px)
                </label>
                <UInput
                  :model-value="newHeight"
                  type="number"
                  min="1"
                  size="sm"
                  @update:model-value="updateHeight(Number($event))" />
              </div>

              <!-- Maintain Aspect Ratio -->
              <UCheckbox
                v-model="maintainAspectRatio"
                label="Maintain aspect ratio" />
            </div>
          </div>

          <!-- Percentage -->
          <div
            v-if="resizeMode === 'percentage'"
            class="rounded-xl overflow-hidden border border-muted shadow-sm bg-elevated">
            <div class="px-4 py-3 bg-muted border-b border-muted">
              <h3 class="text-sm font-semibold text-default">
                Scale by Percentage
              </h3>
            </div>

            <div class="p-4 space-y-4">
              <div class="space-y-2">
                <div class="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted">
                  <span>Scale</span>
                  <span>{{ percentage }}%</span>
                </div>
                <USlider
                  :model-value="percentage"
                  :min="10"
                  :max="200"
                  size="sm"
                  @update:model-value="updatePercentage(Number($event))" />
              </div>
            </div>
          </div>

          <!-- Presets -->
          <div
            v-if="resizeMode === 'preset'"
            class="rounded-xl overflow-hidden border border-muted shadow-sm bg-elevated">
            <div class="px-4 py-3 bg-muted border-b border-muted">
              <h3 class="text-sm font-semibold text-default">
                Popular Presets
              </h3>
            </div>

            <div class="p-4 space-y-2">
              <UButton
                v-for="preset in presets"
                :key="preset.label"
                color="neutral"
                :variant="selectedPreset === preset.label ? 'soft' : 'outline'"
                class="w-full text-left justify-start px-3 py-2 h-auto block"
                @click="applyPreset(preset)">
                <div class="font-medium text-highlighted">
                  {{ preset.label }}
                </div>
                <div class="text-xs text-muted font-normal mt-0.5">
                  {{ preset.width }} × {{ preset.height }}
                </div>
              </UButton>
            </div>
          </div>

          <!-- Info -->
          <div
            class="rounded-xl overflow-hidden border border-muted shadow-sm bg-elevated">
            <div class="px-4 py-3 bg-muted border-b border-muted">
              <h3 class="text-sm font-semibold text-default">
                Info
              </h3>
            </div>

            <div class="p-4 space-y-2 text-xs text-muted">
              <div class="flex justify-between">
                <span>Estimated size:</span>
                <span class="font-medium">{{ fileSizeEstimate }}</span>
              </div>
              <UButton
                label="Reset to Original"
                icon="i-lucide-rotate-ccw"
                color="neutral"
                variant="subtle"
                class="w-full justify-center mt-2"
                @click="resetSize" />
            </div>
          </div>

          <!-- Export -->
          <div
            class="rounded-xl overflow-hidden border border-muted shadow-sm bg-elevated">
            <div class="px-4 py-3 bg-muted border-b border-muted">
              <h3 class="text-sm font-semibold text-default">
                Export
              </h3>
            </div>

            <div class="p-4">
              <UButton
                label="Download Resized Image"
                icon="i-lucide-download"
                color="primary"
                size="lg"
                class="w-full justify-center"
                @click="downloadImage" />
            </div>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

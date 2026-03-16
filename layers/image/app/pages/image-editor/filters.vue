<script lang="ts" setup>
const img = ref('https://images.pexels.com/photos/4323307/pexels-photo-4323307.jpeg')
const imageUrl = ref('')
const fileInputRef = ref<HTMLInputElement>()
const originalImageRef = ref<HTMLImageElement | null>(null)

const {
  selectedFilterId,
  brightness,
  contrast,
  saturation,
  blur,
  grayscale,
  sepia,
  hueRotate,
  exposure,
  highlights,
  shadows,
  vibrance,
  temperature,
  tint,
  processorStyle,
  filters,
  reset,
  selectFilter
} = useImageProcessor()

const { processImage, isProcessing: isWorkerProcessing } = useWorkerProcessor()

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader()
    reader.onload = e => {
      img.value = e.target?.result as string
      reset()
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
      reset()
    }
    catch (error) {
      if (import.meta.dev) {
        console.error('Failed to load image from URL', error)
      }
      img.value = imageUrl.value.trim()
      imageUrl.value = ''
      reset()
    }
  }
}

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const downloadImage = async () => {
  if (!originalImageRef.value) return

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  canvas.width = originalImageRef.value.naturalWidth
  canvas.height = originalImageRef.value.naturalHeight
  ctx.drawImage(originalImageRef.value, 0, 0)

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

  const result = await processImage(imageData, {
    brightness: brightness.value,
    contrast: contrast.value,
    saturation: saturation.value,
    grayscale: grayscale.value,
    sepia: sepia.value,
    hueRotate: hueRotate.value,
    exposure: exposure.value,
    highlights: highlights.value,
    shadows: shadows.value,
    vibrance: vibrance.value,
    temperature: temperature.value,
    tint: tint.value
  })

  ctx.putImageData(result, 0, 0)

  canvas.toBlob(blob => {
    if (blob) {
      downloadBlob(blob, `filtered-image-${selectedFilterId.value}.png`)
    }
  }, 'image/png')
}
</script>

<template>
  <UDashboardPanel>
    <template #body>
      <!-- Header -->
      <div class="mb-8 text-center">
        <h1 class="text-3xl font-bold tracking-tight text-highlighted mb-2">
          Image Filters
        </h1>
        <p class="text-muted text-sm">
          Apply professional filters and adjust image properties
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
              class="w-full h-14 border-2 border-dashed border-muted hover:border-primary"
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
                :style="{ filter: processorStyle }"
                class="max-w-full max-h-full object-contain"
                alt="Preview">
            </div>
          </div>
        </div>

        <!-- Controls -->
        <div class="space-y-6">
          <!-- Preset Filters -->
          <div
            class="rounded-xl overflow-hidden border border-muted shadow-sm bg-elevated">
            <div class="px-4 py-3 bg-muted border-b border-muted">
              <h3 class="text-sm font-semibold text-default">
                Preset Filters
              </h3>
            </div>

            <div class="p-4">
              <div class="grid grid-cols-3 gap-2">
                <UButton
                  v-for="filter in filters"
                  :key="filter.id"
                  :label="filter.label"
                  size="xs"
                  :color="selectedFilterId === filter.id ? 'primary' : 'neutral'"
                  :variant="selectedFilterId === filter.id ? 'soft' : 'outline'"
                  block
                  @click="selectFilter(filter.id)" />
              </div>
            </div>
          </div>

          <!-- Manual Adjustments -->
          <div
            class="rounded-xl overflow-hidden border border-muted shadow-sm bg-elevated">
            <div class="px-4 py-3 bg-muted border-b border-muted">
              <h3 class="text-sm font-semibold text-default">
                Manual Adjustments
              </h3>
            </div>

            <div class="p-4 space-y-4">
              <!-- Brightness -->
              <div class="space-y-2">
                <div class="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted">
                  <span>Brightness</span>
                  <span>{{ brightness }}%</span>
                </div>
                <USlider v-model="brightness" :min="0" :max="200" size="sm" />
              </div>

              <!-- Contrast -->
              <div class="space-y-2">
                <div class="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted">
                  <span>Contrast</span>
                  <span>{{ contrast }}%</span>
                </div>
                <USlider v-model="contrast" :min="0" :max="200" size="sm" />
              </div>

              <!-- Saturation -->
              <div class="space-y-2">
                <div class="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted">
                  <span>Saturation</span>
                  <span>{{ saturation }}%</span>
                </div>
                <USlider v-model="saturation" :min="0" :max="200" size="sm" />
              </div>

              <!-- Blur -->
              <div class="space-y-2">
                <div class="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted">
                  <span>Blur</span>
                  <span>{{ blur }}px</span>
                </div>
                <USlider v-model="blur" :min="0" :max="20" size="sm" />
              </div>

              <!-- Grayscale -->
              <div class="space-y-2">
                <div class="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted">
                  <span>Grayscale</span>
                  <span>{{ grayscale }}%</span>
                </div>
                <USlider v-model="grayscale" :min="0" :max="100" size="sm" />
              </div>

              <!-- Sepia -->
              <div class="space-y-2">
                <div class="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted">
                  <span>Sepia</span>
                  <span>{{ sepia }}%</span>
                </div>
                <USlider v-model="sepia" :min="0" :max="100" size="sm" />
              </div>

              <!-- Hue Rotate -->
              <div class="space-y-2">
                <div class="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted">
                  <span>Hue</span>
                  <span>{{ hueRotate }}°</span>
                </div>
                <USlider v-model="hueRotate" :min="0" :max="360" size="sm" />
              </div>

              <!-- Advanced Section -->
              <div class="pt-4 border-t border-muted space-y-4">
                <div class="text-[10px] font-bold uppercase tracking-widest text-primary/70">
                  Advanced Adjustments
                </div>

                <div class="space-y-2">
                  <div class="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted">
                    <span>Exposure</span>
                    <span>{{ exposure > 0 ? '+' : '' }}{{ exposure }}</span>
                  </div>
                  <USlider v-model="exposure" :min="-100" :max="100" size="sm" />
                </div>

                <div class="space-y-2">
                  <div class="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted">
                    <span>Highlights</span>
                    <span>{{ highlights > 0 ? '+' : '' }}{{ highlights }}</span>
                  </div>
                  <USlider v-model="highlights" :min="-100" :max="100" size="sm" />
                </div>

                <div class="space-y-2">
                  <div class="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted">
                    <span>Shadows</span>
                    <span>{{ shadows > 0 ? '+' : '' }}{{ shadows }}</span>
                  </div>
                  <USlider v-model="shadows" :min="-100" :max="100" size="sm" />
                </div>

                <div class="space-y-2">
                  <div class="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted">
                    <span>Vibrance</span>
                    <span>{{ vibrance > 0 ? '+' : '' }}{{ vibrance }}</span>
                  </div>
                  <USlider v-model="vibrance" :min="-100" :max="100" size="sm" />
                </div>

                <div class="space-y-2">
                  <div class="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted">
                    <span>Temperature</span>
                    <span>{{ temperature > 0 ? 'Warm' : 'Cool' }} ({{ temperature }})</span>
                  </div>
                  <USlider v-model="temperature" :min="-100" :max="100" size="sm" />
                </div>
              </div>

              <!-- Reset -->
              <UButton
                label="Reset All"
                icon="i-lucide-rotate-ccw"
                color="neutral"
                variant="subtle"
                size="sm"
                block
                @click="reset" />
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
                :label="isWorkerProcessing ? 'Processing...' : 'Download Image'"
                :icon="isWorkerProcessing ? 'i-lucide-loader-2' : 'i-lucide-download'"
                :loading="isWorkerProcessing"
                color="primary"
                size="lg"
                block
                @click="downloadImage" />
            </div>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

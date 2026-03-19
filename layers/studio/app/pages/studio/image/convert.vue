<script lang="ts" setup>
import { useObjectUrl } from '@vueuse/core'
import { shallowRef } from 'vue'

const img = ref('https://images.pexels.com/photos/4323307/pexels-photo-4323307.jpeg')
const imageUrl = ref('')
const fileInputRef = ref<HTMLInputElement>()
const originalImageRef = ref<HTMLImageElement | null>(null)

const uploadedFile = shallowRef<File | null>(null)
const objectUrl = useObjectUrl(uploadedFile)

const {
  outputFormat,
  quality,
  originalFormat,
  convertedBlob,
  setSource,
  getFormatLabel,
  formats,
} = useImageConvert()

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file && file.type.startsWith('image/')) {
    uploadedFile.value = file
  }
}

watch(objectUrl, url => {
  if (url) {
    img.value = url
  }
})

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

const onImageLoad = async () => {
  if (!originalImageRef.value) return

  let mimeType = originalFormat.value
  if (!mimeType) {
    if (img.value.startsWith('blob:') || img.value.startsWith('http')) {
      try {
        const response = await fetch(img.value)
        const blob = await response.blob()
        mimeType = blob.type
      }
      catch {
        mimeType = 'image/jpeg'
      }
    }
    else {
      mimeType = 'image/jpeg'
    }
  }

  setSource(originalImageRef.value, mimeType)
}

const downloadImage = () => {
  if (!convertedBlob.value) return
  const format = formats.find(f => f.value === outputFormat.value)
  downloadBlob(convertedBlob.value, `converted-image.${format?.ext || 'png'}`)
}
</script>

<template>
  <UDashboardPanel>
    <template #body>
      <!-- Header -->
      <div class="mb-8 text-center">
        <h1 class="text-3xl font-bold tracking-tight text-highlighted mb-2">
          Format Converter
        </h1>
        <p class="text-muted text-sm">
          Convert images between PNG, JPEG, and WebP formats
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
                @load="onImageLoad">
            </div>
          </div>

          <!-- Conversion Info -->
          <div class="mt-4 p-6 bg-elevated rounded-xl border border-muted">
            <div class="flex items-center justify-center gap-4">
              <div class="text-center">
                <div class="text-xs text-muted mb-1">
                  From
                </div>
                <div class="text-2xl font-bold text-highlighted">
                  {{ getFormatLabel(originalFormat) }}
                </div>
              </div>

              <svg class="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>

              <div class="text-center">
                <div class="text-xs text-muted mb-1">
                  To
                </div>
                <div class="text-2xl font-bold text-primary">
                  {{ getFormatLabel(outputFormat) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Controls -->
        <div class="space-y-6">
          <!-- Output Format -->
          <div
            class="rounded-xl overflow-hidden border border-muted shadow-sm bg-elevated">
            <div class="px-4 py-3 bg-muted border-b border-muted">
              <h3 class="text-sm font-semibold text-default">
                Convert To
              </h3>
            </div>

            <div class="p-4 space-y-2">
              <div
                v-for="format in formats"
                :key="format.value"
                class="flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors"
                :class="outputFormat === format.value
                  ? 'bg-info/10 border-info/30'
                  : 'border-muted hover:bg-muted'"
                @click="outputFormat = format.value as any">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-lg">{{ format.icon }}</span>
                    <span class="text-sm font-semibold text-highlighted">{{
                      format.label }}</span>
                  </div>
                  <div class="text-xs text-muted dark:text-muted">
                    {{ format.description }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Quality (for JPEG and WebP) -->
          <div
            v-if="outputFormat !== 'image/png'"
            class="rounded-xl overflow-hidden border border-muted shadow-sm bg-elevated">
            <div class="px-4 py-3 bg-muted border-b border-muted">
              <h3 class="text-sm font-semibold text-default">
                Quality Settings
              </h3>
            </div>

            <div class="p-4 space-y-4">
              <div class="space-y-2">
                <div class="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted">
                  <span>Quality</span>
                  <span>{{ quality }}%</span>
                </div>
                <USlider v-model="quality" :min="1" :max="100" size="sm" />
                <div class="flex justify-between text-[10px] text-muted mt-1">
                  <span>Smaller</span>
                  <span>Better</span>
                </div>
              </div>

              <div class="flex gap-2">
                <UButton
                  label="Low"
                  size="sm"
                  class="flex-1 justify-center"
                  color="neutral"
                  :variant="quality === 60 ? 'soft' : 'outline'"
                  @click="quality = 60" />
                <UButton
                  label="Medium"
                  size="sm"
                  class="flex-1 justify-center"
                  color="neutral"
                  :variant="quality === 80 ? 'soft' : 'outline'"
                  @click="quality = 80" />
                <UButton
                  label="High"
                  size="sm"
                  class="flex-1 justify-center"
                  color="neutral"
                  :variant="quality === 92 ? 'soft' : 'outline'"
                  @click="quality = 92" />
              </div>
            </div>
          </div>

          <!-- Format Info -->
          <div
            class="rounded-xl overflow-hidden border border-info/30 shadow-sm bg-info/10">
            <div class="p-4">
              <h4 class="text-xs font-semibold text-info mb-2">
                Format Guide
              </h4>
              <ul class="text-xs text-info/80 space-y-1">
                <li>• PNG: Lossless, best for graphics & logos</li>
                <li>• JPEG: Lossy, best for photos</li>
                <li>• WebP: Modern, smaller than JPEG/PNG</li>
                <li>• PNG supports transparency</li>
              </ul>
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
                :label="`Download ${getFormatLabel(outputFormat)}`"
                icon="i-lucide-download"
                color="primary"
                size="lg"
                class="w-full justify-center"
                :disabled="!convertedBlob"
                @click="downloadImage" />
            </div>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

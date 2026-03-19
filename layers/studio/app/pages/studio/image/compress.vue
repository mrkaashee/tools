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
  quality,
  format,
  originalSize,
  compressedSize,
  compressedBlob,
  compressedImageUrl,
  compressionRatio,
  isCompressing,
  setSource,
} = useImageCompress()

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
      // Create object URL from blob to avoid CORS issues
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

  // Get original size if not set (for initial or URL loads)
  if (img.value.startsWith('blob:') || img.value.startsWith('http')) {
    try {
      const response = await fetch(img.value)
      const blob = await response.blob()
      setSource(originalImageRef.value, blob.size)
    }
    catch {
      setSource(originalImageRef.value, 0)
    }
  }
  else {
    // Data URL
    const sizeInBytes = Math.round((img.value.length * 3) / 4)
    setSource(originalImageRef.value, sizeInBytes)
  }
}

const downloadImage = () => {
  if (!compressedBlob.value) return
  const ext = format.value.split('/')[1]
  downloadBlob(compressedBlob.value, `compressed-image.${ext}`)
}
</script>

<template>
  <UDashboardPanel>
    <template #body>
      <!-- Header -->
      <div class="mb-8 text-center">
        <h1 class="text-3xl font-bold tracking-tight text-highlighted mb-2">
          Compress Image
        </h1>
        <p class="text-muted dark:text-muted text-sm">
          Reduce file size while maintaining quality
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
            <div class="px-4 py-3 bg-muted border-b border-muted flex items-center justify-between">
              <h3 class="text-sm font-semibold text-default">
                Image Comparison
              </h3>
              <div class="flex gap-2">
                <UBadge
                  v-if="compressedBlob"
                  color="neutral"
                  variant="subtle"
                  size="xs">
                  Original (Left)
                </UBadge>
                <UBadge
                  v-if="compressedBlob"
                  color="primary"
                  variant="subtle"
                  size="xs">
                  Compressed (Right)
                </UBadge>
              </div>
            </div>
            <div class="relative h-125 flex items-center justify-center p-4">
              <!-- Grid background for transparent images -->
              <div
                class="absolute inset-0 z-0 opacity-10"
                style="background-image: linear-gradient(45deg, #808080 25%, transparent 25%), linear-gradient(-45deg, #808080 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #808080 75%), linear-gradient(-45deg, transparent 75%, #808080 75%); background-size: 20px 20px; background-position: 0 0, 0 10px, 10px -10px, -10px 0px;" />

              <img
                ref="originalImageRef"
                :src="img"
                crossorigin="anonymous"
                class="hidden"
                alt="Hidden Original Source"
                @load="onImageLoad">

              <ImgCompare
                v-if="compressedImageUrl"
                :before="img"
                :after="compressedImageUrl"
                before-label="Original"
                after-label="Compressed"
                class="z-10 shadow-2xl" />
              <img
                v-else
                :src="img"
                class="max-w-full max-h-full object-contain relative z-10"
                alt="Preview">
            </div>
          </div>

          <!-- Compression Stats -->
          <div v-if="originalSize > 0" class="mt-4 grid grid-cols-3 gap-4">
            <div class="p-4 bg-elevated rounded-lg border border-muted">
              <div class="text-xs text-muted dark:text-muted mb-1">
                Original
              </div>
              <div class="text-lg font-semibold text-highlighted">
                {{ formatBytes(originalSize) }}
              </div>
            </div>
            <div class="p-4 bg-elevated rounded-lg border border-primary ring-1 ring-primary/30">
              <div class="text-xs text-muted dark:text-muted mb-1 flex items-center gap-2">
                Compressed
                <UIcon v-if="isCompressing" name="i-lucide-loader-2" class="animate-spin text-primary" />
              </div>
              <div class="text-lg font-semibold text-primary">
                <template v-if="isCompressing">
                  <span class="animate-pulse opacity-50">Processing...</span>
                </template>
                <template v-else>
                  {{ formatBytes(compressedSize) }}
                </template>
              </div>
            </div>
            <div class="p-4 bg-elevated rounded-lg border border-muted">
              <div class="text-xs text-muted mb-1">
                Saved
              </div>
              <div class="text-lg font-semibold text-success">
                {{ isCompressing ? '-' : compressionRatio + '%' }}
              </div>
            </div>
          </div>
        </div>

        <!-- Controls -->
        <div class="space-y-6">
          <!-- Format Selection -->
          <div
            class="rounded-xl overflow-hidden border border-muted shadow-sm bg-elevated">
            <div class="px-4 py-3 bg-muted border-b border-muted">
              <h3 class="text-sm font-semibold text-default">
                Output Format
              </h3>
            </div>

            <div class="p-4 space-y-2">
              <div
                class="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors"
                :class="format === 'image/jpeg'
                  ? 'bg-info/10 border-info/30'
                  : 'border-muted hover:bg-muted'"
                @click="format = 'image/jpeg'">
                <div class="flex-1">
                  <div class="text-sm font-medium text-highlighted flex items-center gap-2">
                    <span class="i-lucide-baseline" /> JPEG
                  </div>
                  <div class="text-xs text-muted dark:text-muted">
                    Best for photos
                  </div>
                </div>
              </div>

              <div
                class="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors"
                :class="format === 'image/png'
                  ? 'bg-info/10 border-info/30'
                  : 'border-muted hover:bg-muted'"
                @click="format = 'image/png'">
                <div class="flex-1">
                  <div class="text-sm font-medium text-highlighted flex items-center gap-2">
                    <span class="i-lucide-image" /> PNG
                  </div>
                  <div class="text-xs text-muted dark:text-muted">
                    Lossless, transparency
                  </div>
                </div>
              </div>

              <div
                class="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors"
                :class="format === 'image/webp'
                  ? 'bg-info/10 border-info/30'
                  : 'border-muted hover:bg-muted'"
                @click="format = 'image/webp'">
                <div class="flex-1">
                  <div class="text-sm font-medium text-highlighted flex items-center gap-2">
                    <span class="i-lucide-globe" /> WebP
                  </div>
                  <div class="text-xs text-muted dark:text-muted">
                    Modern, efficient
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Quality Slider -->
          <div
            class="rounded-xl overflow-hidden border border-muted shadow-sm bg-elevated">
            <div class="px-4 py-3 bg-muted border-b border-muted">
              <h3 class="text-sm font-semibold text-default">
                Quality
              </h3>
            </div>

            <div class="p-4 space-y-4">
              <div class="space-y-2">
                <div class="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted">
                  <span>Compression Quality</span>
                  <span>{{ quality }}%</span>
                </div>
                <USlider v-model="quality" :min="1" :max="100" size="sm" />
                <div class="flex justify-between text-[10px] text-muted mt-1">
                  <span>Lower size</span>
                  <span>Higher quality</span>
                </div>
              </div>

              <!-- Quality Presets -->
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

          <!-- Info -->
          <div
            class="rounded-xl overflow-hidden border border-info/30 shadow-sm bg-info/10">
            <div class="p-4">
              <h4 class="text-xs font-semibold text-info mb-2">
                Compression Tips
              </h4>
              <ul class="text-xs text-info/80 space-y-1">
                <li>• JPEG: Best for photos, lossy compression</li>
                <li>• PNG: Lossless, supports transparency</li>
                <li>• WebP: Modern format, smaller files</li>
                <li>• Quality 80-92% is usually optimal</li>
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
                label="Download Compressed"
                icon="i-lucide-download"
                color="primary"
                size="lg"
                class="w-full justify-center"
                :disabled="!compressedBlob"
                @click="downloadImage" />
            </div>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

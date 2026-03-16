<script lang="ts" setup>
const {
  quality,
  format,
  originalSize,
  compressedSize,
  compressedBlob,
  compressedImageUrl,
  isCompressing,
  compressionRatio,
  setSource,
} = useImageCompress()

const sourceImgRef = ref<HTMLImageElement | null>(null)

const onImageLoad = (event: Event, fileSize?: number) => {
  if (sourceImgRef.value) {
    setSource(sourceImgRef.value, fileSize || 0)
  }
}

const downloadImage = () => {
  if (!compressedBlob.value) return
  const url = URL.createObjectURL(compressedBlob.value)
  const a = document.createElement('a')
  a.href = url

  // Extension based on format
  const extMap: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp'
  }
  const ext = extMap[format.value] || '.jpg'

  a.download = `optimized-image${ext}`
  a.click()
  URL.revokeObjectURL(url)
}

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>

<template>
  <ImgToolPage
    title="Image Compressor"
    description="Optimize and reduce the file size of your images without losing quality."
    icon="i-lucide-shrink">
    <template #default="{ img, fileSize }">
      <div class="relative w-full h-full flex items-center justify-center p-8 overflow-hidden">
        <!-- Source image (hidden) -->
        <img
          ref="sourceImgRef"
          :src="img"
          class="hidden"
          @load="onImageLoad($event, fileSize)">

        <!-- Live Preview (Active result) -->
        <img
          v-if="compressedImageUrl"
          :src="compressedImageUrl"
          class="max-w-full max-h-full object-contain shadow-2xl transition-all duration-300"
          :class="{ 'opacity-50 grayscale pointer-events-none scale-95': isCompressing }">
        <img
          v-else
          :src="img"
          class="max-w-full max-h-full object-contain shadow-2xl">

        <!-- Status Toast -->
        <Transition
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="transform translate-y-4 opacity-0"
          enter-to-class="transform translate-y-0 opacity-100"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="transform translate-y-0 opacity-100"
          leave-to-class="transform translate-y-4 opacity-0">
          <div v-if="compressedImageUrl" class="absolute top-4 right-4 bg-inverted/20 border border-muted/20 backdrop-blur-xl px-4 py-2 rounded-full flex items-center gap-2 text-[10px] font-bold tracking-wider uppercase">
            <UIcon :name="isCompressing ? 'i-lucide-loader-2' : 'i-lucide-zap'" :class="{ 'animate-spin': isCompressing, 'text-primary': !isCompressing }" />
            {{ isCompressing ? 'Optimizing...' : 'Previewing Result' }}
          </div>
        </Transition>
      </div>
    </template>

    <template #actions>
      <UButton
        label="Download Optimized Image"
        icon="i-lucide-download"
        :disabled="!compressedBlob"
        @click="downloadImage" />
    </template>

    <template #sidebar>
      <div class="bg-elevated p-6 rounded-xl border border-muted space-y-4">
        <h3 class="font-semibold text-sm">
          Compression Level ({{ quality }}%)
        </h3>
        <USlider v-model="quality" :min="1" :max="100" />
        <div class="flex justify-between text-[11px] text-muted">
          <span>Smaller</span>
          <span>Better Quality</span>
        </div>
      </div>

      <div class="bg-elevated p-6 rounded-xl border border-muted space-y-4">
        <h3 class="font-semibold text-sm">
          Output Format
        </h3>
        <USelect
          v-model="format"
          :items="[
            { label: 'JPEG (Recommended)', value: 'image/jpeg' },
            { label: 'WebP (Ultra Efficient)', value: 'image/webp' },
            { label: 'PNG (Lossless)', value: 'image/png' },
          ]"
          value-attribute="value" />
      </div>

      <div class="bg-elevated p-6 rounded-xl border border-muted space-y-4">
        <h3 class="font-semibold text-sm">
          Results
        </h3>
        <div class="space-y-3">
          <div class="flex justify-between text-sm">
            <span class="text-muted">Original:</span>
            <span class="font-medium">{{ formatSize(originalSize) }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-muted">Compressed:</span>
            <span class="font-medium text-primary">{{ formatSize(compressedSize) }}</span>
          </div>
          <div class="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              class="h-full bg-primary transition-all duration-500"
              :style="{ width: `${compressionRatio}%` }" />
          </div>
          <p class="text-center text-xs text-primary font-bold">
            Reduced by {{ compressionRatio }}%
          </p>
        </div>
      </div>
    </template>
  </ImgToolPage>
</template>

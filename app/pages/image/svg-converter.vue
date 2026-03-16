<script lang="ts" setup>
const {
  setSource,
  convertedBlob,
  convertedImageUrl,
  isConverting,
} = useImageConvert()

const sourceImgRef = ref<HTMLImageElement | null>(null)

const onImageLoad = (fileType: string) => {
  if (sourceImgRef.value) {
    setSource(sourceImgRef.value, fileType || 'image/svg+xml')
  }
}

const downloadImage = () => {
  if (!convertedBlob.value) return
  const url = URL.createObjectURL(convertedBlob.value)
  const a = document.createElement('a')
  a.href = url
  a.download = 'converted-svg.png'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <ImgToolPage
    title="SVG to PNG Converter"
    description="High-quality conversion of SVG vector files to PNG images."
    icon="i-lucide-file-image">
    <template #default="{ img, fileType }">
      <div class="relative w-full h-full flex items-center justify-center p-8 overflow-auto">
        <!-- Hidden Source -->
        <img
          ref="sourceImgRef"
          :src="img"
          class="hidden"
          @load="onImageLoad(fileType)">

        <!-- Live Result Preview -->
        <img
          v-if="convertedImageUrl"
          :src="convertedImageUrl"
          class="max-w-full max-h-full object-contain shadow-2xl transition-all duration-300"
          :class="{ 'opacity-50 grayscale pointer-events-none scale-95': isConverting }">
        <img
          v-else
          :src="img"
          class="max-w-full max-h-full object-contain shadow-2xl bg-white p-4 rounded-lg">

        <!-- Status Toast -->
        <Transition
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="transform translate-y-4 opacity-0"
          enter-to-class="transform translate-y-0 opacity-100"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="transform translate-y-0 opacity-100"
          leave-to-class="transform translate-y-4 opacity-0">
          <div v-if="convertedImageUrl" class="absolute top-4 right-4 bg-inverted/20 border border-muted/20 backdrop-blur-xl px-4 py-2 rounded-full flex items-center gap-2 text-[10px] font-bold tracking-wider uppercase">
            <UIcon :name="isConverting ? 'i-lucide-loader-2' : 'i-lucide-zap'" :class="{ 'animate-spin': isConverting, 'text-primary': !isConverting }" />
            {{ isConverting ? 'Rendering...' : 'PNG Preview' }}
          </div>
        </Transition>
      </div>
    </template>

    <template #actions>
      <UButton
        label="Download PNG"
        icon="i-lucide-download"
        :disabled="!convertedBlob || isConverting"
        :loading="isConverting"
        @click="downloadImage" />
    </template>

    <template #sidebar>
      <div class="bg-elevated p-6 rounded-xl border border-muted space-y-4">
        <h3 class="font-semibold text-sm">
          About SVG Conversion
        </h3>
        <p class="text-xs text-muted leading-relaxed">
          Vector images (SVG) are mathematically defined and can be scaled infinitely. This tool renders your SVG onto a high-resolution canvas to generate a pixel-perfect PNG image.
        </p>
      </div>

      <div class="p-6 rounded-xl space-y-2 bg-info/5 border border-info/20 text-xs text-info/80">
        <p class="font-semibold text-info flex items-center gap-1">
          <UIcon name="i-lucide-info" />
          Pro Tip
        </p>
        <p>
          Need a specific size? Use our <NuxtLink to="/image/resizer" class="text-info underline">Image Resizer</NuxtLink> after converting to PNG.
        </p>
      </div>
    </template>
  </ImgToolPage>
</template>

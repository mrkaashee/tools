<script lang="ts" setup>
const {
  outputFormat,
  quality,
  convertedBlob,
  convertedImageUrl,
  isConverting,
  setSource,
  formats,
} = useImageConvert()

const sourceImgRef = ref<HTMLImageElement | null>(null)

const onImageLoad = (event: Event, fileType?: string) => {
  if (sourceImgRef.value) {
    setSource(sourceImgRef.value, fileType || 'image/jpeg')
  }
}

const downloadImage = () => {
  if (!convertedBlob.value) return
  const format = formats.find(f => f.value === outputFormat.value)
  const url = URL.createObjectURL(convertedBlob.value)
  const a = document.createElement('a')
  a.href = url
  a.download = `converted-image.${format?.ext || 'png'}`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <ImgToolPage
    title="Format Converter"
    description="Convert images between PNG, JPEG, and WebP formats instantly."
    icon="i-lucide-refresh-ccw">
    <template #default="{ img, fileType }">
      <div class="relative w-full h-full flex items-center justify-center p-8 overflow-hidden">
        <!-- Source image (hidden) -->
        <img
          ref="sourceImgRef"
          :src="img"
          class="hidden"
          @load="onImageLoad($event, fileType)">

        <!-- Live Preview -->
        <img
          v-if="convertedImageUrl"
          :src="convertedImageUrl"
          class="max-w-full max-h-full object-contain shadow-2xl transition-all duration-300"
          :class="{ 'opacity-50 grayscale pointer-events-none scale-95': isConverting }">
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
          <div v-if="convertedImageUrl" class="absolute top-4 right-4 bg-inverted/20 border border-muted/20 backdrop-blur-xl px-4 py-2 rounded-full flex items-center gap-2 text-[10px] font-bold tracking-wider uppercase">
            <UIcon :name="isConverting ? 'i-lucide-loader-2' : 'i-lucide-refresh-ccw'" :class="{ 'animate-spin': isConverting, 'text-primary': !isConverting }" />
            {{ isConverting ? 'Converting...' : 'Converted Result' }}
          </div>
        </Transition>
      </div>
    </template>

    <template #actions>
      <UButton
        label="Download Result"
        icon="i-lucide-download"
        :disabled="!convertedBlob"
        @click="downloadImage" />
    </template>

    <template #sidebar>
      <div class=" p-6 rounded-xl border border-muted space-y-4">
        <h3 class="font-semibold text-sm">
          Convert To
        </h3>
        <div class="space-y-2">
          <UButton
            v-for="format in formats"
            :key="format.value"
            block
            color="neutral"
            :variant="outputFormat === format.value ? 'subtle' : 'soft'"
            class="justify-start text-left h-auto py-3"
            @click="outputFormat = (format.value as any)">
            <div class="flex items-center gap-3">
              <span class="text-xl">{{ format.icon }}</span>
              <div class="flex flex-col">
                <span class="font-medium text-highlighted">{{ format.label }}</span>
                <span class="text-[10px] text-muted">{{ format.description }}</span>
              </div>
            </div>
          </UButton>
        </div>
      </div>

      <div v-if="outputFormat !== 'image/png'" class="bg-elevated p-6 rounded-xl border border-muted space-y-4">
        <h3 class="font-semibold text-sm">
          Quality Settings ({{ quality }}%)
        </h3>
        <USlider v-model="quality" :min="1" :max="100" />
      </div>

      <div class="p-6 rounded-xl border text-xs text-info/80 space-y-2 bg-info/5 border-info/20">
        <p class="font-semibold text-info flex items-center gap-1">
          <UIcon name="i-lucide-info" />
          Format Guide
        </p>
        <ul class="list-disc pl-4 space-y-1">
          <li>PNG: Best for logos & transparent images</li>
          <li>JPEG: Best for photos & smaller sizes</li>
          <li>WebP: Modern, ultra-efficient compression</li>
        </ul>
      </div>
    </template>
  </ImgToolPage>
</template>

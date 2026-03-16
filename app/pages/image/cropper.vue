<script lang="ts" setup>
const cropperRef = ref()
const cropResult = ref<{
  x: number
  y: number
  width: number
  height: number
} | null>(null)

const selectedRatio = ref(0)
const ratioOptions = [
  { label: 'Custom/Free', value: 0 },
  { label: 'Square (1:1)', value: 1 },
  { label: 'Standard (4:3)', value: 4 / 3 },
  { label: 'Widescreen (16:9)', value: 16 / 9 },
  { label: 'Portrait (9:16)', value: 9 / 16 },
]

const handleCropChange = (result: {
  x: number
  y: number
  width: number
  height: number
}) => {
  cropResult.value = result
}

const downloadResult = async () => {
  const canvas = cropperRef.value?.getCanvas()
  if (canvas) {
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = 'cropped-image.png'
    a.click()
  }
}
</script>

<template>
  <ImgToolPage
    title="Image Cropper"
    description="Crop your images to any aspect ratio with precision and ease."
    icon="i-lucide-crop">
    <template #default="{ img }">
      <ClientOnly>
        <Cropper
          ref="cropperRef"
          class="absolute inset-0 h-full w-full"
          :src="img"
          mode="move-box"
          :aspect-ratio="selectedRatio"
          :enable-zoom="true"
          :show-zoom-controls="true"
          @change="handleCropChange" />
      </ClientOnly>
    </template>

    <template #actions>
      <div class="flex gap-2">
        <UButton
          label="Download Result"
          icon="i-lucide-download"
          @click="downloadResult" />
      </div>
    </template>

    <template #sidebar>
      <div class="bg-elevated p-6 rounded-xl border border-muted space-y-4">
        <h3 class="font-semibold flex items-center gap-2">
          <UIcon name="i-lucide-settings-2" />
          Aspect Ratio
        </h3>
        <USelect
          v-model="selectedRatio"
          placeholder="Select aspect ratio"
          :items="ratioOptions"
          size="lg" />
      </div>

      <div v-if="cropResult" class="bg-elevated p-6 rounded-xl border border-muted space-y-4">
        <h3 class="font-semibold flex items-center gap-2">
          <UIcon name="i-lucide-info" />
          Selection Details
        </h3>
        <div class="grid grid-cols-2 gap-4 text-sm text-muted">
          <div>X: <span class="text-default">{{ Math.round(cropResult.x) }}px</span></div>
          <div>Y: <span class="text-default">{{ Math.round(cropResult.y) }}px</span></div>
          <div>Width: <span class="text-default">{{ Math.round(cropResult.width) }}px</span></div>
          <div>Height: <span class="text-default">{{ Math.round(cropResult.height) }}px</span></div>
        </div>
      </div>
    </template>
  </ImgToolPage>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import type { AspectPreset, CropResult, StudioTool, CropConfig } from '~/components/img/types'
import ImgStudio from '~/components/img/ImgStudio.client.vue'

// 0. Playground State
const playgroundHighResSrc = ref('https://picsum.photos/id/10/800/600')
const playgroundSrc = ref('https://picsum.photos/id/10/800/600')
const playgroundActiveTool = ref<StudioTool>('none')
const playgroundCropEnabled = ref(true)
const playgroundCropShape = ref<'rect' | 'round'>('rect')
const playgroundCropFixed = ref(false)
const playgroundCropAspect = ref<string | number | null>(null)
const playgroundZoomEnabled = ref(true)
const playgroundToolbarShow = ref(true)

const playgroundStudioRef = ref<InstanceType<typeof ImgStudio>>()
const playgroundExportFormat = ref('image/jpeg')
const playgroundExportQuality = ref(0.9)

const playgroundImgInfo = ref({ width: 0, height: 0, sizeKb: 0, format: '' })

watch(playgroundHighResSrc, async val => {
  if (typeof window === 'undefined') return
  if (!val) return
  let kb = 0
  let format = 'URL (External)'

  if (val.startsWith('data:')) {
    const parts = val.split(',')
    const header = parts[0] || ''
    const data = parts[1] || ''
    format = header.match(/:(.*?);/)?.[1] || 'unknown'
    kb = (data.length * 0.75) / 1024
  }
  else {
    try {
      const res = await fetch(val, { method: 'HEAD' })
      const cl = res.headers.get('content-length')
      if (cl) kb = parseInt(cl) / 1024
      format = res.headers.get('content-type') || format
    }
    catch {
      kb = 0
    }
  }

  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    playgroundImgInfo.value = {
      width: img.naturalWidth,
      height: img.naturalHeight,
      sizeKb: kb,
      format
    }
  }
  img.src = val
}, { immediate: true })

const playgroundExportSizeKb = ref(0)
const isExportingPreview = ref(false)

watch([playgroundHighResSrc, playgroundExportFormat, playgroundExportQuality], ([src, format, quality]) => {
  if (typeof window === 'undefined') return
  if (!src) {
    playgroundExportSizeKb.value = 0
    playgroundSrc.value = ''
    return
  }

  isExportingPreview.value = true
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    try {
      const c = document.createElement('canvas')
      c.width = img.naturalWidth
      c.height = img.naturalHeight
      const ctx = c.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, 0, 0)
        const dataUrl = c.toDataURL(format as string, quality as number)
        playgroundSrc.value = dataUrl

        const data = dataUrl.split(',')[1] || ''
        playgroundExportSizeKb.value = (data.length * 0.75) / 1024
      }
    }
    catch {
      // Cross-origin restriction fallback
      playgroundExportSizeKb.value = 0
      playgroundSrc.value = src as string
    }
    isExportingPreview.value = false
  }
  img.onerror = () => {
    playgroundExportSizeKb.value = 0
    playgroundSrc.value = src as string
    isExportingPreview.value = false
  }
  img.src = src as string
}, { immediate: true })

const aspectOptions = [
  { label: 'Free (null)', value: null },
  { label: 'Square (1:1)', value: 1 },
  { label: 'Video (16:9)', value: 16 / 9 },
  { label: 'Portrait (9:16)', value: 9 / 16 },
  { label: 'Tailwind (aspect-video)', value: 'aspect-video' },
  { label: 'String (3/2)', value: '3/2' }
]

const playgroundCropConfig = computed<CropConfig | boolean>(() =>
  playgroundCropEnabled.value
    ? {
        shape: playgroundCropShape.value,
        fixed: playgroundCropFixed.value,
        aspect: playgroundCropAspect.value,
        presets: presets
      }
    : false
)

const activeTool2 = ref<StudioTool>('crop')
const activeTool3 = ref<StudioTool>('crop')
const activeTool4 = ref<StudioTool>('crop')
const activeTool5 = ref<StudioTool>('crop')
const activeTool6 = ref<StudioTool>('crop')
const activeTool7 = ref<StudioTool>('crop')
const activeTool8 = ref<StudioTool>('crop')

const src1 = ref('https://picsum.photos/id/237/800/600')
const src2 = ref('https://picsum.photos/id/1015/800/600')
const src3 = ref('https://picsum.photos/id/1025/800/600')
const src4 = ref('https://picsum.photos/id/1035/800/600')
const src6 = ref('https://picsum.photos/id/1045/800/600')
const src7 = ref('https://picsum.photos/id/1055/800/600')
const src8 = ref('https://picsum.photos/id/1065/800/600')

const studio1Ref = ref<InstanceType<typeof ImgStudio>>()

const avatarResult = ref('https://avatars.githubusercontent.com/u/739984?v=4')
const tempAvatarSrc = ref('')
const isAvatarModalOpen = ref(false)
const avatarStudioRef = ref<InstanceType<typeof ImgStudio>>()

const presets: AspectPreset[] = [
  { label: 'Free', value: null },
  { label: 'Square (1:1)', value: 1 },
  { label: 'Video (16:9)', value: 16 / 9 },
  { label: 'Portrait (9:16)', value: 9 / 16 },
  { label: 'Photo (4:3)', value: 4 / 3 }
]

function onCropApply(res: CropResult) {
  console.log('Crop applied')
  console.log('Output data URL:', res.dataUrl.substring(0, 30) + '...')
  console.log('Source Coordinates:', { x: Math.round(res.x), y: Math.round(res.y), width: Math.round(res.width), height: Math.round(res.height) })
  if (res.outWidth && res.outHeight) {
    console.log('Final Output Size:', { width: res.outWidth, height: res.outHeight })
  }
}

async function onAvatarCropApply(res: CropResult) {
  avatarResult.value = res.dataUrl

  if (avatarStudioRef.value) {
    const file = await avatarStudioRef.value.getFile('avatar')
    console.log('Avatar Crop applied! Ready to upload:')
    console.log('Extracted File:', file)
    console.log(`Size: ${file ? Math.round(file.size / 1024) : 0} KB`)
  }

  isAvatarModalOpen.value = false
  tempAvatarSrc.value = ''

  console.log('Source Coordinates:', { x: Math.round(res.x), y: Math.round(res.y), width: Math.round(res.width), height: Math.round(res.height) })
}

function onCropCancel() {
  console.log('Crop cancelled')
}

function onReset() {
  console.log('Studio reset')
}

function onPlaygroundDownload() {
  playgroundStudioRef.value?.downloadImage('playground-export', playgroundExportFormat.value, playgroundExportQuality.value)
}
</script>

<template>
  <UMain>
    <UContainer class="py-10 space-y-6">
      <div>
        <h1 class="text-2xl font-bold mb-2">
          Image Studio Component
        </h1>
        <p class="text-gray-500 mb-6">
          Testing the fresh ImgStudio component root with props, emits, and slots.
        </p>
      </div>
      <!-- 0. Interactive Playground -->
      <UCard :ui="{ body: 'space-y-4' }">
        <h2 class="text-xl font-semibold flex items-center gap-2">
          <UIcon name="i-lucide-flask-conical" class="w-6 h-6 text-primary" />
          0. Interactive Playground
        </h2>

        <UCard :ui="{ body: 'grid grid-cols-2 md:grid-cols-4 gap-4 mb-4' }">
          <UFormField label="Enable Cropper">
            <UCheckbox v-model="playgroundCropEnabled" label="Crop Tool" />
          </UFormField>
          <UFormField label="Shape">
            <USelect v-model="playgroundCropShape" :items="['rect', 'round']" />
          </UFormField>
          <UFormField label="Fixed Cropper">
            <UCheckbox v-model="playgroundCropFixed" label="Fixed Mode" />
          </UFormField>
          <UFormField label="Aspect Ratio">
            <USelect v-model="playgroundCropAspect" :items="aspectOptions" value-key="value" />
          </UFormField>
          <UFormField label="Enable Zoom">
            <UCheckbox v-model="playgroundZoomEnabled" label="Zoom Config" />
          </UFormField>
          <UFormField label="Show Toolbar">
            <UCheckbox v-model="playgroundToolbarShow" label="Sidebar" />
          </UFormField>
        </UCard>

        <div class="grid grid-cols-1 lg:grid-cols-[1fr_250px] gap-6" :class="{ 'opacity-80 pointer-events-none': isExportingPreview }">
          <ImgStudio
            ref="playgroundStudioRef"
            v-model:active-tool="playgroundActiveTool"
            :src="playgroundSrc"
            :crop="playgroundCropConfig"
            :zoom="playgroundZoomEnabled ? { step: 0.1, max: 5 } : false"
            :toolbar="{ show: playgroundToolbarShow, items: ['crop', 'reset'] }"
            @update:src="val => playgroundHighResSrc = val"
            @crop:apply="res => playgroundHighResSrc = res.dataUrl"
            @crop:cancel="onCropCancel"
            @reset="playgroundHighResSrc = 'https://picsum.photos/id/10/800/600'" />

          <UCard>
            <h3 class="font-medium mb-4 flex items-center gap-2">
              <UIcon name="i-lucide-image" class="w-5 h-5" />
              Image Info
            </h3>

            <div class="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg text-sm text-gray-600 dark:text-gray-400 mb-6 space-y-1.5">
              <div class="flex justify-between items-center">
                <span>Dimensions</span>
                <span class="font-medium text-gray-900 dark:text-white">{{ playgroundImgInfo.width }} &times; {{ playgroundImgInfo.height }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span>Format</span>
                <span class="font-medium text-gray-900 dark:text-white truncate max-w-30" :title="playgroundImgInfo.format">{{ playgroundImgInfo.format }}</span>
              </div>
              <div v-if="playgroundImgInfo.sizeKb > 0" class="flex justify-between items-center">
                <span>Est. Size</span>
                <span class="font-medium text-gray-900 dark:text-white">{{ playgroundImgInfo.sizeKb >= 1024 ? (playgroundImgInfo.sizeKb / 1024).toFixed(2) + ' MB' : playgroundImgInfo.sizeKb.toFixed(1) + ' KB' }}</span>
              </div>
            </div>

            <USeparator class="my-6" />

            <h3 class="font-medium mb-4 flex items-center gap-2">
              <UIcon name="i-lucide-download" class="w-5 h-5" />
              Export Options
            </h3>

            <div class="space-y-4">
              <UFormField label="Format">
                <USelect v-model="playgroundExportFormat" :items="['image/jpeg', 'image/png', 'image/webp']" class="w-full" />
              </UFormField>

              <UFormField label="Quality" :hint="playgroundExportQuality.toFixed(1)">
                <USlider
                  v-model="playgroundExportQuality"
                  :min="0.1"
                  :max="1"
                  :step="0.1"
                  class="flex-1"
                  color="primary" />
              </UFormField>

              <div v-if="playgroundExportSizeKb > 0" class="flex justify-between items-center text-sm py-2 px-3 bg-primary-50 dark:bg-primary-900/20 rounded-md text-primary">
                <span>Final Export Size</span>
                <span class="font-bold">{{ playgroundExportSizeKb >= 1024 ? (playgroundExportSizeKb / 1024).toFixed(2) + ' MB' : playgroundExportSizeKb.toFixed(1) + ' KB' }}</span>
              </div>

              <div class="pt-4 mt-2 border-t border-gray-100 dark:border-gray-800">
                <UButton
                  label="Download"
                  color="primary"
                  block
                  icon="i-lucide-download"
                  @click="onPlaygroundDownload" />
              </div>
            </div>
          </UCard>
        </div>
      </UCard>
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <!-- 1. Standard Instance -->
        <div class="space-y-4">
          <h2 class="text-xl font-semibold">
            1. Standard Studio
          </h2>
          <ImgStudio
            ref="studio1Ref"
            v-model:src="src1"
            :crop="{ presets }"
            :zoom="{ step: 0.1, max: 5 }"
            :toolbar="{ show: true, items: ['crop'] }"
            @crop:apply="onCropApply"
            @crop:cancel="onCropCancel"
            @reset="onReset">
            <template #toolbar>
              <div class="text-[0.6rem] text-center text-gray-500 mt-2 mb-1">
                Extras
              </div>
              <UButton icon="i-lucide-wand-2" color="neutral" variant="ghost" square />
              <UButton icon="i-lucide-download" color="neutral" variant="ghost" square @click="studio1Ref?.downloadImage()" />
            </template>
            <template #actions>
              <UButton
                label="Save Standard"
                color="primary"
                variant="solid"
                :disabled="!src1"
                icon="i-lucide-save" />
            </template>
          </ImgStudio>
        </div>

        <!-- 2. Fixed Cropper Instance -->
        <div class="space-y-4">
          <h2 class="text-xl font-semibold">
            2. Fixed 16:9 Cropper
          </h2>
          <ImgStudio
            v-model:src="src2"
            v-model:active-tool="activeTool2"
            :crop="{ aspect: 16 / 9 }"
            :toolbar="{ show: true, items: ['crop'] }"
            @crop:apply="onCropApply"
            @crop:cancel="onCropCancel"
            @reset="onReset">
            <template #actions>
              <UButton
                label="Apply & Save"
                color="primary"
                variant="solid"
                :disabled="!src2"
                icon="i-lucide-check" />
            </template>
          </ImgStudio>
        </div>

        <!-- 3. WhatsApp Profile Picture Style (Draggable) -->
        <div class="space-y-4">
          <h2 class="text-xl font-semibold">
            3. Profile Picture (Draggable)
          </h2>
          <ImgStudio
            v-model:src="src3"
            v-model:active-tool="activeTool3"
            :crop="{ shape: 'round' }"
            :toolbar="{ show: true, items: ['crop'] }"
            @crop:apply="onCropApply"
            @crop:cancel="onCropCancel"
            @reset="onReset">
            <template #actions>
              <UButton
                label="Set Profile Picture"
                color="primary"
                variant="solid"
                :disabled="!src3"
                icon="i-lucide-user" />
            </template>
          </ImgStudio>
        </div>

        <!-- 4. Fixed Circular Cropper (WhatsApp Style) -->
        <div class="space-y-4">
          <h2 class="text-xl font-semibold">
            4. Fixed DP Cropper (WhatsApp)
          </h2>
          <ImgStudio
            v-model:src="src4"
            v-model:active-tool="activeTool4"
            :crop="{ shape: 'round', fixed: true }"
            :toolbar="{ show: true, items: ['crop'] }"
            @crop:apply="onCropApply"
            @crop:cancel="onCropCancel"
            @reset="onReset">
            <template #actions>
              <UButton
                label="Apply Fixed DP"
                color="primary"
                variant="solid"
                :disabled="!src4"
                icon="i-lucide-check-circle" />
            </template>
          </ImgStudio>
        </div>

        <!-- 6. Fixed Square Cropper -->
        <div class="space-y-4">
          <h2 class="text-xl font-semibold">
            6. Fixed Square Cropper
          </h2>
          <ImgStudio
            v-model:src="src6"
            v-model:active-tool="activeTool6"
            :crop="{ aspect: 1, shape: 'rect', fixed: true }"
            :toolbar="{ show: true, items: ['crop'] }"
            @crop:apply="onCropApply"
            @crop:cancel="onCropCancel"
            @reset="onReset" />
        </div>

        <!-- 7. Fixed Banner Cropper -->
        <div class="space-y-4">
          <h2 class="text-xl font-semibold">
            7. Fixed Banner (1200x514)
          </h2>
          <ImgStudio
            v-model:src="src7"
            v-model:active-tool="activeTool7"
            :crop="{ width: 1200, height: 514, shape: 'rect', fixed: true }"
            :toolbar="{ show: true, items: ['crop'] }"
            @crop:apply="onCropApply"
            @crop:cancel="onCropCancel"
            @reset="onReset" />
        </div>

        <!-- 8. Fixed Slider Cropper -->
        <div class="space-y-4">
          <h2 class="text-xl font-semibold">
            8. Fixed Slider (1200x400)
          </h2>
          <ImgStudio
            v-model:src="src8"
            v-model:active-tool="activeTool8"
            :crop="{ width: 1200, height: 400, shape: 'rect', fixed: true }"
            :toolbar="{ show: true, items: ['crop'] }"
            @crop:apply="onCropApply"
            @crop:cancel="onCropCancel"
            @reset="onReset" />
        </div>

        <!-- 5. Avatar Uploader (Modal) -->
        <div class="space-y-4 xl:col-span-2 max-w-2xl mx-auto w-full">
          <h2 class="text-xl font-semibold">
            5. Avatar Uploader (Modal)
          </h2>
          <ImgDropZone
            class="min-h-30! border-dashed!"
            @load="file => { tempAvatarSrc = file; isAvatarModalOpen = true }" />

          <UModal v-model:open="isAvatarModalOpen" title="Crop Profile Picture">
            <template #body>
              <ImgStudio
                ref="avatarStudioRef"
                v-model:src="tempAvatarSrc"
                v-model:active-tool="activeTool5"
                class="h-auto! min-h-0! aspect-square w-full"
                :crop="{ shape: 'round', fixed: true, size: 512 }"
                :export="{ defaultFormat: 'image/webp', quality: 0.9 }"
                :toolbar="{ show: false, items: ['crop', 'apply', 'cancel', 'reset'] }"
                @crop:apply="onAvatarCropApply"
                @crop:cancel="isAvatarModalOpen = false"
                @reset="onReset" />
            </template>
            <template #footer>
              <div class="flex justify-end gap-3">
                <UButton label="Cancel" color="neutral" variant="ghost" @click="isAvatarModalOpen = false" />
                <UButton
                  label="Apply Avatar"
                  color="primary"
                  variant="solid"
                  :disabled="!tempAvatarSrc"
                  icon="i-lucide-check-circle"
                  @click="avatarStudioRef?.applyCrop()" />
              </div>
            </template>
          </UModal>
        </div>
      </div>
    </UContainer>
  </UMain>
</template>

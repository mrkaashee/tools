<script lang="ts" setup>
import { ref, computed } from 'vue'
import type { AspectPreset, CropResult, StudioTool, CropConfig } from '~/components/img/types'
import ImgStudio from '~/components/img/ImgStudio.client.vue'
import ImgDropZone from '~/components/img/ImgDropZone.vue'

const presets: AspectPreset[] = [
  { label: 'Original', value: null },
  { label: 'Square', value: 1 },
  { label: '4:5', value: 0.8 },
  { label: '3:2', value: 1.5 },
  { label: '16:9', value: 16 / 9 }
]

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
const activeTool9 = ref<StudioTool>('crop')
const activeTool10 = ref<StudioTool>('crop')

const src1 = ref('https://picsum.photos/id/237/800/600')
const src2 = ref('https://picsum.photos/id/1015/800/600')
const src3 = ref('https://picsum.photos/id/1025/800/600')
const src4 = ref('https://picsum.photos/id/1035/800/600')
const src6 = ref('https://picsum.photos/id/1045/800/600')
const src7 = ref('https://picsum.photos/id/1055/800/600')
const src8 = ref('https://picsum.photos/id/10/1200/800')
const src10 = ref('')
const coverResult = ref('')
const dropZone10 = ref<InstanceType<typeof ImgDropZone>>()
const coverStudioRef = ref<InstanceType<typeof ImgStudio>>()

const studio1Ref = ref<InstanceType<typeof ImgStudio>>()

const avatarResult = ref('https://avatars.githubusercontent.com/u/739984?v=4')
const tempAvatarSrc = ref('')
const isAvatarModalOpen = ref(false)
const avatarStudioRef = ref<InstanceType<typeof ImgStudio>>()

const tempSquareSrc = ref('')
const isSquareModalOpen = ref(false)
const squareStudioRef = ref<InstanceType<typeof ImgStudio>>()

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

async function onSquareCropApply(_res: CropResult) {
  console.log('Square Crop applied!')
  if (squareStudioRef.value) {
    const file = await squareStudioRef.value.getFile('square')
    console.log('Extracted File:', file)
  }
  isSquareModalOpen.value = false
  tempSquareSrc.value = ''
}

function onCoverCropApply(res: CropResult) {
  coverResult.value = res.dataUrl
  console.log('Cover Photo applied!', res)
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
    <div class="relative py-16 mb-10 overflow-hidden bg-neutral-900 ring-1 ring-white/10">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(var(--color-primary-500),0.15),transparent)] pointer-events-none" />
      <UContainer>
        <div class="max-w-2xl">
          <UBadge
            label="v1.4 Stable"
            variant="subtle"
            color="primary"
            class="mb-4" />
          <h1 class="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
            Image <span class="text-primary-500">Cropper</span>
          </h1>
          <p class="text-lg text-neutral-400 leading-relaxed">
            Crop images to any aspect ratio with precision. Supports freeform, fixed, round, and pixel-exact
            output modes — built for avatars, banners, social assets, and custom cover flows.
          </p>
        </div>
      </UContainer>
    </div>

    <UContainer class="pb-20 space-y-16">
      <!-- 0. Interactive Playground -->
      <section>
        <div class="flex items-center gap-3 mb-6">
          <div class="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/40 text-primary">
            <UIcon
              name="i-lucide-flask-conical"
              class="w-6 h-6" />
          </div>
          <div>
            <h2 class="text-2xl font-bold">
              Interactive Playground
            </h2>
            <p class="text-sm text-neutral-500">
              Customize and test all cropper configurations in real-time.
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
          <div class="space-y-6">
            <UCard
              :ui="{ body: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6' }"
              class="bg-neutral-50/50 dark:bg-neutral-900/50 backdrop-blur-sm border-neutral-200/60 dark:border-neutral-800/60 shadow-sm">
              <UFormField
                label="Enable Cropper"
                description="Toggle crop tool">
                <UCheckbox
                  v-model="playgroundCropEnabled"
                  label="Crop Tool" />
              </UFormField>
              <UFormField
                label="Shape"
                description="Clipper geometry">
                <USelect
                  v-model="playgroundCropShape"
                  :items="['rect', 'round']"
                  class="w-full" />
              </UFormField>
              <UFormField
                label="Fixed Mode"
                description="Lock aspect ratio">
                <UCheckbox
                  v-model="playgroundCropFixed"
                  label="Strict Bounds" />
              </UFormField>
              <UFormField
                label="Aspect Ratio"
                description="Target shape">
                <USelect
                  v-model="playgroundCropAspect"
                  :items="aspectOptions"
                  value-key="value"
                  class="w-full" />
              </UFormField>
              <UFormField
                label="Enable Zoom"
                description="Mouse wheel controls">
                <UCheckbox
                  v-model="playgroundZoomEnabled"
                  label="Dynamic Zoom" />
              </UFormField>
              <UFormField
                label="Show Toolbar"
                description="Tool navigation">
                <UCheckbox
                  v-model="playgroundToolbarShow"
                  label="Sidebar Nav" />
              </UFormField>
            </UCard>

            <div
              class="relative group"
              :class="{ 'opacity-80 grayscale pointer-events-none': isExportingPreview }">
              <ImgStudio
                ref="playgroundStudioRef"
                v-model:active-tool="playgroundActiveTool"
                :src="playgroundSrc"
                :crop="playgroundCropConfig"
                :zoom="playgroundZoomEnabled ? { step: 0.1, max: 5 } : false"
                :toolbar="{ show: playgroundToolbarShow, items: ['crop', 'reset'] }"
                class="rounded-3xl overflow-hidden ring-1 ring-neutral-200 dark:ring-neutral-800 shadow-2xl transition-all duration-500 group-hover:shadow-primary-500/10"
                @update:src="val => playgroundHighResSrc = val"
                @crop:apply="res => playgroundHighResSrc = res.dataUrl"
                @crop:cancel="onCropCancel"
                @reset="playgroundHighResSrc = 'https://picsum.photos/id/10/800/600'" />
            </div>
          </div>

          <aside class="space-y-6">
            <UCard class="sticky top-24 border-primary-200/30 dark:border-primary-800/20 bg-primary-50/5 dark:bg-primary-950/5">
              <div class="space-y-8">
                <div>
                  <h3 class="font-bold text-xs uppercase tracking-widest text-neutral-500 mb-4 flex items-center gap-2">
                    <UIcon
                      name="i-lucide-image"
                      class="w-4 h-4 text-primary" />
                    Source Statistics
                  </h3>
                  <div class="space-y-3">
                    <div class="flex justify-between text-sm">
                      <span class="text-neutral-500">Resolution</span>
                      <span class="font-mono font-bold">{{ playgroundImgInfo.width }}&times;{{ playgroundImgInfo.height }}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span class="text-neutral-500">MIME Type</span>
                      <span class="font-mono text-xs opacity-70 truncate max-w-30">{{ playgroundImgInfo.format }}</span>
                    </div>
                    <div
                      v-if="playgroundImgInfo.sizeKb > 0"
                      class="flex justify-between text-sm">
                      <span class="text-neutral-500">File Size</span>
                      <span class="font-mono">{{ playgroundImgInfo.sizeKb >= 1024 ? (playgroundImgInfo.sizeKb / 1024).toFixed(2) + ' MB' : playgroundImgInfo.sizeKb.toFixed(1) + ' KB' }}</span>
                    </div>
                  </div>
                </div>

                <USeparator :ui="{ border: 'border-neutral-200/50 dark:border-neutral-800/50' }" />

                <div>
                  <h3 class="font-bold text-xs uppercase tracking-widest text-neutral-500 mb-4 flex items-center gap-2">
                    <UIcon
                      name="i-lucide-settings-2"
                      class="w-4 h-4 text-primary" />
                    Export Tuning
                  </h3>
                  <div class="space-y-5">
                    <UFormField label="Output Format">
                      <USelect
                        v-model="playgroundExportFormat"
                        :items="['image/jpeg', 'image/png', 'image/webp']"
                        class="w-full" />
                    </UFormField>
                    <UFormField :label="`Quality (${(playgroundExportQuality * 100).toFixed(0)}%)`">
                      <USlider
                        v-model="playgroundExportQuality"
                        :min="0.1"
                        :max="1"
                        :step="0.1"
                        color="primary" />
                    </UFormField>

                    <div
                      v-if="playgroundExportSizeKb > 0"
                      class="p-4 bg-primary-50 dark:bg-primary-900/10 rounded-xl border border-primary-200/30 dark:border-primary-800/20">
                      <div class="text-[10px] text-primary-600 dark:text-primary-400 uppercase font-black mb-1">
                        Estimated Output Size
                      </div>
                      <div class="text-2xl font-black text-primary-700 dark:text-primary-300">
                        {{ playgroundExportSizeKb >= 1024 ? (playgroundExportSizeKb / 1024).toFixed(2) + ' MB' : playgroundExportSizeKb.toFixed(1) + ' KB' }}
                      </div>
                    </div>

                    <UButton
                      label="Download Final Asset"
                      color="primary"
                      block
                      size="xl"
                      icon="i-lucide-download"
                      class="shadow-xl shadow-primary-500/30 font-bold"
                      @click="onPlaygroundDownload" />
                  </div>
                </div>
              </div>
            </UCard>
          </aside>
        </div>
      </section>

      <!-- Grid Sections -->
      <section class="space-y-24">
        <!-- Section 1: Presets -->
        <div class="border-t border-neutral-100 dark:border-neutral-800 pt-20">
          <div class="mb-12 text-center max-w-2xl mx-auto">
            <UBadge
              label="Precision Tools"
              variant="soft"
              color="primary"
              class="mb-4" />
            <h2 class="text-3xl font-black mb-4 tracking-tight uppercase italic">
              Standard Fixed Formats
            </h2>
            <p class="text-neutral-500 text-lg">
              Rigid aspect controls for automated layout consistency and platform standards.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
            <UCard class="overflow-hidden group hover:scale-[1.01] transition-transform duration-300 border-neutral-200/60 dark:border-neutral-800">
              <template #header>
                <div class="flex items-center justify-between">
                  <h3 class="font-black italic flex items-center gap-2">
                    <UIcon
                      name="i-lucide-layers"
                      class="w-5 h-5 text-primary" />
                    1. Standard Studio
                  </h3>
                  <UBadge
                    label="Freeform"
                    variant="subtle"
                    color="neutral"
                    size="sm" />
                </div>
              </template>
              <ImgStudio
                ref="studio1Ref"
                v-model:src="src1"
                :crop="{ presets }"
                :zoom="{ step: 0.1, max: 5 }"
                :toolbar="{ show: true, items: ['crop'] }"
                class="aspect-video"
                @crop:apply="onCropApply"
                @crop:cancel="onCropCancel"
                @reset="onReset">
                <template #toolbar>
                  <div class="text-[0.6rem] text-center text-gray-400 mt-2 mb-1 uppercase font-black tracking-tighter opacity-50">
                    Addons
                  </div>
                  <UButton
                    icon="i-lucide-wand-2"
                    color="neutral"
                    variant="ghost"
                    square
                    size="xs" />
                  <UButton
                    icon="i-lucide-download"
                    color="neutral"
                    variant="ghost"
                    square
                    size="xs"
                    @click="studio1Ref?.downloadImage()" />
                </template>
              </ImgStudio>
              <template #footer>
                <p class="text-xs text-neutral-400">
                  Features a persistent toolbar and preset library for quick orientation.
                </p>
              </template>
            </UCard>

            <UCard class="overflow-hidden group hover:scale-[1.01] transition-transform duration-300 border-neutral-200/60 dark:border-neutral-800">
              <template #header>
                <div class="flex items-center justify-between">
                  <h3 class="font-black italic flex items-center gap-2">
                    <UIcon
                      name="i-lucide-tv-2"
                      class="w-5 h-5 text-primary" />
                    2. Fixed 16:9 Cinema
                  </h3>
                  <UBadge
                    label="Locked"
                    variant="subtle"
                    color="primary"
                    size="sm" />
                </div>
              </template>
              <ImgStudio
                v-model:src="src2"
                v-model:active-tool="activeTool2"
                :crop="{ aspect: 16 / 9 }"
                :toolbar="{ show: true, items: ['crop'] }"
                class="aspect-video"
                @crop:apply="onCropApply"
                @crop:cancel="onCropCancel"
                @reset="onReset" />
              <template #footer>
                <p class="text-xs text-neutral-400">
                  Strict aspect enforcement prevents stretching or invalid compositions.
                </p>
              </template>
            </UCard>
          </div>
        </div>

        <!-- Section 2: Identity -->
        <div>
          <div class="mb-12 text-center max-w-2xl mx-auto">
            <UBadge
              label="Identity Systems"
              variant="soft"
              color="primary"
              class="mb-4" />
            <h2 class="text-3xl font-black mb-4 tracking-tight uppercase italic">
              Avatars & Circle Masks
            </h2>
            <p class="text-neutral-500 text-lg">
              Optimized flows for user profile management and circular identity branding.
            </p>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
            <UCard class="overflow-hidden border-neutral-200/60 dark:border-neutral-800">
              <template #header>
                <h3 class="font-black italic flex items-center gap-2">
                  <UIcon
                    name="i-lucide-scan-face"
                    class="w-5 h-5 text-primary" />
                  3. Dynamic Round Mask
                </h3>
              </template>
              <ImgStudio
                v-model:src="src3"
                v-model:active-tool="activeTool3"
                :crop="{ shape: 'round' }"
                :toolbar="{ show: true, items: ['crop'] }"
                class="aspect-video"
                @crop:apply="onCropApply"
                @crop:cancel="onCropCancel"
                @reset="onReset" />
              <template #footer>
                <p class="text-xs text-neutral-400">
                  Allows arbitrary resizing while maintaining circular geometry.
                </p>
              </template>
            </UCard>

            <UCard class="overflow-hidden border-neutral-200/60 dark:border-neutral-800">
              <template #header>
                <h3 class="font-black italic flex items-center gap-2">
                  <UIcon
                    name="i-lucide-circle"
                    class="w-5 h-5 text-primary" />
                  4. Strictly Fixed Round
                </h3>
              </template>
              <ImgStudio
                v-model:src="src4"
                v-model:active-tool="activeTool4"
                :crop="{ shape: 'round', fixed: true }"
                :toolbar="{ show: true, items: ['crop'] }"
                class="aspect-video"
                @crop:apply="onCropApply"
                @crop:cancel="onCropCancel"
                @reset="onReset" />
              <template #footer>
                <p class="text-xs text-neutral-400">
                  Perfect for WhatsApp/Telegram style profile selection flows.
                </p>
              </template>
            </UCard>
          </div>
        </div>

        <!-- Section 3: Social & Marketing -->
        <div>
          <div class="mb-12 text-center max-w-2xl mx-auto">
            <UBadge
              label="Asset Creation"
              variant="soft"
              color="primary"
              class="mb-4" />
            <h2 class="text-3xl font-black mb-4 tracking-tight uppercase italic">
              Digital Marketing Formats
            </h2>
            <p class="text-neutral-500 text-lg">
              Precision dimension locking for high-impact social media assets.
            </p>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <UCard class="overflow-hidden border-neutral-200/60 dark:border-neutral-800">
              <template #header>
                <h3 class="font-bold text-[10px] uppercase tracking-[0.2em] text-neutral-400">
                  Instagram Square 1:1
                </h3>
              </template>
              <ImgStudio
                v-model:src="src6"
                v-model:active-tool="activeTool6"
                :crop="{ aspect: 1, shape: 'rect', fixed: true }"
                :toolbar="{ show: true, items: ['crop'] }"
                class="aspect-square"
                @crop:apply="onCropApply"
                @crop:cancel="onCropCancel"
                @reset="onReset" />
            </UCard>

            <UCard class="overflow-hidden border-neutral-200/60 dark:border-neutral-800 md:col-span-2">
              <template #header>
                <h3 class="font-bold text-[10px] uppercase tracking-[0.2em] text-neutral-400">
                  Standard Web Banner (1200x514)
                </h3>
              </template>
              <ImgStudio
                v-model:src="src7"
                v-model:active-tool="activeTool7"
                :crop="{ width: 1200, height: 514, shape: 'rect', fixed: true }"
                :toolbar="{ show: true, items: ['crop'] }"
                class="aspect-1200/514"
                @crop:apply="onCropApply"
                @crop:cancel="onCropCancel"
                @reset="onReset" />
            </UCard>

            <UCard class="overflow-hidden border-neutral-200/60 dark:border-neutral-800 md:col-span-3">
              <template #header>
                <h3 class="font-bold text-[10px] uppercase tracking-[0.2em] text-neutral-400">
                  Hero Slider Cinematic (1200x400)
                </h3>
              </template>
              <ImgStudio
                v-model:src="src8"
                v-model:active-tool="activeTool8"
                :crop="{ width: 1200, height: 400, shape: 'rect', fixed: true }"
                :toolbar="{ show: true, items: ['crop'] }"
                class="aspect-1200/400"
                @crop:apply="onCropApply"
                @crop:cancel="onCropCancel"
                @reset="onReset" />
            </UCard>
          </div>
        </div>

        <!-- Section 4: Modal Flows -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-12 pt-10">
          <div class="space-y-6">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-2xl bg-primary-100 dark:bg-primary-950 text-primary flex items-center justify-center text-xl font-black italic">
                5
              </div>
              <div>
                <h3 class="font-black italic text-xl">
                  Legacy Avatar Flow
                </h3>
                <p class="text-sm text-neutral-500 uppercase font-bold tracking-tighter opacity-70">
                  UModal + ImgStudio
                </p>
              </div>
            </div>
            <UCard class="border-dashed border-2 ring-0 bg-neutral-50/50 dark:bg-neutral-900/10">
              <ImgDropZone
                class="min-h-40! border-none!"
                @load="file => { tempAvatarSrc = file; isAvatarModalOpen = true }" />
            </UCard>
            <div class="flex items-center gap-6 p-4 bg-white dark:bg-neutral-900 rounded-2xl ring-1 ring-neutral-200 dark:ring-neutral-800 shadow-sm">
              <UAvatar
                :src="avatarResult"
                size="3xl"
                class="ring-4 ring-primary-500/10" />
              <div>
                <div class="font-black italic text-lg line-clamp-1">
                  Dynamic Preview
                </div>
                <div class="text-xs text-neutral-400 uppercase tracking-widest font-bold">
                  Updated on Modal Apply
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-6">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-2xl bg-primary-100 dark:bg-primary-950 text-primary flex items-center justify-center text-xl font-black italic">
                9
              </div>
              <div>
                <h3 class="font-black italic text-xl">
                  HD Square Studio
                </h3>
                <p class="text-sm text-neutral-500 uppercase font-bold tracking-tighter opacity-70">
                  High-Precision Canvas Export
                </p>
              </div>
            </div>
            <UCard class="border-dashed border-2 ring-0 bg-neutral-50/50 dark:bg-neutral-900/10">
              <ImgDropZone
                class="min-h-40! border-none!"
                @load="file => { tempSquareSrc = file; isSquareModalOpen = true }" />
            </UCard>
            <p class="text-sm text-neutral-500 pr-10">
              Supports 800x800 raw pixel export. The modal interface ensures a focused environment
              for critical branding tasks without distraction.
            </p>
          </div>
        </div>

        <!-- Section 5: Experimental FB Cover -->
        <div class="pt-10">
          <div class="mb-12 text-center max-w-2xl mx-auto">
            <UBadge
              label="Layout Engine"
              variant="soft"
              color="primary"
              class="mb-4" />
            <h2 class="text-3xl font-black mb-4 tracking-tight uppercase italic">
              10. Immersive Timeline Layout
            </h2>
            <p class="text-neutral-500 text-lg">
              Naked-viewport implementation with absolute boundary pinning and FB-style UI overlay.
            </p>
          </div>

          <UCard
            :ui="{ body: 'p-0 overflow-hidden' }"
            class="max-w-4xl mx-auto ring-1 ring-neutral-200 dark:ring-neutral-800 shadow-2xl rounded-2xl overflow-hidden">
            <div class="p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-white dark:bg-neutral-900 shadow-sm z-10 relative">
              <div class="flex items-center gap-3">
                <UIcon
                  name="i-lucide-chrome"
                  class="w-5 h-5 text-primary" />
                <span class="text-xs font-black uppercase tracking-[0.2em] text-neutral-400">Desktop View Preview (2.7:1)</span>
              </div>
              <div class="flex items-center gap-2">
                <UButton
                  v-if="coverResult"
                  label="Change Photo"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-image"
                  class="rounded-full px-4 font-bold"
                  @click="coverResult = ''; src10 = ''; activeTool10 = 'crop'" />
                <UButton
                  v-if="src10 && !coverResult"
                  label="Confirm Cover"
                  color="primary"
                  variant="solid"
                  icon="i-lucide-check-circle"
                  class="rounded-full px-6 font-bold"
                  @click="coverStudioRef?.applyCrop()" />
              </div>
            </div>

            <div class="w-full aspect-[2.7/1] relative bg-neutral-100 dark:bg-neutral-950 group">
              <ImgDropZone
                v-if="!src10"
                ref="dropZone10"
                class="border-none! h-full w-full flex-col gap-4 cursor-pointer"
                @load="file => src10 = file"
                @click="dropZone10?.openFilePicker()">
                <template #default>
                  <div class="p-4 rounded-full bg-white dark:bg-neutral-900 shadow-lg ring-1 ring-neutral-200 dark:ring-neutral-800">
                    <UIcon
                      name="i-lucide-camera"
                      class="w-8 h-8 opacity-40 text-primary" />
                  </div>
                  <div class="font-black italic opacity-40 uppercase tracking-widest text-sm">
                    Upload Cover Media
                  </div>
                </template>
              </ImgDropZone>

              <!-- Confirmed Result: full-bleed cover -->
              <img
                v-if="coverResult"
                :src="coverResult"
                class="absolute inset-0 w-full h-full object-cover"
                alt="Cover Photo">

              <!-- Cropping State -->
              <ImgStudio
                v-else-if="src10"
                ref="coverStudioRef"
                v-model:src="src10"
                v-model:active-tool="activeTool10"
                class="h-full! w-full! border-none! rounded-none!"
                :crop="{ aspect: 2.7, fixed: true, naked: true, width: 851, height: 315 }"
                :toolbar="{ show: false, items: ['crop', 'apply', 'cancel', 'reset'] }"
                @crop:apply="onCoverCropApply" />

              <!-- Bottom gradient (shown in both states) -->
              <div
                v-if="src10 || coverResult"
                class="absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-black/60 to-transparent pointer-events-none" />
            </div>
          </UCard>
        </div>
      </section>
    </UContainer>

    <!-- Global Modals (Extracted for cleaner logic) -->
    <UModal
      v-model:open="isAvatarModalOpen"
      title="Refine Identity Asset"
      class="sm:max-w-lg"
      :ui="{ body: 'p-0', footer: 'p-4' }">
      <template #body>
        <div class="p-8 bg-neutral-50 dark:bg-neutral-900/50">
          <ImgStudio
            ref="avatarStudioRef"
            v-model:src="tempAvatarSrc"
            v-model:active-tool="activeTool5"
            class="h-auto! min-h-0! aspect-square w-full rounded-3xl overflow-hidden shadow-2xl ring-2 ring-primary-500/20"
            :crop="{ shape: 'round', fixed: true, size: 512 }"
            :export="{ defaultFormat: 'image/webp', quality: 0.9 }"
            :toolbar="{ show: false, items: ['crop'] }"
            @crop:apply="onAvatarCropApply"
            @crop:cancel="isAvatarModalOpen = false"
            @reset="onReset" />
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3 w-full">
          <UButton
            label="Discard"
            color="neutral"
            variant="ghost"
            class="font-bold"
            @click="isAvatarModalOpen = false" />
          <UButton
            label="Save Profile Picture"
            color="primary"
            variant="solid"
            :disabled="!tempAvatarSrc"
            icon="i-lucide-save"
            class="font-black italic px-6"
            @click="avatarStudioRef?.applyCrop()" />
        </div>
      </template>
    </UModal>

    <UModal
      v-model:open="isSquareModalOpen"
      title="Master Square Export"
      class="sm:max-w-xl"
      :ui="{ body: 'p-0', footer: 'p-4' }">
      <template #body>
        <div class="p-8 bg-neutral-50 dark:bg-neutral-900/50">
          <ImgStudio
            ref="squareStudioRef"
            v-model:src="tempSquareSrc"
            v-model:active-tool="activeTool9"
            class="h-auto! min-h-0! aspect-square w-full rounded-3xl overflow-hidden shadow-2xl ring-2 ring-primary-500/20"
            :crop="{ shape: 'rect', aspect: 1, fixed: true, width: 800, height: 800 }"
            :toolbar="{ show: false, items: ['crop'] }"
            @crop:apply="onSquareCropApply"
            @crop:cancel="isSquareModalOpen = false"
            @reset="onReset" />
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3 w-full">
          <UButton
            label="Back"
            color="neutral"
            variant="ghost"
            class="font-bold"
            @click="isSquareModalOpen = false" />
          <UButton
            label="Generate Master"
            color="primary"
            variant="solid"
            :disabled="!tempSquareSrc"
            icon="i-lucide-zap"
            class="font-black italic px-8 shadow-lg shadow-primary-500/20"
            @click="squareStudioRef?.applyCrop()" />
        </div>
      </template>
    </UModal>
  </UMain>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import type { AspectPreset, CropResult, StudioTool, CropConfig } from '~/components/img/types'

// Use standard presets from the image layer components
const presets: AspectPreset[] = [
  { label: 'Original', value: null },
  { label: 'Square', value: 1 },
  { label: 'Vertical (4:5)', value: 0.8 },
  { label: 'Classic (3:2)', value: 1.5 },
  { label: 'Cinema (16:9)', value: 16 / 9 }
]

const src = ref('')
const activeTool = ref<StudioTool>('crop')
const studioRef = ref()

// UI Control State
const cropShape = ref<'rect' | 'round'>('rect')
const cropFixed = ref(false)
const cropAspect = ref<number | null>(null)
const exportFormat = ref('image/jpeg')
const exportQuality = ref(0.9)

// Source Image Stats
const imgInfo = ref({ width: 0, height: 0, sizeKb: 0, format: '' })

watch(src, async val => {
  if (typeof window === 'undefined' || !val) return

  let kb = 0
  let format = 'Unknown'

  if (val.startsWith('data:')) {
    const parts = val.split(',')
    const header = parts[0] || ''
    const data = parts[1] || ''
    format = header.match(/:(.*?);/)?.[1] || 'image/png'
    kb = (data.length * 0.75) / 1024
  }

  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    imgInfo.value = {
      width: img.naturalWidth,
      height: img.naturalHeight,
      sizeKb: kb,
      format
    }
  }
  img.src = val
}, { immediate: true })

const aspectOptions = [
  { label: 'Freeform', value: null },
  { label: 'Square (1:1)', value: 1 },
  { label: 'Video (16:9)', value: 16 / 9 },
  { label: 'Classic (4:3)', value: 4 / 3 },
  { label: 'Portrait (9:16)', value: 9 / 16 }
]

const cropConfig = computed<CropConfig>(() => ({
  shape: cropShape.value,
  fixed: cropFixed.value,
  aspect: cropAspect.value,
  presets
}))

const dropZoneRef = ref()

function onCropApply(res: CropResult) {
  src.value = res.dataUrl
}

function onDownload() {
  studioRef.value?.downloadImage('studio-export', exportFormat.value, exportQuality.value)
}

function onReset() {
  src.value = ''
  imgInfo.value = { width: 0, height: 0, sizeKb: 0, format: '' }
}
</script>

<template>
  <UMain class="min-h-screen bg-slate-50 dark:bg-slate-950">
    <!-- Premium Header -->
    <div class="relative py-20 overflow-hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div class="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
        <div class="relative left-[calc(50%-11rem)] aspect-1155/678 w-144.5 -translate-x-1/2 rotate-30 bg-linear-to-tr from-primary-500 to-blue-500 opacity-20 sm:left-[calc(50%-30rem)] sm:w-288.75" />
      </div>

      <UContainer>
        <div class="max-w-3xl">
          <UBadge
            label="Pro Tool"
            variant="subtle"
            color="primary"
            class="mb-6 rounded-full px-3 py-1" />
          <h1 class="text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6">
            Professional <span class="text-primary-500 italic">Image Cropper</span>
          </h1>
          <p class="text-xl text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
            Precision tools for perfectly framed visuals. Optimized for social media markers, developers, and designers.
          </p>
        </div>
      </UContainer>
    </div>

    <UContainer class="py-12 pb-32">
      <!-- Upload / Edit Interface -->
      <div
        v-if="!src"
        class="max-w-4xl mx-auto">
        <UCard
          class="group overflow-hidden border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-primary-500 transition-colors duration-500 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm"
          :ui="{ body: 'p-12 sm:p-20' }">
          <ImgDropZone
            ref="dropZoneRef"
            class="min-h-100! w-full! border-none! bg-transparent!"
            @load="file => src = file">
            <template #default>
              <div class="flex flex-col items-center text-center">
                <div class="w-20 h-20 rounded-3xl bg-primary-100 dark:bg-primary-950/50 flex items-center justify-center text-primary-500 mb-8 group-hover:scale-110 transition-transform duration-500 group-hover:rotate-6">
                  <UIcon
                    name="i-lucide-cloud-upload"
                    class="w-10 h-10" />
                </div>
                <h2 class="text-3xl font-bold mb-4 tracking-tight">
                  Drop your image here
                </h2>
                <p class="text-slate-500 dark:text-slate-400 max-w-sm mb-10 text-lg">
                  Supports High-Res JPG, PNG, and WebP. Your data stays private and never leaves your browser.
                </p>
                <UButton
                  label="Select File"
                  size="xl"
                  color="primary"
                  class="rounded-2xl px-10 shadow-2xl shadow-primary-500/20 font-bold"
                  icon="i-lucide-image-plus"
                  @click="dropZoneRef?.openFilePicker()" />
              </div>
            </template>
          </ImgDropZone>
        </UCard>

        <!-- Feature Highlights -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          <div class="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <UIcon
              name="i-lucide-maximize"
              class="w-8 h-8 text-primary mb-4" />
            <h3 class="font-bold text-lg mb-2">
              Smart Boundaries
            </h3>
            <p class="text-sm text-slate-500">
              Intelligent snapping ensures your crops are always pixel-perfect and exactly centered.
            </p>
          </div>
          <div class="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <UIcon
              name="i-lucide-zap"
              class="w-8 h-8 text-primary mb-4" />
            <h3 class="font-bold text-lg mb-2">
              Fast Export
            </h3>
            <p class="text-sm text-slate-500">
              Sub-second local processing for instant downloads with custom quality tuning.
            </p>
          </div>
          <div class="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <UIcon
              name="i-lucide-shield-check"
              class="w-8 h-8 text-primary mb-4" />
            <h3 class="font-bold text-lg mb-2">
              Privacy First
            </h3>
            <p class="text-sm text-slate-500">
              All image processing happens locally in your browser. No data is sent to our servers.
            </p>
          </div>
        </div>
      </div>

      <div
        v-else
        class="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12 items-start">
        <!-- Editor View -->
        <div class="space-y-8">
          <div class="flex items-center justify-between mb-4">
            <UButton
              label="Cancel"
              icon="i-lucide-arrow-left"
              variant="ghost"
              color="neutral"
              class="rounded-full px-6 font-bold"
              @click="onReset" />
            <div class="flex items-center gap-2">
              <UBadge
                :label="imgInfo.format.toUpperCase()"
                variant="outline"
                color="neutral" />
              <UBadge
                :label="`${imgInfo.width} × ${imgInfo.height}`"
                variant="soft"
                color="neutral" />
            </div>
          </div>

          <div class="relative group">
            <div class="absolute -inset-1 bg-linear-to-r from-primary-500/20 to-blue-500/20 rounded-4xl blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
            <ImgStudio
              ref="studioRef"
              v-model:active-tool="activeTool"
              :src="src"
              :crop="cropConfig"
              :zoom="{ step: 0.1, max: 5 }"
              class="relative rounded-4xl overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800 bg-slate-100 dark:bg-slate-950 shadow-2xl"
              @crop:apply="onCropApply"
              @reset="onReset" />
          </div>
        </div>

        <!-- Sidebar Actions -->
        <aside class="space-y-8 lg:sticky lg:top-12">
          <UCard class="border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl">
            <template #header>
              <h3 class="font-black italic text-lg flex items-center gap-2">
                <UIcon
                  name="i-lucide-sliders"
                  class="w-5 h-5 text-primary" />
                Dimensions
              </h3>
            </template>
            <div class="space-y-6">
              <UFormField
                label="Shape Geometry"
                description="Select output mask shape">
                <USelect
                  v-model="cropShape"
                  :items="['rect', 'round']"
                  class="w-full" />
              </UFormField>

              <UFormField
                label="Crop Aspect"
                description="Lock output ratio">
                <USelect
                  v-model="cropAspect"
                  :items="aspectOptions"
                  value-key="value"
                  class="w-full" />
              </UFormField>

              <div class="pt-4 flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div class="space-y-0.5">
                  <div class="text-sm font-bold tracking-tight">
                    Lock Ratio
                  </div>
                  <div class="text-xs text-slate-500">
                    Strict mode
                  </div>
                </div>
                <USwitch
                  v-model="cropFixed"
                  color="primary" />
              </div>
            </div>
          </UCard>

          <UCard class="border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl bg-primary-50/10 dark:bg-primary-950/5">
            <template #header>
              <h3 class="font-black italic text-lg flex items-center gap-2">
                <UIcon
                  name="i-lucide-download"
                  class="w-5 h-5 text-primary" />
                Finalize
              </h3>
            </template>
            <div class="space-y-6">
              <UFormField label="Output Format">
                <USelect
                  v-model="exportFormat"
                  :items="['image/jpeg', 'image/png', 'image/webp']" />
              </UFormField>

              <UFormField :label="`Quality (${(exportQuality * 100).toFixed(0)}%)`">
                <USlider
                  v-model="exportQuality"
                  :min="0.1"
                  :max="1"
                  :step="0.1" />
              </UFormField>

              <UButton
                label="Save Result"
                block
                size="xl"
                color="primary"
                class="rounded-2xl py-4 font-black italic shadow-xl shadow-primary-500/20"
                icon="i-lucide-check-circle-2"
                @click="onDownload" />
            </div>
          </UCard>
        </aside>
      </div>
    </UContainer>
  </UMain>
</template>

<style scoped>
.aspect-1200\/514 { aspect-ratio: 1200 / 514; }
.aspect-1200\/400 { aspect-ratio: 1200 / 400; }
</style>

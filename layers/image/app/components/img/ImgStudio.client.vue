<script lang="ts" setup>
import { ref, watch, computed } from 'vue'
import { useStorage, useElementHover } from '@vueuse/core'
import type { CropConfig, CropResult, StudioTool, ToolbarConfig, ZoomConfig, ExportConfig } from './types'
import ImgDropZone from './ImgDropZone.vue'
import ImgToolbar from './ImgToolbar.vue'
import ImgCropper from './ImgCropper.vue'
import { dataUrlToFile, downloadFile } from '~/utils/image'

const props = withDefaults(defineProps<{
  src?: string
  accept?: string
  crop?: boolean | CropConfig
  zoom?: boolean | ZoomConfig
  toolbar?: boolean | ToolbarConfig
  export?: ExportConfig
  disabled?: boolean
}>(), {
  src: '',
  accept: 'image/*',
  crop: true,
  zoom: false,
  toolbar: true,
  disabled: false
})

const emit = defineEmits<{
  'update:src': [dataUrl: string]
  'crop:apply': [result: CropResult]
  'crop:cancel': []
  reset: []
}>()

// --- State ---
const internalSrc = ref(props.src)
const activeTool = defineModel<StudioTool>('activeTool', { default: 'none' })

// Update internal src if prop changes
watch(() => props.src, val => {
  if (val) internalSrc.value = val
})

const normalizedCrop = computed<CropConfig>(() => {
  if (typeof props.crop === 'boolean') return {}
  return props.crop || {}
})

const normalizedZoom = computed<ZoomConfig | false>(() => {
  if (props.zoom === false) return false
  if (props.zoom === true) return {}
  return props.zoom || {}
})

const isCropEnabled = computed(() => !!props.crop)

const normalizedToolbar = computed<ToolbarConfig>(() => {
  const items: StudioTool[] = []
  if (isCropEnabled.value) items.push('crop')

  if (typeof props.toolbar === 'object' && props.toolbar !== null) {
    return {
      show: props.toolbar.show ?? false,
      items: props.toolbar.items ?? items
    }
  }

  return {
    show: props.toolbar !== false,
    items
  }
})

const isCropping = computed(() => activeTool.value === 'crop' && isCropEnabled.value)

const cropperReady = ref(false)
watch(isCropping, val => {
  if (!val) cropperReady.value = false
})

const hideActions = computed(() => {
  const items = normalizedToolbar.value.items || []
  return items.includes('apply') || items.includes('cancel') || items.includes('reset')
})

// Sync tool activation state
watch(activeTool, tool => {
  if (tool === 'crop' && !isCropEnabled.value) {
    activeTool.value = 'none'
  }
})

// --- Export UI State ---
const isDownloadModalOpen = ref(false)
const selectedExportFormat = useStorage('img-studio-export-format', props.export?.defaultFormat || props.export?.formats?.[0] || 'image/jpeg')
const selectedExportQuality = useStorage('img-studio-export-quality', 0.9)

watch(() => props.export?.defaultFormat, val => {
  if (val) selectedExportFormat.value = val
})

const exportFormatOptions = computed(() => {
  return (props.export?.formats || []).map(f => ({
    label: f.replace('image/', '').toUpperCase(),
    value: f
  }))
})

// --- Handlers ---
function onImageLoad(dataUrl: string) {
  internalSrc.value = dataUrl
  emit('update:src', dataUrl)
}

function onCropApply(result: CropResult) {
  internalSrc.value = result.dataUrl
  activeTool.value = 'none'
  emit('crop:apply', result)
  emit('update:src', result.dataUrl) // Update the working image
}

function onCropCancel() {
  activeTool.value = 'none'
  emit('crop:cancel')
}

function onReset() {
  internalSrc.value = ''
  activeTool.value = 'none'
  emit('reset')
}

function onToolbarAction(action: 'apply' | 'cancel' | 'reset' | 'download') {
  if (action === 'reset') {
    onReset()
    return
  }

  if (action === 'download') {
    if (exportFormatOptions.value.length > 0) {
      isDownloadModalOpen.value = true
    }
    else {
      downloadImage('image')
    }
    return
  }

  if (action === 'apply') {
    if (isCropping.value) {
      applyCrop()
    }
  }
  else if (action === 'cancel') {
    if (isCropping.value) {
      onCropCancel()
    }
  }
}

const cropperRef = ref<InstanceType<typeof ImgCropper>>()
const containerRef = ref<HTMLElement>()
const isHovered = useElementHover(containerRef)

function applyCrop() {
  cropperRef.value?.apply()
}

function cancelCrop() {
  cropperRef.value?.cancel()
}

async function getFile(filename = 'image', reqFormat?: string, reqQuality?: number): Promise<File | null> {
  if (!internalSrc.value) return null

  const targetFormat = reqFormat || selectedExportFormat.value || props.export?.defaultFormat
  const targetQuality = reqQuality ?? selectedExportQuality.value ?? props.export?.quality ?? 0.9

  return dataUrlToFile(internalSrc.value, filename, targetFormat, targetQuality)
}

async function downloadImage(filename = 'image', reqFormat?: string, reqQuality?: number) {
  const file = await getFile(filename, reqFormat, reqQuality)
  if (!file) return

  downloadFile(file)
}

function confirmDownload() {
  downloadImage('image', selectedExportFormat.value)
  isDownloadModalOpen.value = false
}

defineExpose({
  applyCrop,
  cancelCrop,
  downloadImage,
  getFile
})
</script>

<template>
  <div
    ref="containerRef"
    class="flex flex-col w-full min-h-100 bg-white dark:bg-gray-900 border border-muted rounded-xl relative overflow-hidden"
    :class="{ 'opacity-60 pointer-events-none': disabled }">
    <!-- 1. Initial State: No Image -->
    <ImgDropZone v-if="!internalSrc" :accept="accept" @load="onImageLoad">
      <slot name="empty" />
    </ImgDropZone>

    <!-- 2. Editor State -->
    <template v-else>
      <div class="flex flex-1 min-h-0">
        <!-- Sidebar -->
        <ImgToolbar
          v-if="normalizedToolbar.show"
          :active-tool="activeTool"
          :config="normalizedToolbar"
          :disabled="disabled"
          :active="isHovered"
          @update:active-tool="val => activeTool = val"
          @action="onToolbarAction">
          <slot name="toolbar" />
        </ImgToolbar>

        <!-- Main Viewport -->
        <div class="flex-1 relative flex items-center justify-center overflow-hidden">
          <!-- Background checked pattern -->
          <div
            class="absolute inset-0 opacity-20 pointer-events-none"
            style="background-image: linear-gradient(45deg, var(--ui-border) 25%, transparent 25%), linear-gradient(-45deg, var(--ui-border) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--ui-border) 75%), linear-gradient(-45deg, transparent 75%, var(--ui-border) 75%); background-size: 20px 20px; background-position: 0 0, 0 10px, 10px -10px, -10px 0px;" />

          <ImgCropper
            v-if="isCropping"
            ref="cropperRef"
            class="absolute inset-0 z-10"
            :src="internalSrc"
            :crop="normalizedCrop"
            :zoom="normalizedZoom"
            :hide-actions="hideActions"
            @ready="cropperReady = true"
            @apply="onCropApply"
            @cancel="onCropCancel" />

          <!-- Standard View (Always rendered to prevent unmount flashes) -->
          <div
            class="w-full h-full flex items-center justify-center relative p-4"
            :class="{ 'opacity-0 pointer-events-none': isCropping && cropperReady }">
            <img :src="internalSrc" class="max-w-full max-h-full object-contain shadow-md" alt="Studio Preview">
            <slot name="preview" :src="internalSrc" :crop="isCropping" />
          </div>
        </div>
      </div>

      <!-- Action Footer -->
      <div v-if="!hideActions" class="flex items-center gap-2 px-4 py-3 border-t border-muted bg-muted">
        <UButton
          label="Reset Image"
          icon="i-lucide-trash-2"
          color="neutral"
          variant="ghost"
          @click="onReset" />
        <div class="flex-1" />
        <!-- Custom actions slot -->
        <slot name="actions" />
      </div>
    </template>
  </div>

  <!-- Download Modal -->
  <UModal v-model:open="isDownloadModalOpen" title="Download Options">
    <template #body>
      <div class="space-y-4">
        <UFormField v-if="exportFormatOptions.length" label="Export Format">
          <USelect v-model="selectedExportFormat" :items="exportFormatOptions" value-key="value" />
        </UFormField>
        <UFormField label="Quality" :hint="`${Math.round(selectedExportQuality * 100)}%` ">
          <USlider v-model="selectedExportQuality" :min="0.1" :max="1" :step="0.1" color="primary" />
        </UFormField>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton label="Cancel" color="neutral" variant="ghost" @click="isDownloadModalOpen = false" />
        <UButton label="Download" icon="i-lucide-download" color="primary" @click="confirmDownload" />
      </div>
    </template>
  </UModal>
</template>

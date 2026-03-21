<script lang="ts" setup>
import { ref, watch, computed } from 'vue'
import type { CropConfig, CropResult, StudioTool, ToolbarConfig, ZoomConfig } from './types'
import ImgDropZone from './ImgDropZone.vue'
import ImgToolbar from './ImgToolbar.vue'
import ImgCropper from './ImgCropper.vue'

const props = withDefaults(defineProps<{
  src?: string
  accept?: string
  crop?: boolean | CropConfig
  zoom?: boolean | ZoomConfig
  toolbar?: boolean | ToolbarConfig
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
    downloadImage()
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

function applyCrop() {
  cropperRef.value?.apply()
}

function cancelCrop() {
  cropperRef.value?.cancel()
}

function downloadImage(filename = 'image.png') {
  if (!internalSrc.value) return

  // Convert data URL → Blob → Object URL for reliable cross-browser download
  const [header, data] = internalSrc.value.split(',')
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/png'
  const bytes = atob(data)
  const buf = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) buf[i] = bytes.charCodeAt(i)
  const blob = new Blob([buf], { type: mime })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

defineExpose({
  applyCrop,
  cancelCrop,
  downloadImage
})
</script>

<template>
  <!-- <div class="flex flex-col w-full h-150 min-h-100 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl relative" :class="{ 'opacity-60 pointer-events-none': disabled }"> -->
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
    <div v-if="!hideActions" class="flex items-center gap-2 px-4 py-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
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
  <!-- </div> -->
</template>

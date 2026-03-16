<script lang="ts" setup>
import { ref, onMounted, nextTick } from 'vue'
import type { FilterOptions } from '../../../layers/image/app/types/editor'

interface FilterPreset {
  id: string
  name: string
  icon: string
  filter: Partial<FilterOptions>
}

const editorRef = ref()
const filterRef = ref()

const presets: FilterPreset[] = [
  { id: 'none', name: 'Original', icon: 'i-lucide-image', filter: {} },
  { id: 'vivid', name: 'Vivid', icon: 'i-lucide-sun', filter: { brightness: 110, saturate: 140, contrast: 110 } },
  { id: 'cinematic', name: 'Cinematic', icon: 'i-lucide-clapperboard', filter: { contrast: 125, exposure: -5, temperature: 10, shadows: 10 } },
  { id: 'vintage', name: 'Vintage', icon: 'i-lucide-camera', filter: { sepia: 40, contrast: 90, brightness: 105 } },
  { id: 'mono', name: 'Mono', icon: 'i-lucide-scan-eye', filter: { grayscale: 100, contrast: 120 } },
  { id: 'warm', name: 'Warm', icon: 'i-lucide-thermometer-sun', filter: { temperature: 30, saturate: 110 } },
  { id: 'cool', name: 'Cool', icon: 'i-lucide-thermometer-snowflake', filter: { temperature: -30, hueRotate: 5 } },
  { id: 'dramatic', name: 'Dramatic', icon: 'i-lucide-zap', filter: { contrast: 150, exposure: -10, shadows: 20 } }
]

const activePreset = ref('none')

const selectPreset = (preset: FilterPreset) => {
  activePreset.value = preset.id
  filterRef.value?.resetFilters()
  if (preset.filter) {
    filterRef.value?.applyFilter(preset.filter)
  }
}

const downloadResult = async () => {
  if (editorRef.value) {
    await editorRef.value.applyAndExport('filtered-image.png')
  }
}

onMounted(() => {
  nextTick(() => {
    editorRef.value?.activateTool('filter')
  })
})
</script>

<template>
  <ImgToolPage
    title="Photo Filters"
    description="Transform your photos with professional filters and adjustments."
    icon="i-lucide-sparkles">
    <template #default="{ img }">
      <div class="absolute inset-0 h-full w-full">
        <ClientOnly>
          <ImgEditor
            ref="editorRef"
            :src="img"
            borderless
            hide-checkerboard
            disable-panning>
            <template #header>
              <div class="hidden" />
            </template>
            <template #overlay>
              <ImgFilter ref="filterRef" />
            </template>
          </ImgEditor>
        </ClientOnly>
      </div>
    </template>

    <template #actions>
      <div class="flex gap-2">
        <UButton
          label="Undo"
          icon="i-lucide-undo"
          variant="ghost"
          color="neutral"
          :disabled="!editorRef?.canUndo"
          @click="editorRef?.undo()" />
        <UButton
          label="Redo"
          icon="i-lucide-redo"
          variant="ghost"
          color="neutral"
          :disabled="!editorRef?.canRedo"
          @click="editorRef?.redo()" />
        <UButton
          label="Download Result"
          icon="i-lucide-download"
          @click="downloadResult" />
      </div>
    </template>

    <template #sidebar>
      <div class="space-y-6">
        <div class="bg-elevated p-6 rounded-xl border border-muted space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-sm">
              Presets
            </h3>
            <UButton
              variant="ghost"
              color="neutral"
              size="xs"
              label="Reset"
              icon="i-lucide-rotate-ccw"
              @click="presets[0] && selectPreset(presets[0])" />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <UButton
              v-for="preset in presets"
              :key="preset.id"
              :label="preset.name"
              :icon="preset.icon"
              :color="activePreset === preset.id ? 'primary' : 'neutral'"
              :variant="activePreset === preset.id ? 'solid' : 'outline'"
              size="xs"
              block
              class="justify-start gap-2"
              @click="selectPreset(preset)" />
          </div>
        </div>

        <div class="bg-elevated p-6 rounded-xl border border-muted space-y-4">
          <h3 class="font-semibold text-sm">
            Fine Tune
          </h3>
          <div class="space-y-4">
            <div class="space-y-1.5">
              <div class="flex justify-between text-[10px] text-muted uppercase font-bold tracking-tight">
                <span>Brightness</span>
                <span>{{ filterRef?.currentFilters?.brightness ?? 100 }}%</span>
              </div>
              <USlider
                :model-value="filterRef?.currentFilters?.brightness ?? 100"
                :min="0"
                :max="200"
                size="sm"
                @update:model-value="(val) => {
                  if (filterRef?.currentFilters) {
                    filterRef.currentFilters.brightness = val
                    activePreset = 'custom'
                  }
                }" />
            </div>

            <div class="space-y-1.5">
              <div class="flex justify-between text-[10px] text-muted uppercase font-bold tracking-tight">
                <span>Contrast</span>
                <span>{{ filterRef?.currentFilters?.contrast ?? 100 }}%</span>
              </div>
              <USlider
                :model-value="filterRef?.currentFilters?.contrast ?? 100"
                :min="0"
                :max="200"
                size="sm"
                @update:model-value="(val) => {
                  if (filterRef?.currentFilters) {
                    filterRef.currentFilters.contrast = val
                    activePreset = 'custom'
                  }
                }" />
            </div>

            <div class="space-y-1.5">
              <div class="flex justify-between text-[10px] text-muted uppercase font-bold tracking-tight">
                <span>Saturation</span>
                <span>{{ filterRef?.currentFilters?.saturate ?? 100 }}%</span>
              </div>
              <USlider
                :model-value="filterRef?.currentFilters?.saturate ?? 100"
                :min="0"
                :max="200"
                size="sm"
                @update:model-value="(val) => {
                  if (filterRef?.currentFilters) {
                    filterRef.currentFilters.saturate = val
                    activePreset = 'custom'
                  }
                }" />
            </div>

            <div class="space-y-1.5">
              <div class="flex justify-between text-[10px] text-muted uppercase font-bold tracking-tight">
                <span>Temperature</span>
                <span>{{ filterRef?.currentFilters?.temperature ?? 0 }}</span>
              </div>
              <USlider
                :model-value="filterRef?.currentFilters?.temperature ?? 0"
                :min="-100"
                :max="100"
                size="sm"
                @update:model-value="(val) => {
                  if (filterRef?.currentFilters) {
                    filterRef.currentFilters.temperature = val
                    activePreset = 'custom'
                  }
                }" />
            </div>

            <div class="space-y-1.5">
              <div class="flex justify-between text-[10px] text-muted uppercase font-bold tracking-tight">
                <span>Exposure</span>
                <span>{{ filterRef?.currentFilters?.exposure ?? 0 }}</span>
              </div>
              <USlider
                :model-value="filterRef?.currentFilters?.exposure ?? 0"
                :min="-100"
                :max="100"
                size="sm"
                @update:model-value="(val) => {
                  if (filterRef?.currentFilters) {
                    filterRef.currentFilters.exposure = val
                    activePreset = 'custom'
                  }
                }" />
            </div>
          </div>
        </div>

        <div class="p-6 rounded-xl space-y-2 bg-info/5 border border-info/20 text-xs text-info/80">
          <p class="font-semibold text-info flex items-center gap-1">
            <UIcon name="i-lucide-info" />
            Performance Tip
          </p>
          <p>Filters are applied in real-time. For large images, basic adjustments (Brightness/Contrast) are instantaneous, while advanced ones like "Exposure" use multi-threaded background processing.</p>
        </div>
      </div>
    </template>
  </ImgToolPage>
</template>

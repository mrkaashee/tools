<script lang="ts" setup>
import { ref } from 'vue'
import ImgEditor from '../components/ImgEditor.vue'

const img = ref('https://images.pexels.com/photos/4323307/pexels-photo-4323307.jpeg')
const imageUrl = ref('')
const fileInputRef = ref<HTMLInputElement>()
const editorRef = ref<InstanceType<typeof ImgEditor> | null>(null)
const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader()
    reader.onload = e => {
      img.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const handleUrlSubmit = () => {
  if (imageUrl.value.trim()) {
    img.value = imageUrl.value.trim()
    imageUrl.value = ''
  }
}

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const downloadImage = async () => {
  if (!editorRef.value) return

  const blob = await editorRef.value.exportImage('image/png', 0.92)
  if (blob) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'edited-image.png'
    a.click()
    URL.revokeObjectURL(url)
  }
}
</script>

<template>
  <UDashboardPanel grow>
    <template #body>
      <ClientOnly>
        <!-- Header -->
        <div class="mb-4">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-xl font-bold tracking-tight text-highlighted">
                Image Studio
              </h1>
            </div>

            <div class="flex items-center gap-2">
              <UButton
                v-if="editorRef?.isWorkerProcessing"
                label="Worker Processing..."
                variant="soft"
                color="warning"
                loading
                size="sm"
                class="pointer-events-none" />
              <UButton
                label="Reset All"
                icon="i-lucide-rotate-ccw"
                color="neutral"
                variant="subtle"
                size="sm"
                :disabled="!editorRef?.hasImage"
                @click="editorRef?.resetAll()" />
              <UButton
                label="Export"
                icon="i-lucide-download"
                color="primary"
                size="sm"
                @click="downloadImage" />
            </div>
          </div>
        </div>

        <!-- Toolbar / Drop Zone -->
        <div class="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            class="group relative flex items-center justify-center p-3 border border-dashed border-muted rounded-xl hover:border-primary transition-all cursor-pointer bg-muted"
            @click="triggerFileInput">
            <input
              ref="fileInputRef"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleFileUpload">
            <p class="text-xs font-medium text-muted dark:text-muted">
              Upload or drop image
            </p>
          </div>

          <div class="flex gap-2">
            <UInput
              v-model="imageUrl"
              type="url"
              placeholder="Paste image URL..."
              size="sm"
              class="flex-1"
              @keyup.enter="handleUrlSubmit" />
            <UButton
              label="Load"
              color="neutral"
              variant="outline"
              size="sm"
              @click="handleUrlSubmit" />
          </div>
        </div>

        <!-- Editor Interface -->
        <div class="h-[calc(100vh-180px)]">
          <ImgEditor ref="editorRef" :src="img" restrict-to-bounds>
            <!-- Overlay for drawing/crop -->
            <template #overlay>
              <!-- ImgDrawing removed as per instruction -->
            </template>

            <!-- Tools Sidebar Content -->
            <TransitionGroup
              tag="div"
              class="space-y-6 pb-20"
              enter-active-class="transition-all duration-500 ease-out"
              enter-from-class="opacity-0 translate-x-4 blur-sm"
              leave-active-class="transition-all duration-300 ease-in absolute"
              leave-to-class="opacity-0 -translate-x-4 blur-sm"
              move-class="transition-all duration-400 ease-in-out">
              <!-- Real-time Preview & Compare -->
              <UCard key="preview" class="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg border-white/30 dark:border-white/10 shadow-md" :ui="{ body: 'p-3' }">
                <ImgPreview />
              </UCard>

              <!-- Layers Manager -->
              <UCard key="layers" class="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg border-white/30 dark:border-white/10 shadow-md" :ui="{ body: 'p-3' }">
                <ImgLayerManager />
              </UCard>

              <!-- Annotate Section -->
              <ImgAnnotate key="annotate" />

              <!-- Aspect Ratio Presets -->
              <ImgAspectPresets key="aspect" />

              <!-- Censoring Tool -->
              <ImgCensor key="censor" />

              <!-- Crop Tool -->
              <div key="crop" class="space-y-4">
                <div class="flex items-center justify-between px-1">
                  <h3 class="text-[10px] font-bold uppercase tracking-widest text-muted">
                    Crop & Aspect
                  </h3>
                  <UBadge v-if="['stencil-rect', 'stencil-circle'].includes(editorRef?.activeTool || '')" color="primary" size="xs" variant="subtle" class="animate-pulse">
                    Active
                  </UBadge>
                </div>

                <div class="grid grid-cols-2 gap-2">
                  <UButton
                    :color="editorRef?.activeTool === 'stencil-rect' ? 'primary' : 'neutral'"
                    variant="subtle"
                    icon="i-lucide-square"
                    label="Square"
                    class="h-10"
                    @click="() => editorRef?.activateTool('stencil-rect')" />
                  <UButton
                    :color="editorRef?.activeTool === 'stencil-circle' ? 'primary' : 'neutral'"
                    variant="subtle"
                    icon="i-lucide-circle"
                    label="Circle"
                    class="h-10"
                    @click="() => editorRef?.activateTool('stencil-circle')" />
                </div>

                <UButton
                  v-if="['stencil-rect', 'stencil-circle'].includes(editorRef?.activeTool || '')"
                  label="Apply Crop"
                  icon="i-lucide-check"
                  color="primary"
                  block
                  size="lg"
                  class="shadow-lg shadow-primary-500/20"
                  @click="() => editorRef?.deactivateTool()" />
              </div>

              <!-- Dynamic Stencil Components -->
              <RectangleStencil key="stencil-rect" />
              <CircleStencil key="stencil-circle" />

              <!-- Transform Tool -->
              <ImgTransform key="transform" v-slot="{ rotate, flipHorizontal, flipVertical, currentTransform }">
                <div class="space-y-2">
                  <h3 class="text-[10px] font-bold uppercase tracking-widest text-muted px-1">
                    Transform
                  </h3>
                  <div class="grid grid-cols-4 gap-2">
                    <UButton icon="i-lucide-rotate-ccw" color="neutral" variant="subtle" title="Rotate -90" @click="rotate(-90)" />
                    <UButton icon="i-lucide-rotate-cw" color="neutral" variant="subtle" title="Rotate +90" @click="rotate(90)" />
                    <UButton icon="i-lucide-flip-horizontal" :color="currentTransform.flipHorizontal ? 'primary' : 'neutral'" variant="subtle" title="Flip X" @click="flipHorizontal" />
                    <UButton icon="i-lucide-flip-vertical" :color="currentTransform.flipVertical ? 'primary' : 'neutral'" variant="subtle" title="Flip Y" @click="flipVertical" />
                  </div>
                </div>
              </ImgTransform>

              <!-- Resize Tool -->
              <ImgResize key="resize" v-slot="{ applyResize }">
                <div class="space-y-2">
                  <h3 class="text-[10px] font-bold uppercase tracking-widest text-muted px-1">
                    Quick Sizes
                  </h3>
                  <div class="grid grid-cols-3 gap-1">
                    <UButton label="SD" size="xs" color="neutral" variant="subtle" @click="applyResize(800, 600)" />
                    <UButton label="HD" size="xs" color="neutral" variant="subtle" @click="applyResize(1280, 720)" />
                    <UButton label="FHD" size="xs" color="neutral" variant="subtle" @click="applyResize(1920, 1080)" />
                  </div>
                </div>
              </ImgResize>

              <!-- Filter Tool -->
              <ImgFilter key="filters" v-slot="{ applyFilter, currentFilters, resetFilters }">
                <div class="space-y-4 pt-2">
                  <div class="flex items-center justify-between px-1">
                    <h3 class="text-[10px] font-bold uppercase tracking-widest text-muted">
                      Filters & Effects
                    </h3>
                    <UButton
                      label="Reset Filters"
                      variant="subtle"
                      color="error"
                      size="xs"
                      icon="i-lucide-rotate-ccw"
                      @click="resetFilters" />
                  </div>

                  <!-- Presets Gallery -->
                  <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-1">
                    <UButton
                      v-for="preset in PRESET_FILTERS"
                      :key="preset.id"
                      :icon="preset.id === 'none' ? 'i-lucide-image' : 'i-lucide-sparkles'"
                      :label="preset.label"
                      :variant="currentFilters.lastPreset === preset.id ? 'solid' : 'subtle'"
                      :color="currentFilters.lastPreset === preset.id ? 'primary' : 'neutral'"
                      @click="preset.id === 'none' ? (resetFilters(), currentFilters.lastPreset = 'none') : (applyFilter(preset.preset), currentFilters.lastPreset = preset.id)" />
                  </div>

                  <!-- Categorized Adjustments -->
                  <UAccordion
                    multiple
                    :items="[
                      { label: 'Basic', icon: 'i-lucide-sliders', slot: 'basic', defaultOpen: true },
                      { label: 'Color', icon: 'i-lucide-palette', slot: 'color' },
                      { label: 'Light', icon: 'i-lucide-sun', slot: 'light' },
                      { label: 'Detail', icon: 'i-lucide-zap', slot: 'detail' },
                    ]"
                    :ui="{
                      trigger: 'px-3 py-2 text-[10px] font-bold uppercase tracking-widest',
                    }">
                    <template #basic>
                      <div class="p-3 space-y-4">
                        <div>
                          <div class="flex justify-between text-[10px] text-muted mb-2 uppercase font-medium">
                            <span>Brightness</span>
                            <span class="text-primary-500">{{ currentFilters.brightness }}%</span>
                          </div>
                          <USlider v-model="currentFilters.brightness" :min="0" :max="200" size="sm" @update:model-value="applyFilter({ brightness: $event })" />
                        </div>
                        <div>
                          <div class="flex justify-between text-[10px] text-muted mb-2 uppercase font-medium">
                            <span>Contrast</span>
                            <span class="text-primary-500">{{ currentFilters.contrast }}%</span>
                          </div>
                          <USlider v-model="currentFilters.contrast" :min="0" :max="200" size="sm" @update:model-value="applyFilter({ contrast: $event })" />
                        </div>
                        <div>
                          <div class="flex justify-between text-[10px] text-muted mb-2 uppercase font-medium">
                            <span>Saturation</span>
                            <span class="text-primary-500">{{ currentFilters.saturate }}%</span>
                          </div>
                          <USlider v-model="currentFilters.saturate" :min="0" :max="200" size="sm" @update:model-value="applyFilter({ saturate: $event })" />
                        </div>
                      </div>
                    </template>

                    <template #color>
                      <div class="p-3 space-y-4">
                        <div>
                          <div class="flex justify-between text-[10px] text-muted mb-2 uppercase font-medium">
                            <span>Temperature</span>
                            <span class="text-primary-500">{{ (currentFilters.temperature || 0) > 0 ? 'Warm' : 'Cool' }} ({{ currentFilters.temperature }})</span>
                          </div>
                          <USlider v-model="currentFilters.temperature" :min="-100" :max="100" size="sm" @update:model-value="applyFilter({ temperature: $event })" />
                        </div>
                        <div>
                          <div class="flex justify-between text-[10px] text-muted mb-2 uppercase font-medium">
                            <span>Tint</span>
                            <span class="text-primary-500">{{ currentFilters.tint }}</span>
                          </div>
                          <USlider v-model="currentFilters.tint" :min="-100" :max="100" size="sm" @update:model-value="applyFilter({ tint: $event })" />
                        </div>
                        <div>
                          <div class="flex justify-between text-[10px] text-muted mb-2 uppercase font-medium">
                            <span>Vibrance</span>
                            <span class="text-primary-500">{{ currentFilters.vibrance }}</span>
                          </div>
                          <USlider v-model="currentFilters.vibrance" :min="-100" :max="100" size="sm" @update:model-value="applyFilter({ vibrance: $event })" />
                        </div>
                        <div>
                          <div class="flex justify-between text-[10px] text-muted mb-2 uppercase font-medium">
                            <span>Hue Rotate</span>
                            <span class="text-primary-500">{{ currentFilters.hueRotate }}°</span>
                          </div>
                          <USlider v-model="currentFilters.hueRotate" :min="0" :max="360" size="sm" @update:model-value="applyFilter({ hueRotate: $event })" />
                        </div>
                      </div>
                    </template>

                    <template #light>
                      <div class="p-3 space-y-4">
                        <div>
                          <div class="flex justify-between text-[10px] text-muted mb-2 uppercase font-medium">
                            <span>Exposure</span>
                            <span class="text-primary-500">{{ currentFilters.exposure }}</span>
                          </div>
                          <USlider v-model="currentFilters.exposure" :min="-100" :max="100" size="sm" @update:model-value="applyFilter({ exposure: $event })" />
                        </div>
                        <div>
                          <div class="flex justify-between text-[10px] text-muted mb-2 uppercase font-medium">
                            <span>Highlights</span>
                            <span class="text-primary-500">{{ currentFilters.highlights }}</span>
                          </div>
                          <USlider v-model="currentFilters.highlights" :min="-100" :max="100" size="sm" @update:model-value="applyFilter({ highlights: $event })" />
                        </div>
                        <div>
                          <div class="flex justify-between text-[10px] text-muted mb-2 uppercase font-medium">
                            <span>Shadows</span>
                            <span class="text-primary-500">{{ currentFilters.shadows }}</span>
                          </div>
                          <USlider v-model="currentFilters.shadows" :min="-100" :max="100" size="sm" @update:model-value="applyFilter({ shadows: $event })" />
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                          <div>
                            <div class="flex justify-between text-[10px] text-muted mb-2 uppercase font-medium">
                              <span>Whites</span>
                            </div>
                            <USlider v-model="currentFilters.whites" :min="-100" :max="100" size="sm" @update:model-value="applyFilter({ whites: $event })" />
                          </div>
                          <div>
                            <div class="flex justify-between text-[10px] text-muted mb-2 uppercase font-medium">
                              <span>Blacks</span>
                            </div>
                            <USlider v-model="currentFilters.blacks" :min="-100" :max="100" size="sm" @update:model-value="applyFilter({ blacks: $event })" />
                          </div>
                        </div>
                      </div>
                    </template>

                    <template #detail>
                      <div class="p-3 space-y-4">
                        <div>
                          <div class="flex justify-between text-[10px] text-muted mb-2 uppercase font-medium">
                            <span>Clarity</span>
                            <span class="text-primary-500">{{ currentFilters.clarity }}</span>
                          </div>
                          <USlider v-model="currentFilters.clarity" :min="-100" :max="100" size="sm" @update:model-value="applyFilter({ clarity: $event })" />
                        </div>
                        <div>
                          <div class="flex justify-between text-[10px] text-muted mb-2 uppercase font-medium">
                            <span>Sharpen</span>
                            <span class="text-primary-500">{{ currentFilters.sharpen }}</span>
                          </div>
                          <USlider v-model="currentFilters.sharpen" :min="0" :max="100" size="sm" @update:model-value="applyFilter({ sharpen: $event })" />
                        </div>
                      </div>
                    </template>
                  </UAccordion>
                </div>
              </ImgFilter>

              <!-- Info Section -->
              <div key="info" class="pt-6 border-t border-default space-y-3">
                <div class="flex items-center gap-2 text-primary-500 px-1">
                  <UIcon name="i-lucide-sparkles" class="w-3.5 h-3.5" />
                  <span class="text-[10px] font-bold uppercase tracking-widest">
                    Studio Tips
                  </span>
                </div>
                <ul class="text-[10px] text-muted space-y-2 leading-tight px-1">
                  <li class="flex items-start gap-2 italic">
                    <UIcon name="i-lucide-info" class="w-3 h-3 text-muted mt-0.5" />
                    <span>Non-destructive editing with Stencils</span>
                  </li>
                </ul>
              </div>
            </TransitionGroup>
          </ImgEditor>
        </div>
      </ClientOnly>
    </template>
  </UDashboardPanel>
</template>

<style scoped>
kbd {
    padding: 0.125rem 0.25rem;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 0.25rem;
    font-family: monospace;
    font-size: 0.75rem;
}
</style>

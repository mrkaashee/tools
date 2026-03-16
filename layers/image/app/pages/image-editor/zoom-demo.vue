<script lang="ts" setup>
const img = 'https://images.pexels.com/photos/4323307/pexels-photo-4323307.jpeg'

const cropperRef = ref()

const zoomPresets = [
  { label: '25%', value: 0.25 },
  { label: '50%', value: 0.5 },
  { label: '100%', value: 1 },
  { label: '150%', value: 1.5 },
  { label: '200%', value: 2 },
  { label: '300%', value: 3 },
]

const applyZoom = (level: number) => {
  cropperRef.value?.zoomTo(level)
}
</script>

<template>
  <UDashboardPanel>
    <template #body>
      <!-- Header -->
      <div class="mb-8 text-center">
        <h1 class="text-3xl font-bold tracking-tight text-highlighted mb-2">
          Zoom Controls Demo
        </h1>
        <p class="text-muted text-sm">
          Mouse wheel, pinch-to-zoom, and button controls
        </p>
      </div>

      <!-- Main Cropper -->
      <div class="mb-6">
        <div class="rounded-xl overflow-hidden border border-default shadow-lg">
          <ClientOnly>
            <Cropper
              ref="cropperRef"
              class="h-150 w-full"
              :src="img"
              mode="move-box"
              shape="rectangle"
              :enable-zoom="true"
              :min-zoom="1"
              :max-zoom="5"
              :zoom-step="0.1"
              :zoom-speed="0.1"
              :show-zoom-controls="true" />
          </ClientOnly>
        </div>
      </div>

      <!-- Quick Zoom Presets -->
      <div class="flex flex-wrap items-center justify-center gap-3 mb-8">
        <span class="text-sm font-medium text-default">Quick Zoom:</span>
        <UButton
          v-for="preset in zoomPresets"
          :key="preset.value"
          :label="preset.label"
          color="neutral"
          variant="outline"
          size="sm"
          @click="applyZoom(preset.value)" />

        <UButton
          label="Fit to Container"
          color="primary"
          variant="soft"
          size="sm"
          @click="cropperRef?.fitToContainer()" />

        <UButton
          label="Actual Size"
          color="success"
          variant="soft"
          size="sm"
          @click="cropperRef?.actualSize()" />
      </div>

      <!-- Features List -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="p-6 bg-elevated rounded-xl border border-default">
          <h3 class="text-lg font-semibold text-highlighted mb-3">
            🖱️ Mouse Controls
          </h3>
          <ul class="space-y-2 text-sm text-muted">
            <li>• Scroll wheel to zoom in/out</li>
            <li>• Zoom centers on cursor position</li>
            <li>• Click zoom buttons in bottom-right</li>
            <li>• Drag crop box to reposition</li>
          </ul>
        </div>

        <div class="p-6 bg-elevated rounded-xl border border-default">
          <h3 class="text-lg font-semibold text-highlighted mb-3">
            📱 Touch Controls
          </h3>
          <ul class="space-y-2 text-sm text-muted">
            <li>• Pinch to zoom in/out</li>
            <li>• Zoom centers on pinch point</li>
            <li>• Tap zoom buttons</li>
            <li>• Drag crop box to reposition</li>
          </ul>
        </div>

        <div class="p-6 bg-elevated rounded-xl border border-default">
          <h3 class="text-lg font-semibold text-highlighted mb-3">
            ⚙️ Configuration
          </h3>
          <ul class="space-y-2 text-sm text-muted">
            <li>• Min zoom: 100% (1.0)</li>
            <li>• Max zoom: 500% (5.0)</li>
            <li>• Zoom step: 10% (0.1)</li>
            <li>• Smooth zoom animations</li>
          </ul>
        </div>

        <div class="p-6 bg-elevated rounded-xl border border-default">
          <h3 class="text-lg font-semibold text-highlighted mb-3">
            🎯 Features
          </h3>
          <ul class="space-y-2 text-sm text-muted">
            <li>• Fit to container</li>
            <li>• Fill container</li>
            <li>• Actual size (1:1)</li>
            <li>• Custom zoom levels</li>
          </ul>
        </div>
      </div>

      <!-- Code Example -->
      <div class="mt-8 p-6 bg-muted rounded-xl border border-default">
        <h3 class="text-lg font-semibold text-highlighted mb-3">
          Usage Example
        </h3>
        <pre class="text-sm text-default overflow-x-auto"><code>&lt;Cropper
  :src="imageUrl"
  :enable-zoom="true"
  :min-zoom="1"
  :max-zoom="5"
  :zoom-step="0.1"
  :zoom-speed="0.1"
  :show-zoom-controls="true"
/&gt;

// Programmatic control
const cropperRef = ref()
cropperRef.value?.zoomIn()
cropperRef.value?.zoomOut()
cropperRef.value?.zoomTo(2) // 200%
cropperRef.value?.fitToContainer()
cropperRef.value?.actualSize()</code></pre>
      </div>
    </template>
  </UDashboardPanel>
</template>

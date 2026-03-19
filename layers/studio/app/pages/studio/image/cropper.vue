<script lang="ts" setup>
import { ref } from 'vue'

const img = 'https://images.pexels.com/photos/4323307/pexels-photo-4323307.jpeg'

const examples = [
  {
    title: 'Default Rectangle',
    description: 'Standard rectangular crop with move-box mode and 80% initial size.',
    activeTool: 'stencil-rect',
    studioProps: {
      cropper: { initialCropPercent: 80 }
    }
  },
  {
    title: 'Circular Crop',
    description: 'Circular stencil for profile pictures and avatars.',
    activeTool: 'stencil-circle',
    studioProps: {
      cropper: { initialCropPercent: 80 }
    }
  },
  {
    title: 'Fixed 16:9 Aspect Ratio',
    description: 'Locked aspect ratio for video thumbnails and widescreen banners.',
    activeTool: 'stencil-rect',
    studioProps: {
      cropper: { aspectRatio: 16 / 9, initialCropPercent: 80 }
    }
  },
  {
    title: 'Fixed 1:1 Square',
    description: 'Perfectly square crop for social media posts.',
    activeTool: 'stencil-rect',
    studioProps: {
      cropper: { aspectRatio: 1, initialCropPercent: 80 }
    }
  },
  {
    title: 'Move Image Mode (with Zoom)',
    description: 'Fixed viewport where the background image is moved and scaled. Zoom enabled for better framing.',
    activeTool: null,
    studioProps: {
      stencil: { fixed: true, shape: 'rect' },
      zoom: { min: 0.1, max: 10 }
    }
  },
  {
    title: 'Dashed Border & No Grid',
    description: 'Custom styling with dashed borders and hidden rule-of-thirds grid.',
    activeTool: 'stencil-rect',
    studioProps: {
      cropper: { gridLines: false, initialCropPercent: 80 }
    }
  },
  {
    title: 'Fixed Rectangle',
    description: 'Static rectangular crop preview with no interaction allowed.',
    activeTool: null,
    studioProps: {
      stencil: { fixed: true, shape: 'rect', resizable: false, movable: false }
    }
  },
  {
    title: 'Fixed Circle',
    description: 'Static circular crop preview with no interaction allowed.',
    activeTool: null,
    studioProps: {
      stencil: { fixed: true, shape: 'circle', resizable: false, movable: false }
    }
  },
  {
    title: 'WhatsApp DP (with Zoom)',
    description: '1:1 Circular crop covering 100% of the minimum dimension. Zoom and panning enabled.',
    activeTool: null,
    studioProps: {
      stencil: { fixed: true, shape: 'circle', cropPercent: 100 },
      zoom: { min: 1, max: 5 }
    }
  }
]
</script>

<template>
  <UDashboardPanel grow>
    <template #body>
      <div class="mb-8">
        <h1 class="text-3xl font-bold tracking-tight text-highlighted mb-2">
          Cropper Examples
        </h1>
        <p class="text-muted text-sm">
          Interactive gallery of the Cropper component wrapped in ImgStudio for a consistent experience.
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <UCard
          v-for="(example, index) in examples"
          :key="index"
          class="overflow-hidden border-muted shadow-sm hover:shadow-md transition-shadow"
          :ui="{ body: 'p-0' }">
          <template #header>
            <div class="flex items-center justify-between px-4">
              <div>
                <h3 class="text-lg font-semibold text-highlighted">
                  {{ example.title }}
                </h3>
                <p class="text-xs text-muted mt-1 leading-relaxed">
                  {{ example.description }}
                </p>
              </div>
              <UBadge variant="subtle" color="neutral" size="xs" class="ml-4 shrink-0">
                Example #{{ index + 1 }}
              </UBadge>
            </div>
          </template>

          <div class="aspect-video relative bg-default overflow-hidden">
            <ClientOnly>
              <ImgStudio
                class="w-full h-full min-h-0"
                :src="img"
                v-bind="example.studioProps"
                :active-tool="example.activeTool"
                :toolbar="{ hide: true }"
                :floating-bar="{ hide: true }" />
            </ClientOnly>
          </div>

          <template #footer>
            <div class="px-4 py-3 bg-muted/30">
              <div class="bg-muted/50 p-2 rounded text-[10px] font-mono text-muted overflow-x-auto whitespace-nowrap">
                &lt;ImgStudio :src="img" :active-tool="{{ example.activeTool }}" v-bind="{{ example.studioProps }}" /&gt;
              </div>
            </div>
          </template>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>

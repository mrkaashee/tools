<script lang="ts" setup>
const img = 'https://images.pexels.com/photos/4323307/pexels-photo-4323307.jpeg'

const filters = [
  { id: 'vivid', label: 'Vivid', description: 'Enhanced saturation and contrast' },
  { id: 'mono', label: 'B&W', description: 'Classic black and white' },
  { id: 'warm', label: 'Warm', description: 'Sunny, inviting tones' },
  { id: 'cool', label: 'Cool', description: 'Calm, blueish atmosphere' },
  { id: 'dramatic', label: 'Dramatic', description: 'High contrast, moody' },
  { id: 'fade', label: 'Fade', description: 'Soft, washed-out look' }
]

const { processorStyle: getStyle } = useImageProcessor()

// Mock some filters for static display if possible,
// but since ImgFilter needs a canvas, we'll use CSS filters for the playground preview gallery
const getCssFilter = (id: string) => {
  switch (id) {
    case 'vivid': return 'saturate(1.5) contrast(1.1) brightness(1.05)'
    case 'mono': return 'grayscale(1) contrast(1.2)'
    case 'warm': return 'sepia(0.3) saturate(1.2)'
    case 'cool': return 'hue-rotate(10deg) saturate(0.9)'
    case 'dramatic': return 'contrast(1.5) brightness(0.9)'
    case 'fade': return 'brightness(1.1) contrast(0.85) saturate(0.8)'
    default: return 'none'
  }
}
</script>

<template>
  <UDashboardPanel grow>
    <template #body>
      <div class="mb-8">
        <h1 class="text-3xl font-bold tracking-tight text-highlighted mb-2">
          Filter Presets
        </h1>
        <p class="text-muted text-sm">
          Visual demonstration of all built-in filter presets.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <UCard
          v-for="filter in filters"
          :key="filter.id"
          class="overflow-hidden border-muted shadow-sm hover:shadow-md transition-shadow">
          <template #header>
            <h3 class="text-sm font-semibold text-highlighted">
              {{ filter.label }}
            </h3>
          </template>

          <div class="aspect-square relative rounded-lg overflow-hidden border border-muted bg-default">
            <img
              :src="img"
              class="w-full h-full object-cover"
              :style="{ filter: getCssFilter(filter.id) }"
              alt="Filter Preview">
          </div>

          <template #footer>
            <p class="text-[10px] text-muted leading-tight">
              {{ filter.description }}
            </p>
          </template>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>

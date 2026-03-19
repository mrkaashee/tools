<script lang="ts" setup>
const img = 'https://images.pexels.com/photos/4323307/pexels-photo-4323307.jpeg'

const scenarios = [
  {
    title: 'High Contrast',
    description: 'Boosted highlights and deepened shadows for a punchy look.',
    settings: { exposure: 0, highlights: 40, shadows: -30, contrast: 120 }
  },
  {
    title: 'Warm & Bright',
    description: 'Increased temperature and exposure for a sunny feel.',
    settings: { exposure: 10, temperature: 30, saturate: 110 }
  },
  {
    title: 'Muted & Cinematic',
    description: 'Lowered saturation and adjusted blacks for a film-like aesthetic.',
    settings: { saturate: 70, blacks: 20, contrast: 90, exposure: -5 }
  },
  {
    title: 'Vibrant Highlights',
    description: 'Focused on highlights and vibrance without affecting skin tones.',
    settings: { highlights: 50, vibrance: 40 }
  }
]

// Mapping settings to CSS filter string for preview
const getPreviewStyle = (settings: any) => {
  const parts = []
  if (settings.exposure) parts.push(`brightness(${100 + settings.exposure}%)`)
  if (settings.contrast) parts.push(`contrast(${settings.contrast}%)`)
  if (settings.saturate) parts.push(`saturate(${settings.saturate}%)`)
  if (settings.sepia) parts.push(`sepia(${settings.sepia}%)`)
  if (settings.temperature) parts.push(`hue-rotate(${settings.temperature / 2}deg)`) // Approx

  // Custom properties like highlights/shadows don't map directly to CSS filters,
  // but we can approximate for the playground preview.
  if (settings.highlights) parts.push(`brightness(${100 + settings.highlights / 2}%)`)
  if (settings.shadows) parts.push(`contrast(${100 - settings.shadows / 2}%)`)

  return parts.join(' ') || 'none'
}
</script>

<template>
  <UDashboardPanel grow>
    <template #body>
      <div class="mb-8">
        <h1 class="text-3xl font-bold tracking-tight text-highlighted mb-2">
          Image Adjustments
        </h1>
        <p class="text-muted text-sm">
          Fine-tune every aspect of your image with high-precision controls.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <UCard
          v-for="(scenario, index) in scenarios"
          :key="index"
          class="overflow-hidden border-muted shadow-sm">
          <template #header>
            <h3 class="text-base font-semibold text-highlighted">
              {{ scenario.title }}
            </h3>
          </template>

          <div class="aspect-video relative rounded-lg overflow-hidden border border-muted bg-default mb-4">
            <img
              :src="img"
              class="w-full h-full object-cover"
              :style="{ filter: getPreviewStyle(scenario.settings) }"
              alt="Adjustment Preview">
          </div>

          <p class="text-xs text-muted mb-4">
            {{ scenario.description }}
          </p>

          <div class="flex flex-wrap gap-2">
            <UBadge
              v-for="(val, key) in scenario.settings"
              :key="key"
              variant="subtle"
              color="neutral"
              size="xs">
              {{ key }}: {{ val > 0 ? '+' : '' }}{{ val }}
            </UBadge>
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>

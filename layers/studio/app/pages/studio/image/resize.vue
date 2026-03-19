<script lang="ts" setup>
const img = 'https://images.pexels.com/photos/4323307/pexels-photo-4323307.jpeg'

const categories = [
  {
    title: 'Standard Presets',
    description: 'Common video and display resolutions.',
    presets: [
      { label: 'SD', width: 800, height: 600 },
      { label: 'HD', width: 1280, height: 720 },
      { label: 'FHD', width: 1920, height: 1080 }
    ]
  },
  {
    title: 'Instagram',
    description: 'Optimized sizes for Instagram posts and stories.',
    presets: [
      { label: 'Post', width: 1080, height: 1080 },
      { label: 'Story', width: 1080, height: 1920 },
      { label: 'Portrait', width: 1080, height: 1350 }
    ]
  },
  {
    title: 'YouTube & Twitch',
    description: 'Banners and thumbnails for streaming platforms.',
    presets: [
      { label: 'YT Thumb', width: 1280, height: 720 },
      { label: 'YT Banner', width: 2048, height: 1152 },
      { label: 'Twitch Banner', width: 1200, height: 480 }
    ]
  }
]
</script>

<template>
  <UDashboardPanel grow>
    <template #body>
      <div class="mb-8">
        <h1 class="text-3xl font-bold tracking-tight text-highlighted mb-2">
          Resize Presets
        </h1>
        <p class="text-muted text-sm">
          Demonstration of the ImgResize component with custom presets.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <UCard
          v-for="(cat, index) in categories"
          :key="index"
          class="overflow-hidden border-muted shadow-sm">
          <template #header>
            <h3 class="text-base font-semibold text-highlighted">
              {{ cat.title }}
            </h3>
            <p class="text-xs text-muted mt-1">
              {{ cat.description }}
            </p>
          </template>

          <div class="space-y-6">
            <div class="aspect-video relative rounded-lg overflow-hidden border border-muted bg-default">
              <ClientOnly>
                <ImgStudio
                  :src="img"
                  mode="canvas"
                  :active-tool="'resize'"
                  class="w-full h-full">
                  <template #toolbar>
                    <div class="p-4">
                      <ImgResize :presets="cat.presets" />
                    </div>
                  </template>
                </ImgStudio>
              </ClientOnly>
            </div>

            <div class="bg-muted/30 p-2 rounded text-[10px] font-mono text-muted overflow-x-auto">
              &lt;ImgResize :presets="[ {{ cat.presets.map(p => `{ label: '${p.label}', width: ${p.width}, height: ${p.height} }`).join(', ') }} ]" /&gt;
            </div>
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>

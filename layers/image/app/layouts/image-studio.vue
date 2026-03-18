<script setup lang="ts">
const links = [
  { label: 'Unified Editor', icon: 'i-lucide-palette', to: '/image-studio/editor' },
  { label: 'Cropper', icon: 'i-lucide-crop', to: '/image-studio/cropper' },
  { label: 'Transformations', icon: 'i-lucide-refresh-ccw', to: '/image-studio/transformations' },
  { label: 'Filters', icon: 'i-lucide-sparkles', to: '/image-studio/filters' },
  { label: 'Adjustments', icon: 'i-lucide-settings-2', to: '/image-studio/adjustments' },
  { label: 'Resize', icon: 'i-lucide-scaling', to: '/image-studio/resize' },
  { label: 'Compress', icon: 'i-lucide-shrink', to: '/image-studio/compress' },
  { label: 'Convert', icon: 'i-lucide-arrow-right-left', to: '/image-studio/convert' },
  { label: 'Zoom Demo', icon: 'i-lucide-zoom-in', to: '/image-studio/zoom-demo' }
]
</script>

<template>
  <UDashboardGroup>
    <UDashboardSidebar>
      <template #header>
        <div class="px-3 py-2">
          <h2 class="text-xs font-bold uppercase tracking-widest text-muted">
            Studio Playground
          </h2>
        </div>
      </template>
      <UNavigationMenu :items="links" orientation="vertical" />
    </UDashboardSidebar>
    <slot />
  </UDashboardGroup>
</template>

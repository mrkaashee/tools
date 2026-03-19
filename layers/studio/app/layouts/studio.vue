<script setup lang="ts">
const links = [
  {
    label: 'Image',
    icon: 'i-lucide-image',
    to: '/studio/image',
    defaultOpen: true,
    children: [
      { label: 'Unified Editor', icon: 'i-lucide-palette', to: '/studio/image/editor' },
      { label: 'Cropper', icon: 'i-lucide-crop', to: '/studio/image/cropper' },
      { label: 'Transformations', icon: 'i-lucide-refresh-ccw', to: '/studio/image/transformations' },
      { label: 'Filters', icon: 'i-lucide-sparkles', to: '/studio/image/filters' },
      { label: 'Adjustments', icon: 'i-lucide-settings-2', to: '/studio/image/adjustments' },
      { label: 'Resize', icon: 'i-lucide-scaling', to: '/studio/image/resize' },
      { label: 'Compress', icon: 'i-lucide-shrink', to: '/studio/image/compress' },
      { label: 'Convert', icon: 'i-lucide-arrow-right-left', to: '/studio/image/convert' },
      { label: 'Zoom Demo', icon: 'i-lucide-zoom-in', to: '/studio/image/zoom-demo' }
    ]
  },
  {
    label: 'PDF',
    icon: '',
    to: '/studio/pdf',
    defaultOpen: true,
    children: [
      {}
    ]
  }
]
</script>

<template>
  <UDashboardGroup>
    <UDashboardSidebar resizable>
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

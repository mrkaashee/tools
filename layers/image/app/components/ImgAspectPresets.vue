<script setup lang="ts">
import type { ImageEditorContext, AspectPreset } from '../types/editor'

const imgEditor = inject<ImageEditorContext>('imgEditor')

const presets: AspectPreset[] = [
  { id: 'ig-post', name: 'IG Post', icon: 'i-simple-icons-instagram', ratio: 1 / 1, platform: 'Instagram' },
  { id: 'ig-story', name: 'IG Story', icon: 'i-simple-icons-instagram', ratio: 9 / 16, platform: 'Instagram' },
  { id: 'ig-portrait', name: 'IG Portrait', icon: 'i-simple-icons-instagram', ratio: 4 / 5, platform: 'Instagram' },
  { id: 'tt-story', name: 'TikTok', icon: 'i-simple-icons-tiktok', ratio: 9 / 16, platform: 'TikTok' },
  { id: 'yt-video', name: 'YT Video', icon: 'i-simple-icons-youtube', ratio: 16 / 9, platform: 'YouTube' },
  { id: 'yt-short', name: 'YT Short', icon: 'i-simple-icons-youtube', ratio: 9 / 16, platform: 'YouTube' },
  { id: 'sq', name: 'Square', icon: 'i-lucide-square', ratio: 1 / 1, platform: 'General' },
  { id: 'hd', name: 'Widescreen', icon: 'i-lucide-monitor', ratio: 16 / 9, platform: 'General' }
]

const activePreset = ref<string | null>(null)

const applyRatio = (preset: AspectPreset) => {
  activePreset.value = preset.id
  if (imgEditor) {
    imgEditor.aspectRatio.value = preset.ratio
    imgEditor.activateTool('stencil-rect')
  }
}
</script>

<template>
  <div class="space-y-4 select-none">
    <div class="flex items-center justify-between">
      <h3 class="text-[10px] font-bold uppercase tracking-widest text-muted">
        Aspect Ratios
      </h3>
    </div>

    <div class="grid grid-cols-2 gap-2">
      <UButton
        v-for="preset in presets"
        :key="preset.id"
        :label="preset.name"
        :icon="preset.icon"
        :color="activePreset === preset.id ? 'primary' : 'neutral'"
        variant="soft"
        size="xs"
        class="justify-start truncate"
        @click="applyRatio(preset)" />
    </div>
  </div>
</template>

<script lang="ts">
import { inject, ref, computed } from 'vue'
import type { AppConfig } from '@nuxt/schema'
import theme from '../utils/themes/img-aspect-presets'
import type { ComponentConfig } from '../types/tv'
import type { ImageEditorContext, AspectPreset } from '../types/editor'
import { tv } from '../utils/tv'
import type { StudioAppConfig } from '../types/studio'

export type StudioAspect = ComponentConfig<typeof theme, AppConfig, 'studio'>

export interface StudioAspectProps {
  headless?: boolean
  presets?: AspectPreset[]
  ui?: StudioAspect['slots']
}
</script>

<script setup lang="ts">
const appConfig = useAppConfig() as StudioAppConfig

const props = defineProps<StudioAspectProps>()

const imgStudio = inject<ImageEditorContext>('imgStudio')

const resUI = computed(() => tv({ extend: tv(theme), ...(appConfig.ui?.aspect || {}) })(props.ui))

const defaultPresets: AspectPreset[] = [
  { id: 'ig-post', name: 'IG Post', icon: 'i-simple-icons-instagram', ratio: 1 / 1, platform: 'Instagram' },
  { id: 'ig-story', name: 'IG Story', icon: 'i-simple-icons-instagram', ratio: 9 / 16, platform: 'Instagram' },
  { id: 'ig-portrait', name: 'IG Portrait', icon: 'i-simple-icons-instagram', ratio: 4 / 5, platform: 'Instagram' },
  { id: 'tt-story', name: 'TikTok', icon: 'i-simple-icons-tiktok', ratio: 9 / 16, platform: 'TikTok' },
  { id: 'yt-video', name: 'YT Video', icon: 'i-simple-icons-youtube', ratio: 16 / 9, platform: 'YouTube' },
  { id: 'yt-short', name: 'YT Short', icon: 'i-simple-icons-youtube', ratio: 9 / 16, platform: 'YouTube' },
  { id: 'sq', name: 'Square', icon: 'i-lucide-square', ratio: 1 / 1, platform: 'General' },
  { id: 'hd', name: 'Widescreen', icon: 'i-lucide-monitor', ratio: 16 / 9, platform: 'General' }
]

const activePresets = computed(() => props.presets && props.presets.length > 0 ? props.presets : defaultPresets)

const activePreset = ref<string | null>(null)

const applyRatio = (preset: AspectPreset) => {
  activePreset.value = preset.id
  if (imgStudio) {
    imgStudio.aspectRatio.value = preset.ratio
    imgStudio.activateTool('stencil-rect')
  }
}
</script>

<template>
  <div :class="resUI.root()">
    <div v-if="!props.headless" :class="resUI.header()">
      <h3 :class="resUI.title()">
        Aspect Ratios
      </h3>
    </div>

    <div :class="resUI.grid()">
      <UButton
        v-for="preset in activePresets"
        :key="preset.id"
        :label="preset.name"
        :icon="preset.icon"
        :color="activePreset === preset.id ? 'primary' : 'neutral'"
        variant="soft"
        size="xs"
        :class="resUI.preset()"
        @click="applyRatio(preset)" />
    </div>
  </div>
</template>

<script lang="ts">
import { inject, computed } from 'vue'
import type { AppConfig } from '@nuxt/schema'
import theme from '../utils/themes/img-layer-manager'
import type { ComponentConfig } from '../types/tv'
import type { ImageEditorContext, Layer } from '../types/editor'
import { tv } from '../utils/tv'
import type { StudioAppConfig } from '../types/studio'

export type StudioLayers = ComponentConfig<typeof theme, AppConfig, 'studio'>

export interface StudioLayersProps {
  headless?: boolean
  ui?: StudioLayers['slots']
}
</script>

<script setup lang="ts">
const appConfig = useAppConfig() as StudioAppConfig

const props = defineProps<StudioLayersProps>()

const imgStudio = inject<ImageEditorContext>('imgStudio')

const resUI = computed(() => tv({ extend: tv(theme), ...(appConfig.ui?.layers || {}) })(props.ui))

const layers = computed(() => imgStudio?.layers.value || [])

const toggleVisibility = (layer: Layer) => {
  layer.visible = !layer.visible
}

const selectLayer = (layer: Layer) => {
  layers.value.forEach(l => l.active = false)
  layer.active = true
  if (layer.type === 'stencil') {
    imgStudio?.activateTool(layer.id)
  }
}

const deleteLayer = (id: string) => {
  if (imgStudio) {
    imgStudio.layers.value = imgStudio.layers.value.filter(l => l.id !== id)
  }
}

const getLayerIcon = (type: string) => {
  switch (type) {
    case 'stencil': return 'i-lucide-crop'
    case 'annotation': return 'i-lucide-pencil'
    case 'filter': return 'i-lucide-wand-2'
    default: return 'i-lucide-layers'
  }
}
</script>

<template>
  <div :class="resUI.root()">
    <div v-if="!props.headless" :class="resUI.header()">
      <h4 :class="resUI.title()">
        Layers
      </h4>
      <UButton
        icon="i-lucide-plus"
        variant="ghost"
        size="xs"
        color="neutral"
        :class="resUI.addButton()" />
    </div>

    <div :class="resUI.list()">
      <div
        v-for="layer in layers"
        :key="layer.id"
        :class="[
          resUI.item(),
          layer.active && resUI.itemActive(),
          !layer.visible && resUI.itemHidden(),
        ]"
        @click="selectLayer(layer)">
        <div
          :class="resUI.visibilityIcon()"
          @click.stop="toggleVisibility(layer)">
          <UIcon :name="layer.visible ? 'i-lucide-eye' : 'i-lucide-eye-off'" />
        </div>

        <div :class="resUI.thumbnail()">
          <UIcon :name="getLayerIcon(layer.type)" />
        </div>

        <div :class="resUI.content()">
          <span :class="resUI.name()">{{ layer.name }}</span>
          <span :class="resUI.type()">{{ layer.type }}</span>
        </div>

        <div
          v-if="layer.id !== 'base'"
          :class="resUI.deleteButton()"
          @click.stop="deleteLayer(layer.id)">
          <UIcon name="i-lucide-trash-2" />
        </div>
      </div>
    </div>
  </div>
</template>

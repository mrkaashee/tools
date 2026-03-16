<script setup lang="ts">
import { inject, computed } from 'vue'
import type { ImageEditorContext, Layer } from '../types/editor'

const imgEditor = inject<ImageEditorContext>('imgEditor')

const layers = computed(() => imgEditor?.layers.value || [])

const toggleVisibility = (layer: Layer) => {
  layer.visible = !layer.visible
}

const selectLayer = (layer: Layer) => {
  layers.value.forEach(l => l.active = false)
  layer.active = true
  if (layer.type === 'stencil') {
    imgEditor?.activateTool(layer.id)
  }
}

const deleteLayer = (id: string) => {
  if (imgEditor) {
    imgEditor.layers.value = imgEditor.layers.value.filter(l => l.id !== id)
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
  <div class="flex flex-col gap-3">
    <div class="flex items-center justify-between px-2">
      <h4 class="text-[10px] font-bold uppercase tracking-widest text-muted">
        Layers
      </h4>
      <UButton
        icon="i-lucide-plus"
        variant="ghost"
        size="xs"
        color="neutral" />
    </div>

    <div class="flex flex-col gap-1">
      <div
        v-for="layer in layers"
        :key="layer.id"
        class="flex items-center gap-3 p-2 bg-inverted/5 border border-transparent rounded-lg cursor-pointer transition-all duration-200 hover:bg-inverted/10 group"
        :class="{ 'is-active bg-primary/10 border-primary/30': layer.active, 'opacity-50': !layer.visible }"
        @click="selectLayer(layer)">
        <div
          class="text-muted text-sm transition-colors hover:text-highlighted group-[.is-active]:text-primary"
          @click.stop="toggleVisibility(layer)">
          <UIcon :name="layer.visible ? 'i-lucide-eye' : 'i-lucide-eye-off'" />
        </div>

        <div class="w-8 h-8 flex items-center justify-center bg-default rounded border border-muted text-muted transition-colors group-[.is-active]:bg-primary group-[.is-active]:text-inverted group-[.is-active]:border-primary">
          <UIcon :name="getLayerIcon(layer.type)" />
        </div>

        <div class="flex-1 flex flex-col overflow-hidden">
          <span class="text-[13px] font-medium text-default truncate">{{ layer.name }}</span>
          <span class="text-[10px] text-muted uppercase tracking-tight">{{ layer.type }}</span>
        </div>

        <div
          v-if="layer.id !== 'base'"
          class="opacity-0 group-hover:opacity-100 text-muted transition-all hover:text-error"
          @click.stop="deleteLayer(layer.id)">
          <UIcon name="i-lucide-trash-2" />
        </div>
      </div>
    </div>
  </div>
</template>

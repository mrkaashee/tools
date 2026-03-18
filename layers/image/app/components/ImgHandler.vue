<script lang="ts">
import { inject, computed } from 'vue'
import type { AppConfig } from '@nuxt/schema'
import theme from '../utils/themes/img-handler'
import type { ComponentConfig } from '../types/tv'
import type { ImageEditorContext } from '../types/editor'
import { tv } from '../utils/tv'
import { useAppConfig } from '#imports'

export type StudioHandler = ComponentConfig<typeof theme, AppConfig, 'handler'>

export interface ImgHandlerProps {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top' | 'bottom' | 'left' | 'right'
  active?: boolean
  ui?: StudioHandler['slots']
}
</script>

<script setup lang="ts">
const appConfig = useAppConfig() as StudioHandler['AppConfig']

const props = defineProps<ImgHandlerProps>()

const imgStudio = inject<ImageEditorContext>('imgStudio')
const handlerCfg = computed(() => imgStudio?.handlerCfg?.value ?? null)

const resUI = computed(() => tv({ extend: tv(theme), ...(appConfig.ui?.handler || {}) })({
  position: props.position,
  size: (handlerCfg.value?.size) || 'md',
  ...props.ui,
}))

const cursorMap = {
  'top-left': 'nw-resize',
  'top-right': 'ne-resize',
  'bottom-left': 'sw-resize',
  'bottom-right': 'se-resize',
  top: 'n-resize',
  bottom: 's-resize',
  left: 'w-resize',
  right: 'e-resize',
}

const dotStyle = computed(() => {
  const cfg = handlerCfg.value
  if (!cfg?.color && !cfg?.borderColor) return undefined
  return {
    ...(cfg.color ? { backgroundColor: cfg.color } : {}),
    ...(cfg.borderColor ? { borderColor: cfg.borderColor } : {}),
  }
})
</script>

<template>
  <div
    :class="[resUI.root(), { 'group is-active': props.active }, handlerCfg?.class]"
    :style="{ cursor: cursorMap[props.position] }">
    <!-- Inner Dot -->
    <div
      :class="[resUI.dot(), handlerCfg?.color ? '' : 'bg-primary border-white shadow-md shadow-primary/20']"
      :style="dotStyle" />

    <!-- Glow Effect -->
    <div :class="resUI.glow()" />
  </div>
</template>

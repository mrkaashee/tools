<script setup lang="ts">
import type { ImgHandlerProps } from '../types/editor'

defineProps<ImgHandlerProps>()

const cursorMap = {
  tl: 'nw-resize',
  tr: 'ne-resize',
  bl: 'sw-resize',
  br: 'se-resize',
  t: 'n-resize',
  b: 's-resize',
  l: 'w-resize',
  r: 'e-resize',
}

const posClasses = {
  tl: '-top-3 -left-3',
  tr: '-top-3 -right-3',
  bl: '-bottom-3 -left-3',
  br: '-bottom-3 -right-3',
  t: '-top-3 left-1/2 -translate-x-1/2',
  b: '-bottom-3 left-1/2 -translate-x-1/2',
  l: '-left-3 top-1/2 -translate-y-1/2',
  r: '-right-3 top-1/2 -translate-y-1/2',
}
</script>

<template>
  <div
    class="absolute w-6 h-6 flex items-center justify-center pointer-events-auto z-50 transition-transform duration-200 ease-in-out hover:scale-110"
    :class="[posClasses[position], { 'group is-active': active }]"
    :style="{ cursor: cursorMap[position] }">
    <!-- Inner Dot -->
    <div
      class="w-2.5 h-2.5 bg-white rounded-xs border-[1.5px] border-inverted relative z-10 transition-all duration-200 shadow-sm
             group-hover:bg-primary group-hover:border-white group-hover:rounded-full
             in-[.is-active]:bg-primary in-[.is-active]:border-white in-[.is-active]:shadow-[0_0_10px_--theme(--color-primary-500/0.5)]" />

    <!-- Glow Effect -->
    <div
      class="absolute inset-0 bg-[radial-gradient(circle,--theme(--color-primary-500/0.4)_0%,transparent_70%)] opacity-0 transition-opacity duration-300 pointer-events-none
             group-hover:opacity-100" />
  </div>
</template>

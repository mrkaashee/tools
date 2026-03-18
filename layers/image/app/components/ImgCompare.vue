<script lang="ts">
import { ref, onUnmounted, computed } from 'vue'
import { useEventListener } from '@vueuse/core'
import type { AppConfig } from '@nuxt/schema'
import theme from '../utils/themes/img-compare'
import type { ComponentConfig } from '../types/tv'
import { tv } from '../utils/tv'
import type { StudioAppConfig } from '../types/studio'

export type StudioCompare = ComponentConfig<typeof theme, AppConfig, 'studio'>

export interface StudioCompareProps {
  before: string
  after: string
  beforeLabel?: string
  afterLabel?: string
  ui?: StudioCompare['slots']
}
</script>

<script setup lang="ts">
const appConfig = useAppConfig() as StudioAppConfig

const props = defineProps<StudioCompareProps>()

const resUI = computed(() => tv({ extend: tv(theme), ...(appConfig.ui?.compare || {}) })(props.ui))

const sliderPosition = ref(50)
const containerRef = ref<HTMLElement | null>(null)
const isDragging = ref(false)
let stops: (() => void)[] = []

const cleanup = () => {
  stops.forEach(stop => stop())
  stops = []
}

const handlePointerMove = (event: PointerEvent) => {
  if (!isDragging.value || !containerRef.value) return

  const rect = containerRef.value.getBoundingClientRect()
  const x = event.clientX
  const relativeX = x - rect.left
  const position = Math.max(0, Math.min(100, (relativeX / (rect.width || 1)) * 100))

  sliderPosition.value = position
}

const startDragging = (event: PointerEvent) => {
  // Only handle primary pointer (usually left mouse button or first touch)
  if (event.button !== 0 && event.pointerType === 'mouse') return

  // Prevent default browser behavior (like image dragging or text selection)
  event.preventDefault()

  isDragging.value = true
  containerRef.value?.setPointerCapture(event.pointerId)

  stops.push(useEventListener(window, 'pointermove', handlePointerMove))
  stops.push(useEventListener(window, 'pointerup', stopDragging))
  stops.push(useEventListener(window, 'pointercancel', stopDragging))
}

const stopDragging = (event: PointerEvent) => {
  isDragging.value = false
  if (containerRef.value) {
    try {
      containerRef.value.releasePointerCapture(event.pointerId)
    }
    catch {
      // Ignore if pointer capture was already released
    }
  }

  cleanup()
}

onUnmounted(cleanup)
</script>

<template>
  <div
    ref="containerRef"
    :class="resUI.root()">
    <!-- After Image (Background) -->
    <img
      :src="after"
      :class="resUI.afterImage()"
      alt="After">

    <!-- Before Image (Overlay) -->
    <div
      :class="resUI.beforeWrapper()"
      :style="{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }">
      <img
        :src="before"
        :class="resUI.beforeImage()"
        alt="Before">
    </div>

    <!-- Slider Divider & Hit Area -->
    <div
      :class="resUI.slider()"
      :style="{ left: `${sliderPosition}%` }"
      @pointerdown="startDragging">
      <!-- Visual Line -->
      <div :class="resUI.divider()" />

      <!-- Visual Handle -->
      <div :class="resUI.handle()">
        <div :class="resUI.handleIcon()">
          <div :class="resUI.handleBar()" />
          <div :class="resUI.handleBar()" />
        </div>
      </div>
    </div>

    <!-- Labels (Click-through) -->
    <div v-if="beforeLabel" :class="resUI.labelBefore()">
      <UBadge
        color="neutral"
        variant="solid"
        :class="resUI.badge()">
        {{ beforeLabel }}
      </UBadge>
    </div>
    <div v-if="afterLabel" :class="resUI.labelAfter()">
      <UBadge
        color="primary"
        variant="solid"
        :class="resUI.badge()">
        {{ afterLabel }}
      </UBadge>
    </div>

    <!-- Hover Hint -->
    <div :class="resUI.hintWrapper()">
      <div :class="resUI.hint()">
        Drag slider to compare
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Prevent any default browser behavior that could cause hanging on double-tap */
.touch-none {
  touch-action: none;
}
</style>

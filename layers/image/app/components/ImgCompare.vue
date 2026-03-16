<script lang="ts" setup>
import { useEventListener } from '@vueuse/core'

defineProps<{
  before: string
  after: string
  beforeLabel?: string
  afterLabel?: string
}>()

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
    class="relative w-full h-full overflow-hidden select-none group rounded-lg">
    <!-- After Image (Background) -->
    <img
      :src="after"
      class="absolute inset-0 w-full h-full object-contain pointer-events-none"
      alt="After">

    <!-- Before Image (Overlay) -->
    <div
      class="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
      :style="{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }">
      <img
        :src="before"
        class="absolute inset-0 w-full h-full object-contain pointer-events-none"
        alt="Before">
    </div>

    <!-- Slider Divider & Hit Area -->
    <div
      class="absolute inset-y-0 z-20 w-10 -ml-5 cursor-ew-resize touch-none flex flex-col items-center group-hover:opacity-100 transition-opacity"
      :style="{ left: `${sliderPosition}%` }"
      @pointerdown="startDragging">
      <!-- Visual Line -->
      <div class="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-white/50 backdrop-blur-sm" />

      <!-- Visual Handle -->
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center border-4 border-primary z-30 transition-transform group-hover:scale-110 active:scale-95">
        <div class="flex gap-0.5 pointer-events-none">
          <div class="w-0.5 h-3 bg-primary rounded-full" />
          <div class="w-0.5 h-3 bg-primary rounded-full" />
        </div>
      </div>
    </div>

    <!-- Labels (Click-through) -->
    <div class="absolute top-4 left-4 z-30 pointer-events-none">
      <UBadge
        v-if="beforeLabel"
        color="neutral"
        variant="solid"
        class="backdrop-blur-md bg-black/40 text-white border-none text-[10px] uppercase tracking-wider">
        {{ beforeLabel }}
      </UBadge>
    </div>
    <div class="absolute top-4 right-4 z-30 pointer-events-none">
      <UBadge
        v-if="afterLabel"
        color="primary"
        variant="solid"
        class="backdrop-blur-md bg-primary/80 text-white border-none text-[10px] uppercase tracking-wider">
        {{ afterLabel }}
      </UBadge>
    </div>

    <!-- Hover Hint -->
    <div class="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
      <div class="px-3 py-1 bg-black/60 backdrop-blur-md text-white rounded-full text-[10px] font-medium">
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

<script lang="ts">
import { toRefs, ref, onMounted, onUnmounted, watch, inject, computed } from 'vue'
import { useResizeObserver, useEventListener } from '@vueuse/core'
import type { AppConfig } from '@nuxt/schema'
import theme from '../utils/themes/img-drawing'
import type { ComponentConfig } from '../types/tv'
import type { ImageEditorContext } from '../types/editor'
import type { ImgDrawingProps, ImgDrawingEmits } from '../types/drawing'
import { useDrawing } from '../composables/useDrawing'
import { useDrawingTools } from '../composables/useDrawingTools'
import { useDrawingHistory } from '../composables/useDrawingHistory'
import { normalizeInputEvent } from '../utils/inputHandler'
import { tv } from '../utils/tv'
import { useAppConfig } from '#imports'

export type StudioDrawing = ComponentConfig<typeof theme, AppConfig, 'drawing'>

export interface StudioDrawingProps extends ImgDrawingProps {
  ui?: StudioDrawing['slots']
}
</script>

<script lang="ts" setup>
/**
 * ImgDrawing Component
 *
 * Provides drawing and annotation capabilities for the image editor.
 * Uses dual-canvas strategy (base + overlay) for optimal performance.
 */

const appConfig = useAppConfig() as StudioDrawing['AppConfig']

const props = withDefaults(defineProps<StudioDrawingProps>(), {
  enableBrush: true,
  enableShapes: true,
  enableEraser: true,
  defaultTool: 'brush',
  defaultColor: '#000000',
  defaultStrokeWidth: 2,
  defaultOpacity: 100,
  maxHistorySize: 50,
})

const imgStudio = inject<ImageEditorContext>('imgStudio')

const resUI = computed(() => tv({ extend: tv(theme), ...(appConfig.ui?.drawing || {}) })({
  ...props.ui,
}))

// Destructure for template usage
const { enableBrush, enableShapes, enableEraser } = toRefs(props)

const emit = defineEmits<ImgDrawingEmits>()

// Canvas refs
const containerRef = ref<HTMLDivElement>()
const baseCanvasRef = ref<HTMLCanvasElement | null>(null)
const overlayCanvasRef = ref<HTMLCanvasElement | null>(null)

// Container size tracking
const containerWidth = ref(0)
const containerHeight = ref(0)

// Initialize composables
const drawing = useDrawing()
const tools = useDrawingTools(
  drawing.properties,
  overlayCanvasRef,
  drawing.addLayer,
  drawing.renderLayer,
  drawing.removeLayer,
  drawing.getLayerAtPoint,
  drawing.renderAllLayers,
)
const history = useDrawingHistory(
  props.maxHistorySize,
  drawing.addLayer,
  drawing.removeLayer,
  drawing.clearAllLayers,
  drawing.setApplyingHistory,
)

// Active state
const isActive = ref(false)

/**
 * Initialize canvas sizing with useResizeObserver
 */
useResizeObserver(containerRef, entries => {
  const entry = entries[0]
  if (!entry) return
  const { width, height } = entry.contentRect
  containerWidth.value = width
  containerHeight.value = height

  // Update canvas sizes
  if (baseCanvasRef.value) {
    baseCanvasRef.value.width = width
    baseCanvasRef.value.height = height
  }
  if (overlayCanvasRef.value) {
    overlayCanvasRef.value.width = width
    overlayCanvasRef.value.height = height
  }

  // Update drawing canvas size
  drawing.setImageSize(width, height)
})

/**
 * Initialize drawing system
 */
const initializeDrawing = () => {
  if (!baseCanvasRef.value || !overlayCanvasRef.value)
    return

  // Initialize canvases
  drawing.initializeCanvas(baseCanvasRef.value, overlayCanvasRef.value)

  // Initial properties and history
  drawing.properties.value = {
    strokeColor: props.defaultColor,
    fillColor: props.defaultColor,
    strokeWidth: props.defaultStrokeWidth,
    opacity: props.defaultOpacity,
    enableFill: false,
  }
  tools.selectTool(props.defaultTool)
  history.maxHistorySize.value = props.maxHistorySize

  // Load current image into base canvas
  const state = imgStudio?.getImageState()
  if (state?.current) {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      if (baseCanvasRef.value) {
        const ctx = baseCanvasRef.value.getContext('2d')
        if (ctx) {
          baseCanvasRef.value.width = img.naturalWidth
          baseCanvasRef.value.height = img.naturalHeight
          if (overlayCanvasRef.value) {
            overlayCanvasRef.value.width = img.naturalWidth
            overlayCanvasRef.value.height = img.naturalHeight
          }
          ctx.drawImage(img, 0, 0)
          drawing.setImageSize(img.naturalWidth, img.naturalHeight)
        }
      }
    }
    img.src = state.current
  }
}

const applyDrawing = (): Promise<string | null> => {
  return new Promise(resolve => {
    if (!baseCanvasRef.value) return resolve(null)

    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = baseCanvasRef.value.width
    tempCanvas.height = baseCanvasRef.value.height
    const tempCtx = tempCanvas.getContext('2d')

    if (tempCtx) {
      try {
        tempCtx.drawImage(baseCanvasRef.value, 0, 0)
        if (overlayCanvasRef.value) {
          tempCtx.drawImage(overlayCanvasRef.value, 0, 0)
        }
        resolve(tempCanvas.toDataURL())
      }
      catch (e) {
        console.error('ImgDrawing: Failed to export drawing (canvas may be tainted)', e)
        resolve(null)
      }
    }
    else {
      resolve(null)
    }
  })
}

const applyDrawingHook = async () => {
  if (!isActive.value) return
  const finalImage = await applyDrawing()
  if (finalImage) {
    imgStudio?.commit(finalImage, 'drawing')
  }
  isActive.value = false
}

watch(isActive, val => {
  if (val) {
    imgStudio?.registerApplyHook(applyDrawingHook)
  }
  else {
    imgStudio?.unregisterApplyHook(applyDrawingHook)
  }
}, { immediate: true })

/**
 * Activate drawing mode
 */
const activate = () => {
  if (isActive.value)
    return

  isActive.value = true
  initializeDrawing()
}

/**
 * Deactivate drawing mode and commit changes
 */
const deactivate = async () => {
  await applyDrawingHook()
}

/**
 * Handle mouse/touch start events
 */
const handlePointerDown = (event: MouseEvent | TouchEvent) => {
  if (!isActive.value || !baseCanvasRef.value)
    return

  // Prevent default for touch events to avoid scrolling
  if (event.type.startsWith('touch')) {
    event.preventDefault()
  }

  // Normalize input coordinates
  const point = normalizeInputEvent(event, baseCanvasRef.value)

  // Set drawing state
  drawing.isDrawing.value = true

  // Handle draw start
  tools.handleDrawStart(point)
}

/**
 * Handle mouse/touch move events
 */
const handlePointerMove = (event: MouseEvent | TouchEvent) => {
  if (!baseCanvasRef.value)
    return

  // Normalize input coordinates
  const point = normalizeInputEvent(event, baseCanvasRef.value)

  // Handle draw move (works for both drawing and hover)
  if (drawing.isDrawing.value || tools.activeTool.value === 'eraser') {
    tools.handleDrawMove(point)
  }
}

/**
 * Handle mouse/touch end events
 */
const handlePointerUp = (event: MouseEvent | TouchEvent) => {
  if (!isActive.value || !drawing.isDrawing.value || !baseCanvasRef.value)
    return

  // Normalize input coordinates
  const point = normalizeInputEvent(event, baseCanvasRef.value)

  // Set drawing state
  drawing.isDrawing.value = false

  // Handle draw end
  tools.handleDrawEnd(point)
}

/**
 * Handle keyboard shortcuts
 */
const handleKeyDown = (event: KeyboardEvent) => {
  if (!isActive.value)
    return

  // B for brush
  if (event.key === 'b' || event.key === 'B') {
    if (props.enableBrush) {
      tools.selectTool('brush')
      event.preventDefault()
    }
  }
  // E for eraser
  else if (event.key === 'e' || event.key === 'E') {
    if (props.enableEraser) {
      tools.selectTool('eraser')
      event.preventDefault()
    }
  }
  // R for rectangle
  else if (event.key === 'r' || event.key === 'R') {
    if (props.enableShapes) {
      tools.selectTool('rectangle')
      event.preventDefault()
    }
  }
  // C for circle
  else if (event.key === 'c' || event.key === 'C') {
    if (props.enableShapes) {
      tools.selectTool('circle')
      event.preventDefault()
    }
  }
  // L for line
  else if (event.key === 'l' || event.key === 'L') {
    if (props.enableShapes) {
      tools.selectTool('line')
      event.preventDefault()
    }
  }
  // A for arrow
  else if (event.key === 'a' || event.key === 'A') {
    if (props.enableShapes) {
      tools.selectTool('arrow')
      event.preventDefault()
    }
  }
  // Shift key for shape constraints
  else if (event.key === 'Shift') {
    tools.updateToolOptions({ constrainShapes: true })
  }
}

/**
 * Handle keyboard key up
 */
const handleKeyUp = (event: KeyboardEvent) => {
  if (!isActive.value)
    return

  // Release Shift key constraint
  if (event.key === 'Shift') {
    tools.updateToolOptions({ constrainShapes: false })
  }
}

/**
 * Setup event listeners
 */
const setupEventListeners = () => {
  // Mouse events
  useEventListener(containerRef, 'mousedown', handlePointerDown)
  useEventListener(containerRef, 'mousemove', handlePointerMove)
  useEventListener(containerRef, 'mouseup', handlePointerUp)
  useEventListener(containerRef, 'mouseleave', handlePointerUp)

  // Touch events
  useEventListener(containerRef, 'touchstart', handlePointerDown, { passive: false })
  useEventListener(containerRef, 'touchmove', handlePointerMove, { passive: false })
  useEventListener(containerRef, 'touchend', handlePointerUp)
  useEventListener(containerRef, 'touchcancel', handlePointerUp)

  // Keyboard events
  useEventListener(window, 'keydown', handleKeyDown)
  useEventListener(window, 'keyup', handleKeyUp)
}

// Watch for layer changes and emit events
watch(() => drawing.layers.value.length, (newLength, oldLength) => {
  if (newLength > oldLength) {
    const newLayer = drawing.layers.value[newLength - 1]
    if (newLayer) {
      emit('layer-added', newLayer.id)
    }
  }
  else if (newLength < oldLength) {
    emit('layer-removed', '')
  }
})

// Watch for tool changes and emit events
watch(() => tools.activeTool.value, newTool => {
  if (newTool) {
    emit('tool-change', newTool)
  }
})

// Watch for property changes and emit events
watch(() => drawing.properties.value, newProperties => {
  emit('properties-change', { ...newProperties })
}, { deep: true })

// Lifecycle
onMounted(() => {
  initializeDrawing()
  setupEventListeners()
})

onUnmounted(() => {
  deactivate()
})

// Exposed methods for programmatic control
defineExpose({
  activate,
  deactivate,
  // Expose composable state for external access
  drawing,
  tools,
  history,
  isActive,
})
</script>

<template>
  <div :class="resUI.root()">
    <!-- Drawing Controls Panel -->
    <div v-if="isActive" :class="resUI.controls()">
      <!-- Tool Selector -->
      <div :class="resUI.toolGroup()">
        <UButton
          v-if="enableBrush"
          icon="i-lucide-pencil"
          :color="tools.activeTool.value === 'brush' ? 'primary' : 'neutral'"
          variant="ghost"
          title="Brush (B)"
          @click="tools.selectTool('brush')" />
        <UButton
          v-if="enableShapes"
          icon="i-lucide-square"
          :color="tools.activeTool.value === 'rectangle' ? 'primary' : 'neutral'"
          variant="ghost"
          title="Rectangle (R)"
          @click="tools.selectTool('rectangle')" />
        <UButton
          v-if="enableShapes"
          icon="i-lucide-circle"
          :color="tools.activeTool.value === 'circle' ? 'primary' : 'neutral'"
          variant="ghost"
          title="Circle (C)"
          @click="tools.selectTool('circle')" />
        <UButton
          v-if="enableShapes"
          icon="i-lucide-minus"
          :color="tools.activeTool.value === 'line' ? 'primary' : 'neutral'"
          variant="ghost"
          title="Line (L)"
          @click="tools.selectTool('line')" />
        <UButton
          v-if="enableShapes"
          icon="i-lucide-arrow-right"
          :color="tools.activeTool.value === 'arrow' ? 'primary' : 'neutral'"
          variant="ghost"
          title="Arrow (A)"
          @click="tools.selectTool('arrow')" />
        <UButton
          v-if="enableEraser"
          icon="i-lucide-eraser"
          :color="tools.activeTool.value === 'eraser' ? 'primary' : 'neutral'"
          variant="ghost"
          title="Eraser (E)"
          @click="tools.selectTool('eraser')" />
      </div>

      <!-- Drawing Properties -->
      <div :class="resUI.properties()">
        <div :class="resUI.propertyItem()">
          <label :class="resUI.propertyLabel()">Color</label>
          <input
            v-model="drawing.properties.value.strokeColor"
            type="color"
            :class="resUI.propertyInput()">
        </div>
        <div :class="resUI.propertyItem() + ' ' + resUI.propertySlider()">
          <label :class="resUI.propertyLabel()">Width: {{ drawing.properties.value.strokeWidth }}</label>
          <USlider
            v-model="drawing.properties.value.strokeWidth"
            :min="1"
            :max="50"
            size="sm"
            class="flex-1" />
        </div>
        <div :class="resUI.propertyItem() + ' ' + resUI.propertySlider()">
          <label :class="resUI.propertyLabel()">Opacity: {{ drawing.properties.value.opacity }}%</label>
          <USlider
            v-model="drawing.properties.value.opacity"
            :min="0"
            :max="100"
            size="sm"
            class="flex-1" />
        </div>
        <div :class="resUI.propertyItem()">
          <UCheckbox
            v-model="drawing.properties.value.enableFill"
            label="Fill"
            size="xs" />
          <input
            v-if="drawing.properties.value.enableFill"
            v-model="drawing.properties.value.fillColor"
            type="color"
            :class="resUI.propertyInput()">
        </div>
      </div>

      <!-- Undo/Redo Controls -->
      <div :class="resUI.historyGroup()">
        <UButton
          icon="i-lucide-undo-2"
          color="neutral"
          variant="ghost"
          :disabled="!history.canUndo.value"
          title="Undo"
          @click="history.undo()" />
        <UButton
          icon="i-lucide-redo-2"
          color="neutral"
          variant="ghost"
          :disabled="!history.canRedo.value"
          title="Redo"
          @click="history.redo()" />
      </div>
    </div>

    <!-- Canvas Container -->
    <div
      ref="containerRef"
      :class="resUI.canvasContainer()">
      <canvas
        ref="baseCanvasRef"
        :class="resUI.baseCanvas()" />
      <canvas
        ref="overlayCanvasRef"
        :class="resUI.overlayCanvas()" />
    </div>
  </div>
</template>

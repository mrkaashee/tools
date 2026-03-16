<script setup lang="ts">
import type { ImageEditorContext, AnnotationData, TextAnnotation } from '../types/editor'
import ImgHandler from './ImgHandler.vue'

const imgEditor = inject<ImageEditorContext>('imgEditor')

const {
  activeTool: activeAnnotationTool,
  annotations,
  selectedId,
  selectedAnnotation,
  properties,
  isDrawing,
  currentAnnotation,
  selectTool,
  handlePointerDown: annotatePointerDown,
  handlePointerMove: annotatePointerMove,
  handlePointerUp: annotatePointerUp,
  removeAnnotation,
  clearAll,
  initiateMove,
  initiateResize,
  renderToCanvas
} = useAnnotate(computed(() => imgEditor?.zoomLevel.value || 1))

const isActive = computed(() => imgEditor?.activeTool.value === 'annotate')

const startAnnotating = (tool: 'rect' | 'circle' | 'arrow' | 'text') => {
  selectTool(tool)
  imgEditor?.activateTool('annotate')
}

const applyAnnotations = async () => {
  if (!imgEditor || annotations.value.length === 0) return

  const canvas = imgEditor.getCanvas()
  if (!canvas) return

  const svg = document.querySelector('.u-img-annotate-svg') as SVGSVGElement
  if (!svg) return

  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = canvas.width
  tempCanvas.height = canvas.height
  const ctx = tempCanvas.getContext('2d')
  if (ctx) {
    ctx.drawImage(canvas, 0, 0)
    await renderToCanvas(tempCanvas, svg)
    imgEditor.commit(tempCanvas, 'annotate')
    clearAll()
    imgEditor.deactivateTool()
  }
}

// Register hook
watch(isActive, val => {
  if (val) {
    imgEditor?.registerApplyHook(applyAnnotations)
  }
  else {
    imgEditor?.unregisterApplyHook(applyAnnotations)
    selectTool(null)
  }
}, { immediate: true })

const handlePointerDown = (e: MouseEvent) => {
  if (!isActive.value || !imgEditor) return
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const x = (e.clientX - rect.left) / imgEditor.zoomLevel.value
  const y = (e.clientY - rect.top) / imgEditor.zoomLevel.value
  annotatePointerDown(x, y)
}

const handlePointerMove = (e: MouseEvent) => {
  if (!isDrawing.value || !imgEditor) return
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const x = (e.clientX - rect.left) / imgEditor.zoomLevel.value
  const y = (e.clientY - rect.top) / imgEditor.zoomLevel.value
  annotatePointerMove(x, y)
}

const handlePointerUp = () => {
  annotatePointerUp()
}

// Helpers for template positioning
const getDeleteY = (ann: AnnotationData) => {
  if (ann.type === 'rect') return ann.y - 40
  if (ann.type === 'circle') return ann.y - ann.radius - 40
  return ann.y - 40
}
const getCircleHandleX = (ann: AnnotationData) => (ann.type === 'circle' ? ann.x + ann.radius - 12 : 0)
const getCircleHandleY = (ann: AnnotationData) => (ann.type === 'circle' ? ann.y + ann.radius - 12 : 0)

onUnmounted(() => {
  imgEditor?.unregisterApplyHook(applyAnnotations)
})
</script>

<template>
  <div class="space-y-4 select-none">
    <div class="flex items-center justify-between">
      <h3 class="text-[10px] font-bold uppercase tracking-widest text-muted">
        Annotations
      </h3>
      <UBadge
        v-if="isActive"
        color="primary"
        size="xs"
        variant="subtle">
        {{ activeAnnotationTool || 'Select Tool' }}
      </UBadge>
    </div>

    <div class="grid grid-cols-4 gap-2">
      <UButton
        icon="i-lucide-square"
        :color="activeAnnotationTool === 'rect' ? 'primary' : 'neutral'"
        variant="soft"
        @click="startAnnotating('rect')" />
      <UButton
        icon="i-lucide-circle"
        :color="activeAnnotationTool === 'circle' ? 'primary' : 'neutral'"
        variant="soft"
        @click="startAnnotating('circle')" />
      <UButton
        icon="i-lucide-arrow-right"
        :color="activeAnnotationTool === 'arrow' ? 'primary' : 'neutral'"
        variant="soft"
        @click="startAnnotating('arrow')" />
      <UButton
        icon="i-lucide-type"
        :color="activeAnnotationTool === 'text' ? 'primary' : 'neutral'"
        variant="soft"
        @click="startAnnotating('text')" />
    </div>

    <div v-if="isActive" class="space-y-4 border-t border-default pt-4">
      <!-- Properties Grid -->
      <div v-if="selectedAnnotation" class="bg-muted p-2 rounded-lg space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-bold uppercase text-primary">Selected: {{ selectedAnnotation.type }}</span>
          <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="xs" @click="removeAnnotation(selectedId!)" />
        </div>

        <div v-if="selectedAnnotation.type === 'text'" class="space-y-2">
          <label class="text-[10px] text-muted uppercase font-medium">Text Content</label>
          <UInput v-model="(selectedAnnotation as TextAnnotation).text" size="xs" />

          <div class="grid grid-cols-2 gap-2">
            <div class="space-y-1">
              <label class="text-[10px] text-muted uppercase font-medium">Size</label>
              <UInput v-model.number="(selectedAnnotation as TextAnnotation).fontSize" type="number" size="xs" />
            </div>
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-[10px] text-muted uppercase font-medium">Color</label>
          <div class="flex gap-2">
            <input v-model="selectedAnnotation.fill" type="color" class="h-6 w-6 rounded border-0 p-0">
            <UInput v-model="selectedAnnotation.fill" size="xs" class="flex-1" />
          </div>
        </div>
      </div>

      <!-- Global Props & Buttons -->
      <div class="space-y-2">
        <label class="text-[10px] text-muted uppercase font-medium">Global Stroke</label>
        <div class="flex gap-2">
          <input
            v-model="properties.stroke"
            type="color"
            class="h-8 w-8 rounded border-0 p-0">
          <UInput
            v-model="properties.stroke"
            size="xs"
            class="flex-1" />
        </div>
      </div>

      <div class="flex gap-2">
        <UButton
          label="Clear"
          color="neutral"
          variant="ghost"
          class="flex-1"
          @click="clearAll" />
        <UButton
          label="Done"
          color="primary"
          class="flex-1"
          @click="imgEditor?.deactivateTool()" />
      </div>

      <div v-if="annotations.length > 0" class="pt-2">
        <UButton
          label="Apply Permanently"
          variant="outline"
          block
          size="xs"
          @click="applyAnnotations" />
      </div>
    </div>

    <Teleport v-if="isActive && imgEditor?.overlayRef.value" :to="imgEditor.overlayRef.value">
      <svg
        class="u-img-annotate-svg absolute inset-0 w-full h-full pointer-events-auto overflow-visible"
        style="cursor: crosshair;"
        @mousedown="handlePointerDown"
        @mousemove="handlePointerMove"
        @mouseup="handlePointerUp">
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orientation="auto">
            <polygon
              points="0 0, 10 3.5, 0 7"
              :fill="properties.stroke" />
          </marker>
        </defs>

        <!-- Existing Annotations -->
        <g
          v-for="ann in annotations"
          :key="ann.id"
          class="cursor-grab transition-all duration-200"
          :class="{ 'cursor-grabbing group is-selected': selectedId === ann.id }"
          @mousedown.stop="initiateMove($event, ann)">
          <rect
            v-if="ann.type === 'rect'"
            :x="ann.x"
            :y="ann.y"
            :width="ann.width"
            :height="ann.height"
            :fill="ann.fill"
            :stroke="ann.stroke"
            :stroke-width="ann.strokeWidth"
            class="transition-all duration-200 group-[.is-selected]:stroke-primary group-[.is-selected]:[stroke-dasharray:4] group-[.is-selected]:animate-[svg-dash_10s_linear_infinite]" />

          <circle
            v-else-if="ann.type === 'circle'"
            :cx="ann.x"
            :cy="ann.y"
            :r="ann.radius"
            :fill="ann.fill"
            :stroke="ann.stroke"
            :stroke-width="ann.strokeWidth"
            class="transition-all duration-200 group-[.is-selected]:stroke-primary group-[.is-selected]:[stroke-dasharray:4] group-[.is-selected]:animate-[svg-dash_10s_linear_infinite]" />

          <line
            v-else-if="ann.type === 'arrow'"
            :x1="ann.x"
            :y1="ann.y"
            :x2="ann.x2"
            :y2="ann.y2"
            :stroke="ann.stroke"
            :stroke-width="ann.strokeWidth"
            marker-end="url(#arrowhead)"
            class="transition-all duration-200 group-[.is-selected]:stroke-primary group-[.is-selected]:[stroke-dasharray:4] group-[.is-selected]:animate-[svg-dash_10s_linear_infinite]" />

          <text
            v-else-if="ann.type === 'text'"
            :x="ann.x"
            :y="ann.y"
            :fill="ann.fill"
            :font-size="ann.fontSize"
            font-family="sans-serif"
            dominant-baseline="hanging"
            class="transition-all duration-200">
            {{ ann.text }}
          </text>

          <!-- Resize Handles (visible on selected) -->
          <template v-if="selectedId === ann.id">
            <template v-if="ann.type === 'rect'">
              <foreignObject :x="ann.x - 12" :y="ann.y - 12" width="24" height="24">
                <ImgHandler position="tl" @mousedown="initiateResize($event, ann, 'tl')" />
              </foreignObject>
              <foreignObject :x="ann.x + ann.width - 12" :y="ann.y - 12" width="24" height="24">
                <ImgHandler position="tr" @mousedown="initiateResize($event, ann, 'tr')" />
              </foreignObject>
              <foreignObject :x="ann.x - 12" :y="ann.y + ann.height - 12" width="24" height="24">
                <ImgHandler position="bl" @mousedown="initiateResize($event, ann, 'bl')" />
              </foreignObject>
              <foreignObject :x="ann.x + ann.width - 12" :y="ann.y + ann.height - 12" width="24" height="24">
                <ImgHandler position="br" @mousedown="initiateResize($event, ann, 'br')" />
              </foreignObject>
            </template>

            <template v-else-if="ann.type === 'circle'">
              <foreignObject :x="getCircleHandleX(ann)" :y="getCircleHandleY(ann)" width="24" height="24">
                <ImgHandler position="br" @mousedown="initiateResize($event, ann, 'radius')" />
              </foreignObject>
            </template>
          </template>

          <!-- Delete Handle (visible on selected) -->
          <foreignObject
            v-if="selectedId === ann.id"
            :x="ann.type === 'rect' ? ann.x + ann.width / 2 - 12 : ann.x - 12"
            :y="getDeleteY(ann)"
            width="24"
            height="24">
            <UButton
              icon="i-lucide-trash-2"
              color="error"
              variant="solid"
              size="xs"
              class="rounded-full p-1!"
              @click.stop="removeAnnotation(ann.id)" />
          </foreignObject>
        </g>

        <!-- Current Drawing Preview -->
        <g v-if="currentAnnotation" class="pointer-events-none opacity-50">
          <rect
            v-if="currentAnnotation.type === 'rect'"
            :x="currentAnnotation.x"
            :y="currentAnnotation.y"
            :width="currentAnnotation.width"
            :height="currentAnnotation.height"
            :fill="currentAnnotation.fill"
            :stroke="currentAnnotation.stroke"
            :stroke-width="currentAnnotation.strokeWidth" />

          <circle
            v-else-if="currentAnnotation.type === 'circle'"
            :cx="currentAnnotation.x"
            :cy="currentAnnotation.y"
            :r="currentAnnotation.radius"
            :fill="currentAnnotation.fill"
            :stroke="currentAnnotation.stroke"
            :stroke-width="currentAnnotation.strokeWidth" />

          <line
            v-else-if="currentAnnotation.type === 'arrow'"
            :x1="currentAnnotation.x"
            :y1="currentAnnotation.y"
            :x2="currentAnnotation.x2"
            :y2="currentAnnotation.y2"
            :stroke="currentAnnotation.stroke"
            :stroke-width="currentAnnotation.strokeWidth"
            marker-end="url(#arrowhead)" />
        </g>
      </svg>
    </Teleport>
  </div>
</template>

<style>
@keyframes svg-dash {
  to {
    stroke-dashoffset: 100;
  }
}
</style>

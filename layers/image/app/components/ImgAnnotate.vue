<script lang="ts">
import { computed, watch, onUnmounted, inject } from 'vue'
import type { AppConfig } from '@nuxt/schema'
import theme from '../utils/themes/img-annotate'
import type { ComponentConfig } from '../types/tv'
import { useAnnotate } from '../composables/useAnnotate'
import { getEventPoint } from '../utils/interaction'
import type { ImageEditorContext, AnnotationData, TextAnnotation } from '../types/editor'
import type { StudioAppConfig } from '../types/studio'
import { tv } from '../utils/tv'
import ImgHandler from './ImgHandler.vue'

export type StudioAnnotate = ComponentConfig<typeof theme, AppConfig, 'studio'>

export interface StudioAnnotateProps {
  headless?: boolean
  tools?: ('rect' | 'circle' | 'arrow' | 'text')[]
  ui?: StudioAnnotate['slots']
}
</script>

<script setup lang="ts">
const appConfig = useAppConfig() as StudioAppConfig

const props = defineProps<StudioAnnotateProps>()

const imgStudio = inject<ImageEditorContext>('imgStudio')

const resUI = computed(() => tv({ extend: tv(theme), ...(appConfig.ui?.annotate || {}) })(props.ui))

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
} = useAnnotate(computed(() => imgStudio?.zoomLevel.value || 1))

const isActive = computed(() => imgStudio?.activeTool.value === 'annotate')

const startAnnotating = (tool: 'rect' | 'circle' | 'arrow' | 'text') => {
  selectTool(tool)
  imgStudio?.activateTool('annotate')
}

const applyAnnotations = async () => {
  if (!imgStudio || annotations.value.length === 0) return

  const canvas = imgStudio.getCanvas()
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
    imgStudio.commit(tempCanvas, 'annotate')
    clearAll()
    imgStudio.deactivateTool()
  }
}

// Register hook
watch(isActive, val => {
  if (val) {
    imgStudio?.registerApplyHook(applyAnnotations)
  }
  else {
    imgStudio?.unregisterApplyHook(applyAnnotations)
    selectTool(null)
  }
}, { immediate: true })

const handlePointerDown = (e: MouseEvent | TouchEvent) => {
  if (!isActive.value || !imgStudio) return
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const p = getEventPoint(e)
  if (!p) return
  const x = (p.clientX - rect.left) / imgStudio.zoomLevel.value
  const y = (p.clientY - rect.top) / imgStudio.zoomLevel.value
  annotatePointerDown(x, y)
}

const handlePointerMove = (e: MouseEvent | TouchEvent) => {
  if (!isDrawing.value || !imgStudio) return
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const p = getEventPoint(e)
  if (!p) return
  const x = (p.clientX - rect.left) / imgStudio.zoomLevel.value
  const y = (p.clientY - rect.top) / imgStudio.zoomLevel.value
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
  imgStudio?.unregisterApplyHook(applyAnnotations)
})
</script>

<template>
  <div :class="resUI.root()">
    <div v-if="!props.headless" :class="resUI.header()">
      <h3 :class="resUI.title()">
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

    <div v-if="!props.headless" :class="resUI.toolGrid()">
      <UButton
        v-if="!props.tools || props.tools.includes('rect')"
        icon="i-lucide-square"
        :color="activeAnnotationTool === 'rect' ? 'primary' : 'neutral'"
        variant="soft"
        :class="resUI.toolButton()"
        @click="startAnnotating('rect')" />
      <UButton
        v-if="!props.tools || props.tools.includes('circle')"
        icon="i-lucide-circle"
        :color="activeAnnotationTool === 'circle' ? 'primary' : 'neutral'"
        variant="soft"
        :class="resUI.toolButton()"
        @click="startAnnotating('circle')" />
      <UButton
        v-if="!props.tools || props.tools.includes('arrow')"
        icon="i-lucide-arrow-right"
        :color="activeAnnotationTool === 'arrow' ? 'primary' : 'neutral'"
        variant="soft"
        :class="resUI.toolButton()"
        @click="startAnnotating('arrow')" />
      <UButton
        v-if="!props.tools || props.tools.includes('text')"
        icon="i-lucide-type"
        :color="activeAnnotationTool === 'text' ? 'primary' : 'neutral'"
        variant="soft"
        :class="resUI.toolButton()"
        @click="startAnnotating('text')" />
    </div>

    <div v-if="isActive && !props.headless" :class="resUI.globalProps()">
      <!-- Properties Grid -->
      <div v-if="selectedAnnotation" :class="resUI.properties()">
        <div :class="resUI.propHeader()">
          <span :class="resUI.propTitle()">Selected: {{ selectedAnnotation.type }}</span>
          <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="xs" @click="removeAnnotation(selectedId!)" />
        </div>

        <div v-if="selectedAnnotation.type === 'text'" class="space-y-2">
          <label :class="resUI.inputLabel()">Text Content</label>
          <UInput v-model="(selectedAnnotation as TextAnnotation).text" size="xs" :class="resUI.input()" />

          <div class="grid grid-cols-2 gap-2">
            <div class="space-y-1">
              <label :class="resUI.inputLabel()">Size</label>
              <UInput v-model.number="(selectedAnnotation as TextAnnotation).fontSize" type="number" size="xs" :class="resUI.input()" />
            </div>
          </div>
        </div>

        <div class="space-y-2">
          <label :class="resUI.inputLabel()">Color</label>
          <div class="flex gap-2">
            <input v-model="selectedAnnotation.fill" type="color" :class="resUI.colorPicker()">
            <UInput v-model="selectedAnnotation.fill" size="xs" class="flex-1" :class="resUI.input()" />
          </div>
        </div>
      </div>

      <!-- Global Props & Buttons -->
      <div class="space-y-2">
        <label :class="resUI.inputLabel()">Global Stroke</label>
        <div class="flex gap-2">
          <input
            v-model="properties.stroke"
            type="color"
            :class="resUI.colorPicker() + ' h-8 w-8' /* Ad-hoc resize for global */">
          <UInput
            v-model="properties.stroke"
            size="xs"
            class="flex-1"
            :class="resUI.input()" />
        </div>
      </div>

      <div :class="resUI.actionButtons()">
        <UButton
          label="Cancel"
          color="neutral"
          variant="ghost"
          class="flex-1"
          @click="imgStudio?.cancelTool()" />
        <UButton
          label="Done"
          color="primary"
          class="flex-1"
          @click="imgStudio?.deactivateTool()" />
      </div>

      <div v-if="annotations.length > 0" :class="resUI.applyButton()">
        <UButton
          label="Apply Permanently"
          variant="outline"
          block
          size="xs"
          @click="applyAnnotations" />
      </div>
    </div>

    <Teleport v-if="isActive && imgStudio?.overlayRef.value" :to="imgStudio.overlayRef.value">
      <svg
        :class="resUI.svg()"
        style="cursor: crosshair;"
        @mousedown.stop="handlePointerDown"
        @touchstart.stop="handlePointerDown"
        @mousemove="handlePointerMove"
        @touchmove="handlePointerMove"
        @mouseup="handlePointerUp"
        @touchend="handlePointerUp">
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
          @mousedown.stop="initiateMove($event, ann)"
          @touchstart.stop="initiateMove($event, ann)">
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
                <ImgHandler position="top-left" @mousedown.stop="initiateResize($event, ann, 'top-left')" @touchstart.stop="initiateResize($event, ann, 'top-left')" />
              </foreignObject>
              <foreignObject :x="ann.x + ann.width - 12" :y="ann.y - 12" width="24" height="24">
                <ImgHandler position="top-right" @mousedown.stop="initiateResize($event, ann, 'top-right')" @touchstart.stop="initiateResize($event, ann, 'top-right')" />
              </foreignObject>
              <foreignObject :x="ann.x - 12" :y="ann.y + ann.height - 12" width="24" height="24">
                <ImgHandler position="bottom-left" @mousedown.stop="initiateResize($event, ann, 'bottom-left')" @touchstart.stop="initiateResize($event, ann, 'bottom-left')" />
              </foreignObject>
              <foreignObject :x="ann.x + ann.width - 12" :y="ann.y + ann.height - 12" width="24" height="24">
                <ImgHandler position="bottom-right" @mousedown.stop="initiateResize($event, ann, 'bottom-right')" @touchstart.stop="initiateResize($event, ann, 'bottom-right')" />
              </foreignObject>
            </template>

            <template v-else-if="ann.type === 'circle'">
              <foreignObject :x="getCircleHandleX(ann)" :y="getCircleHandleY(ann)" width="24" height="24">
                <ImgHandler position="bottom-right" @mousedown.stop="initiateResize($event, ann, 'radius')" @touchstart.stop="initiateResize($event, ann, 'radius')" />
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
              @click.stop="removeAnnotation(ann.id)"
              @touchstart.stop="removeAnnotation(ann.id)" />
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

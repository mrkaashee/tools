<script setup lang="ts">
/**
 * BACKWARD COMPATIBILITY PROXY
 * This component acts as a proxy for ImgStudio.
 * All props, slots, and emits are forwarded transparently.
 */
import type { ImageState, ChangeEvent } from '../types/editor'
import ImgStudio from './ImgStudio.vue'

// Accept any props so legacy usage stays unchanged
const props = defineProps<Record<string, unknown>>()
const emit = defineEmits<{
  (e: 'load', payload: ImageState): void
  (e: 'change', payload: ChangeEvent): void
  (e: 'export', payload: Blob): void
  (e: 'update:activeTool', tool: string | null): void
}>()

const studioRef = ref<InstanceType<typeof ImgStudio> | null>(null)

// Expose all of ImgStudio's public API through the proxy
defineExpose({
  // State
  get imageState() { return studioRef.value?.imageState },
  get canvasRef() { return studioRef.value?.canvasRef },
  get imageRef() { return studioRef.value?.imageRef },
  get activeTool() { return studioRef.value?.activeTool },
  get zoomLevel() { return studioRef.value?.zoomLevel },
  get panX() { return studioRef.value?.panX },
  get panY() { return studioRef.value?.panY },
  get overlayRef() { return studioRef.value?.overlayRef },
  get layers() { return studioRef.value?.layers },
  get canvasPreviewStyle() { return studioRef.value?.canvasPreviewStyle },
  get aspectRatio() { return studioRef.value?.aspectRatio },
  get panBounds() { return studioRef.value?.panBounds },
  get hasImage() { return studioRef.value?.hasImage },
  get isWorkerProcessing() { return studioRef.value?.isWorkerProcessing },
  get canUndo() { return studioRef.value?.canUndo },
  get canRedo() { return studioRef.value?.canRedo },
  // Methods
  loadImage: (src: string, ...rest: unknown[]) => (studioRef.value as any)?.loadImage(src, ...rest),
  updateCanvas: (data: string | HTMLCanvasElement, ...rest: unknown[]) => (studioRef.value as any)?.updateCanvas(data, ...rest),
  activateTool: (tool: string) => studioRef.value?.activateTool(tool),
  deactivateTool: () => studioRef.value?.deactivateTool(),
  cancelTool: () => studioRef.value?.cancelTool(),
  getCanvas: () => studioRef.value?.getCanvas(),
  getImageState: () => studioRef.value?.getImageState(),
  commit: (data: string | HTMLCanvasElement, tool: string) => studioRef.value?.commit(data, tool),
  onFileChange: (event: Event) => studioRef.value?.onFileChange(event),
  triggerFileInput: () => studioRef.value?.triggerFileInput(),
  undo: () => studioRef.value?.undo(),
  redo: () => studioRef.value?.redo(),
  resetAll: () => studioRef.value?.resetAll(),
  zoomIn: () => studioRef.value?.zoomIn(),
  zoomOut: () => studioRef.value?.zoomOut(),
  zoomTo: (level: number) => studioRef.value?.zoomTo(level),
  resetZoom: () => studioRef.value?.resetZoom(),
  processImage: (imageData: ImageData, settings: unknown) => (studioRef.value as any)?.processImage(imageData, settings),
  registerApplyHook: (fn: () => void | Promise<void>) => studioRef.value?.registerApplyHook(fn),
  unregisterApplyHook: (fn: () => void | Promise<void>) => studioRef.value?.unregisterApplyHook(fn),
  applyAndExport: (filename?: string) => studioRef.value?.applyAndExport(filename),
})
</script>

<template>
  <ImgStudio
    ref="studioRef"
    v-bind="props"
    @load="emit('load', $event)"
    @change="emit('change', $event)"
    @export="emit('export', $event)"
    @update:active-tool="emit('update:activeTool', $event)">
    <template v-for="(_, name) in $slots" #[name]="slotData">
      <slot :name="name" v-bind="slotData" />
    </template>
  </ImgStudio>
</template>

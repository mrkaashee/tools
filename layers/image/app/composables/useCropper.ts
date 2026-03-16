import { ref, computed } from 'vue'
import { useCropperTransform } from './useCropperTransform'
import type { TransformOptions, TransformChangeEvent } from '../types/cropper'

export interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

export interface ImageSize {
  width: number
  height: number
}

export interface DisplayGeometry {
  scale: number
  baseScale: number
  zoomScale: number
  left: number
  top: number
  imgW: number
  imgH: number
}

export type CropperMode = 'move-box' | 'move-image' | 'fixed'
export type CropperShape = 'rectangle' | 'circle'

export interface UseCropperOptions {
  mode: CropperMode
  shape: CropperShape
  aspectRatio: number
  minWidth: number
  minHeight: number
  maxWidth: number
  maxHeight: number
  initialCropPercent: number
  enableZoom: boolean
  minZoom: number
  maxZoom: number
  zoomStep: number
  zoomSpeed: number
  // Transform options
  enableRotation?: boolean
  enableFlip?: boolean
  rotationStep?: number
  transformDuration?: number
}

export function useCropper(
  options: UseCropperOptions,
  zoomScale?: Ref<number>,
  emit?: (event: 'transform-change', payload: TransformChangeEvent) => void
) {
  const containerSize = ref<ImageSize>({ width: 0, height: 0 })
  const imgNatural = ref<ImageSize>({ width: 0, height: 0 })
  const imageLoaded = ref(false)
  const imageError = ref(false)
  const isInteracting = ref(false)

  // move-box mode: box position & size in image pixels
  const crop = ref<CropArea>({ x: 0, y: 0, width: 100, height: 100 })

  // move-image mode: image pan coordinates
  const imagePan = ref({ x: 0, y: 0 })
  const moveImageCropSize = ref<ImageSize>({ width: 200, height: 200 })

  // Effective aspect ratio (circle forces 1:1)
  const effectiveAspectRatio = computed(() =>
    options.shape === 'circle' ? 1 : options.aspectRatio
  )

  // Display geometry (image-to-screen scale) with zoom support
  const display = computed<DisplayGeometry>(() => {
    const cw = containerSize.value.width
    const ch = containerSize.value.height
    const iw = imgNatural.value.width
    const ih = imgNatural.value.height
    if (!cw || !ch || !iw || !ih) return { scale: 1, baseScale: 1, zoomScale: 1, left: 0, top: 0, imgW: 0, imgH: 0 }

    const baseScale = Math.min(cw / iw, ch / ih)
    const zoom = zoomScale?.value ?? 1
    const scale = baseScale * zoom
    const imgW = iw * scale
    const imgH = ih * scale
    const left = (cw - imgW) / 2
    const top = (ch - imgH) / 2
    return { scale, baseScale, zoomScale: zoom, left, top, imgW, imgH }
  })

  // Initialize transform composable
  const transformOptions: TransformOptions = {
    enableRotation: options.enableRotation,
    enableFlip: options.enableFlip,
    rotationStep: options.rotationStep,
    transformDuration: options.transformDuration,
  }

  const transform = useCropperTransform(
    imgNatural,
    crop,
    transformOptions,
    emit || (() => {})
  )

  const initializeCrop = () => {
    const iw = imgNatural.value.width
    const ih = imgNatural.value.height
    const ar = effectiveAspectRatio.value || 0

    if (options.mode === 'move-image') {
      let w = Math.min(iw, ih) * (options.initialCropPercent / 100)
      let h = ar ? w / ar : w
      if (h > ih) { h = ih; w = ar ? h * ar : h }
      if (w > iw) { w = iw; h = ar ? w / ar : h }
      if (w > options.maxWidth) { w = options.maxWidth; h = ar ? w / ar : w }
      if (h > options.maxHeight) { h = options.maxHeight; w = ar ? h * ar : h }
      moveImageCropSize.value = { width: w, height: h }
      imagePan.value = { x: (iw - w) / 2, y: (ih - h) / 2 }
    }
    else {
      let w = Math.min(iw, ih) * (options.initialCropPercent / 100)
      let h = ar ? w / ar : w
      if (h > ih) { h = ih; w = ar ? h * ar : h }
      if (w > iw) { w = iw; h = ar ? w / ar : h }
      if (w > options.maxWidth) { w = options.maxWidth; h = ar ? w / ar : w }
      if (h > options.maxHeight) { h = options.maxHeight; w = ar ? h * ar : h }
      crop.value = { x: (iw - w) / 2, y: (ih - h) / 2, width: w, height: h }
    }
  }

  const getCurrentCoordinates = (): CropArea => {
    if (options.mode === 'move-image') {
      return {
        x: imagePan.value.x,
        y: imagePan.value.y,
        width: moveImageCropSize.value.width,
        height: moveImageCropSize.value.height,
      }
    }
    return { ...crop.value }
  }

  return {
    // State
    containerSize,
    imgNatural,
    imageLoaded,
    imageError,
    isInteracting,
    crop,
    imagePan,
    moveImageCropSize,

    // Computed
    effectiveAspectRatio,
    display,

    // Methods
    initializeCrop,
    getCurrentCoordinates,

    // Transform state and methods
    transformState: transform.transformState,
    canRotate: transform.canRotate,
    canFlip: transform.canFlip,
    rotateRight: transform.rotateRight,
    rotateLeft: transform.rotateLeft,
    rotateTo: transform.rotateTo,
    flipHorizontal: transform.flipHorizontal,
    flipVertical: transform.flipVertical,
    resetTransforms: transform.resetTransforms,
    getTransformState: transform.getTransformState,
    getTransformCSS: transform.getTransformCSS,
  }
}

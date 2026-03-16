import { ref, computed, type Ref } from 'vue'
import type { ImageSize } from '../types/cropper'

export interface ZoomOptions {
  minZoom: number
  maxZoom: number
  zoomStep: number
  zoomSpeed: number
}

export function useCropperZoom(
  imgNatural: Ref<ImageSize>,
  containerSize: Ref<ImageSize>,
  options: ZoomOptions
) {
  const zoomLevel = ref(1)
  const zoomOrigin = ref({ x: 0.5, y: 0.5 }) // normalized 0-1

  // Calculate base scale (fit to container)
  const baseScale = computed(() => {
    const cw = containerSize.value.width
    const ch = containerSize.value.height
    const iw = imgNatural.value.width
    const ih = imgNatural.value.height
    if (!cw || !ch || !iw || !ih) return 1
    return Math.min(cw / iw, ch / ih)
  })

  // Actual display scale including zoom
  const displayScale = computed(() => baseScale.value * zoomLevel.value)

  // Zoomed image dimensions
  const zoomedImageSize = computed(() => ({
    width: imgNatural.value.width * displayScale.value,
    height: imgNatural.value.height * displayScale.value,
  }))

  // Check if image is larger than container (needs panning)
  const needsPanning = computed(() => {
    return (
      zoomedImageSize.value.width > containerSize.value.width
      || zoomedImageSize.value.height > containerSize.value.height
    )
  })

  // Zoom constraints
  const canZoomIn = computed(() => zoomLevel.value < options.maxZoom)
  const canZoomOut = computed(() => zoomLevel.value > options.minZoom)

  // Zoom percentage for display
  const zoomPercentage = computed(() => Math.round(zoomLevel.value * 100))

  /**
   * Set zoom level with constraints
   */
  const setZoom = (level: number, origin?: { x: number, y: number }) => {
    const oldZoom = zoomLevel.value
    zoomLevel.value = Math.max(options.minZoom, Math.min(options.maxZoom, level))

    if (origin) {
      zoomOrigin.value = origin
    }

    return {
      oldZoom,
      newZoom: zoomLevel.value,
      changed: oldZoom !== zoomLevel.value,
    }
  }

  /**
   * Zoom in by step
   */
  const zoomIn = (step?: number) => {
    return setZoom(zoomLevel.value + (step ?? options.zoomStep))
  }

  /**
   * Zoom out by step
   */
  const zoomOut = (step?: number) => {
    return setZoom(zoomLevel.value - (step ?? options.zoomStep))
  }

  /**
   * Zoom to specific level
   */
  const zoomTo = (level: number, origin?: { x: number, y: number }) => {
    return setZoom(level, origin)
  }

  /**
   * Fit image to container (reset zoom)
   */
  const fitToContainer = () => {
    return setZoom(1, { x: 0.5, y: 0.5 })
  }

  /**
   * Fill container (zoom to cover)
   */
  const fillContainer = () => {
    const cw = containerSize.value.width
    const ch = containerSize.value.height
    const iw = imgNatural.value.width
    const ih = imgNatural.value.height
    if (!cw || !ch || !iw || !ih) return { changed: false }

    const scaleToFill = Math.max(cw / iw, ch / ih)
    const zoomToFill = scaleToFill / baseScale.value
    return setZoom(zoomToFill, { x: 0.5, y: 0.5 })
  }

  /**
   * Zoom to 100% (actual size)
   */
  const actualSize = () => {
    const actualZoom = 1 / baseScale.value
    return setZoom(actualZoom, { x: 0.5, y: 0.5 })
  }

  /**
   * Reset zoom to initial state
   */
  const resetZoom = () => {
    return fitToContainer()
  }

  /**
   * Handle mouse wheel zoom
   */
  const handleWheel = (e: WheelEvent, cursorPos?: { x: number, y: number }) => {
    e.preventDefault()

    const delta = -Math.sign(e.deltaY)
    const zoomChange = delta * options.zoomSpeed
    const newZoom = zoomLevel.value + zoomChange

    // Calculate zoom origin from cursor position
    let origin = { x: 0.5, y: 0.5 }
    if (cursorPos && containerSize.value.width && containerSize.value.height) {
      origin = {
        x: cursorPos.x / containerSize.value.width,
        y: cursorPos.y / containerSize.value.height,
      }
    }

    return setZoom(newZoom, origin)
  }

  /**
   * Handle pinch zoom (touch)
   */
  const handlePinch = (scale: number, center?: { x: number, y: number }) => {
    const newZoom = zoomLevel.value * scale

    let origin = { x: 0.5, y: 0.5 }
    if (center && containerSize.value.width && containerSize.value.height) {
      origin = {
        x: center.x / containerSize.value.width,
        y: center.y / containerSize.value.height,
      }
    }

    return setZoom(newZoom, origin)
  }

  return {
    // State
    zoomLevel,
    zoomOrigin,

    // Computed
    baseScale,
    displayScale,
    zoomedImageSize,
    needsPanning,
    canZoomIn,
    canZoomOut,
    zoomPercentage,

    // Methods
    setZoom,
    zoomIn,
    zoomOut,
    zoomTo,
    fitToContainer,
    fillContainer,
    actualSize,
    resetZoom,
    handleWheel,
    handlePinch,
  }
}

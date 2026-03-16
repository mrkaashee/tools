import { computed, type Ref } from 'vue'
import type { CropArea, ImageSize, DisplayGeometry, CropperMode } from './useCropper'
import type { TransformState } from '../types/cropper'

export function useCropperStyles(
  crop: Ref<CropArea>,
  imagePan: Ref<{ x: number, y: number }>,
  moveImageCropSize: Ref<ImageSize>,
  containerSize: Ref<ImageSize>,
  display: Ref<DisplayGeometry>,
  mode: CropperMode,
  transformState?: Ref<Readonly<TransformState>>,
  transformDuration?: number
) {
  /**
   * Check if user prefers reduced motion
   */
  const prefersReducedMotion = (): boolean => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  /**
   * Generate CSS transform string combining rotation and flip
   */
  const getTransformCSS = (): string => {
    if (!transformState) return 'none'

    const transforms: string[] = []
    const state = transformState.value

    if (state.flipHorizontal) {
      transforms.push('scaleX(-1)')
    }
    if (state.flipVertical) {
      transforms.push('scaleY(-1)')
    }
    if (state.rotation !== 0) {
      transforms.push(`rotate(${state.rotation}deg)`)
    }

    return transforms.length > 0 ? transforms.join(' ') : 'none'
  }

  const imageStyle = computed(() => {
    const { scale, left, top, imgW, imgH } = display.value
    const baseStyle: Record<string, string> = {}

    if (mode === 'move-image') {
      const cw = containerSize.value.width
      const ch = containerSize.value.height
      const sw = moveImageCropSize.value.width * scale
      const sh = moveImageCropSize.value.height * scale
      const stL = (cw - sw) / 2
      const stT = (ch - sh) / 2
      baseStyle.left = `${stL - imagePan.value.x * scale}px`
      baseStyle.top = `${stT - imagePan.value.y * scale}px`
      baseStyle.width = `${imgW}px`
      baseStyle.height = `${imgH}px`
    }
    else {
      baseStyle.left = `${left}px`
      baseStyle.top = `${top}px`
      baseStyle.width = `${imgW}px`
      baseStyle.height = `${imgH}px`
    }

    // Add transform properties if transform state is provided
    if (transformState) {
      baseStyle.transform = getTransformCSS()
      baseStyle.transformOrigin = 'center center'

      // Apply transition duration (default 300ms if not provided)
      // Respect prefers-reduced-motion: apply transformations instantly if user prefers reduced motion
      if (!prefersReducedMotion()) {
        const duration = transformDuration ?? 300
        baseStyle.transition = `transform ${duration}ms ease-out`
      }
    }

    return baseStyle
  })

  const stencilStyle = computed(() => {
    const { scale, left, top } = display.value
    if (mode === 'move-image') {
      const cw = containerSize.value.width
      const ch = containerSize.value.height
      const sw = moveImageCropSize.value.width * scale
      const sh = moveImageCropSize.value.height * scale
      return {
        width: `${sw}px`,
        height: `${sh}px`,
        transform: `translate(${(cw - sw) / 2}px, ${(ch - sh) / 2}px)`,
      }
    }

    // Stencil size scales with zoom
    const stencilW = crop.value.width * scale
    const stencilH = crop.value.height * scale

    // Calculate stencil center in image coordinates
    const cropCenterX = crop.value.x + crop.value.width / 2
    const cropCenterY = crop.value.y + crop.value.height / 2

    // Convert to screen coordinates (with zoom)
    const screenCenterX = left + cropCenterX * scale
    const screenCenterY = top + cropCenterY * scale

    // Position stencil so its center aligns with the crop center
    const stencilX = screenCenterX - stencilW / 2
    const stencilY = screenCenterY - stencilH / 2

    return {
      width: `${stencilW}px`,
      height: `${stencilH}px`,
      transform: `translate(${stencilX}px, ${stencilY}px)`,
    }
  })

  const stencilImageStyle = computed(() => {
    const { scale, imgW, imgH } = display.value
    const baseStyle: Record<string, string> = {}

    if (mode === 'move-image') {
      baseStyle.width = `${imgW}px`
      baseStyle.height = `${imgH}px`
      baseStyle.transform = `translate(${-imagePan.value.x * scale}px, ${-imagePan.value.y * scale}px)`
    }
    else {
      baseStyle.width = `${imgW}px`
      baseStyle.height = `${imgH}px`
      baseStyle.transform = `translate(${-crop.value.x * scale}px, ${-crop.value.y * scale}px)`
    }

    // Add transform properties if transform state is provided
    if (transformState) {
      const transformCSS = getTransformCSS()
      // Combine translate with rotation/flip transforms
      if (transformCSS !== 'none') {
        baseStyle.transform = `${baseStyle.transform} ${transformCSS}`
      }
      baseStyle.transformOrigin = 'center center'

      // Apply transition duration (default 300ms if not provided)
      // Respect prefers-reduced-motion: apply transformations instantly if user prefers reduced motion
      if (!prefersReducedMotion()) {
        const duration = transformDuration ?? 300
        baseStyle.transition = `transform ${duration}ms ease-out`
      }
    }

    return baseStyle
  })

  return {
    imageStyle,
    stencilStyle,
    stencilImageStyle,
  }
}

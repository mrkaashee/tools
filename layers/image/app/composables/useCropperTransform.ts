import { ref, computed, readonly, type Ref } from 'vue'
import type { ImageSize, CropArea } from './useCropper'
import type { TransformState, TransformOptions, TransformChangeEvent } from '../types/cropper'

/**
 * Default transform options
 */
const DEFAULT_TRANSFORM_OPTIONS: Required<TransformOptions> = {
  enableRotation: true,
  enableFlip: true,
  rotationStep: 90,
  transformDuration: 300,
}

/**
 * Composable for managing image transformations (rotation and flip)
 *
 * @param imgNatural - Reactive reference to natural image dimensions
 * @param crop - Reactive reference to crop area
 * @param options - Transform configuration options
 * @param emit - Event emitter function for transform-change events
 * @returns Transform state and methods
 */
export function useCropperTransform(
  imgNatural: Ref<ImageSize>,
  crop: Ref<CropArea>,
  options: TransformOptions,
  emit: (event: 'transform-change', payload: TransformChangeEvent) => void
) {
  // Validate and merge options with defaults
  const validatedOptions = validateOptions(options)

  // Reactive transform state with default values
  const transformState = ref<TransformState>({
    rotation: 0,
    flipHorizontal: false,
    flipVertical: false,
  })

  // Computed properties for feature availability
  const canRotate = computed(() => validatedOptions.enableRotation)
  const canFlip = computed(() => validatedOptions.enableFlip)

  /**
   * Normalize angle to [0, 359] range
   */
  const normalizeAngle = (angle: number): number => {
    if (typeof angle !== 'number' || isNaN(angle) || !isFinite(angle)) {
      return 0
    }
    let normalized = angle % 360
    // Handle negative angles
    if (normalized < 0) {
      normalized += 360
    }
    // Handle edge case where normalized is exactly 360 (due to floating point)
    if (normalized >= 360) {
      normalized = 0
    }
    // Convert -0 to +0
    return normalized === 0 ? 0 : normalized
  }

  /**
   * Rotate image to a specific angle
   */
  const rotateTo = (angle: number): void => {
    if (!canRotate.value) return

    const normalizedAngle = normalizeAngle(angle)
    transformState.value.rotation = normalizedAngle

    emit('transform-change', {
      type: 'rotate',
      state: { ...transformState.value },
    })
  }

  /**
   * Rotate image clockwise by rotation step
   */
  const rotateRight = (): void => {
    if (!canRotate.value) return

    const newAngle = transformState.value.rotation + validatedOptions.rotationStep
    rotateTo(newAngle)
  }

  /**
   * Rotate image counter-clockwise by rotation step
   */
  const rotateLeft = (): void => {
    if (!canRotate.value) return

    const newAngle = transformState.value.rotation - validatedOptions.rotationStep
    rotateTo(newAngle)
  }

  /**
   * Toggle horizontal flip
   */
  const flipHorizontal = (): void => {
    if (!canFlip.value) return

    transformState.value.flipHorizontal = !transformState.value.flipHorizontal

    emit('transform-change', {
      type: 'flip-horizontal',
      state: { ...transformState.value },
    })
  }

  /**
   * Toggle vertical flip
   */
  const flipVertical = (): void => {
    if (!canFlip.value) return

    transformState.value.flipVertical = !transformState.value.flipVertical

    emit('transform-change', {
      type: 'flip-vertical',
      state: { ...transformState.value },
    })
  }

  /**
   * Reset all transformations to default values
   */
  const resetTransforms = (): void => {
    transformState.value.rotation = 0
    transformState.value.flipHorizontal = false
    transformState.value.flipVertical = false

    emit('transform-change', {
      type: 'reset',
      state: { ...transformState.value },
    })
  }

  /**
   * Get current transform state (readonly copy)
   */
  const getTransformState = (): Readonly<TransformState> => {
    return { ...transformState.value }
  }

  /**
   * Generate CSS transform string for visual preview
   */
  const getTransformCSS = (): string => {
    const transforms: string[] = []

    if (transformState.value.flipHorizontal) {
      transforms.push('scaleX(-1)')
    }
    if (transformState.value.flipVertical) {
      transforms.push('scaleY(-1)')
    }
    if (transformState.value.rotation !== 0) {
      transforms.push(`rotate(${transformState.value.rotation}deg)`)
    }

    return transforms.length > 0 ? transforms.join(' ') : 'none'
  }

  return {
    // Reactive state (readonly)
    transformState: readonly(transformState),

    // Computed properties
    canRotate,
    canFlip,

    // Methods
    rotateRight,
    rotateLeft,
    rotateTo,
    flipHorizontal,
    flipVertical,
    resetTransforms,
    getTransformState,
    getTransformCSS,
  }
}

/**
 * Validate and apply defaults to transform options
 */
function validateOptions(options: TransformOptions): Required<TransformOptions> {
  const validated: Required<TransformOptions> = { ...DEFAULT_TRANSFORM_OPTIONS }

  // Validate enableRotation
  if (typeof options.enableRotation === 'boolean') {
    validated.enableRotation = options.enableRotation
  }

  // Validate enableFlip
  if (typeof options.enableFlip === 'boolean') {
    validated.enableFlip = options.enableFlip
  }

  // Validate rotationStep (must be in range [1, 360])
  if (
    typeof options.rotationStep === 'number'
    && !isNaN(options.rotationStep)
    && options.rotationStep >= 1
    && options.rotationStep <= 360
  ) {
    validated.rotationStep = options.rotationStep
  }

  // Validate transformDuration (must be non-negative)
  if (
    typeof options.transformDuration === 'number'
    && !isNaN(options.transformDuration)
    && options.transformDuration >= 0
  ) {
    validated.transformDuration = options.transformDuration
  }

  return validated
}

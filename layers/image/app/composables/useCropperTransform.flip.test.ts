import { describe, test, expect, vi } from 'vitest'
import { ref } from 'vue'
import { useCropperTransform } from './useCropperTransform'
import type { ImageSize, CropArea } from './useCropper'
import type { TransformOptions } from '../types/cropper'

/**
 * Test helper for creating transform composable with defaults
 */
function createTestTransform(options?: Partial<TransformOptions>) {
  const imgNatural = ref<ImageSize>({ width: 800, height: 600 })
  const crop = ref<CropArea>({ x: 100, y: 100, width: 200, height: 200 })
  const emit = vi.fn()
  return {
    transform: useCropperTransform(imgNatural, crop, options || {}, emit),
    emit,
    imgNatural,
    crop,
  }
}

describe('useCropperTransform - Flip Methods (Task 2.5)', () => {
  /**
   * Requirement 3.1: WHEN the user triggers flip horizontal action,
   * THE Cropper_Component SHALL flip the image along the vertical axis
   */
  test('flipHorizontal toggles horizontal flip state', () => {
    const { transform } = createTestTransform()

    // Initial state should be false
    expect(transform.transformState.value.flipHorizontal).toBe(false)

    // First flip
    transform.flipHorizontal()
    expect(transform.transformState.value.flipHorizontal).toBe(true)

    // Second flip (toggle back)
    transform.flipHorizontal()
    expect(transform.transformState.value.flipHorizontal).toBe(false)
  })

  /**
   * Requirement 3.2: WHEN horizontal flip is applied,
   * THE Cropper_Component SHALL update the Transform_State to toggle the horizontal flip status
   */
  test('flipHorizontal updates transform state', () => {
    const { transform } = createTestTransform()

    transform.flipHorizontal()
    const state = transform.getTransformState()
    expect(state.flipHorizontal).toBe(true)
  })

  /**
   * Requirement 3.3: WHEN horizontal flip is applied multiple times,
   * THE Cropper_Component SHALL toggle between flipped and normal states
   */
  test('flipHorizontal toggles correctly multiple times', () => {
    const { transform } = createTestTransform()

    // Apply flip 5 times
    for (let i = 0; i < 5; i++) {
      transform.flipHorizontal()
      const expected = (i + 1) % 2 === 1 // Odd = true, Even = false
      expect(transform.transformState.value.flipHorizontal).toBe(expected)
    }
  })

  /**
   * Requirement 4.1: WHEN the user triggers flip vertical action,
   * THE Cropper_Component SHALL flip the image along the horizontal axis
   */
  test('flipVertical toggles vertical flip state', () => {
    const { transform } = createTestTransform()

    // Initial state should be false
    expect(transform.transformState.value.flipVertical).toBe(false)

    // First flip
    transform.flipVertical()
    expect(transform.transformState.value.flipVertical).toBe(true)

    // Second flip (toggle back)
    transform.flipVertical()
    expect(transform.transformState.value.flipVertical).toBe(false)
  })

  /**
   * Requirement 4.2: WHEN vertical flip is applied,
   * THE Cropper_Component SHALL update the Transform_State to toggle the vertical flip status
   */
  test('flipVertical updates transform state', () => {
    const { transform } = createTestTransform()

    transform.flipVertical()
    const state = transform.getTransformState()
    expect(state.flipVertical).toBe(true)
  })

  /**
   * Requirement 4.3: WHEN vertical flip is applied multiple times,
   * THE Cropper_Component SHALL toggle between flipped and normal states
   */
  test('flipVertical toggles correctly multiple times', () => {
    const { transform } = createTestTransform()

    // Apply flip 5 times
    for (let i = 0; i < 5; i++) {
      transform.flipVertical()
      const expected = (i + 1) % 2 === 1 // Odd = true, Even = false
      expect(transform.transformState.value.flipVertical).toBe(expected)
    }
  })

  /**
   * Requirement 9.2: WHERE flip is disabled,
   * THE Cropper_Component SHALL not apply flip transformations
   */
  test('flipHorizontal respects enableFlip configuration (disabled)', () => {
    const { transform } = createTestTransform({ enableFlip: false })

    // Initial state
    expect(transform.transformState.value.flipHorizontal).toBe(false)

    // Try to flip - should be no-op
    transform.flipHorizontal()
    expect(transform.transformState.value.flipHorizontal).toBe(false)

    // Try multiple times - should remain false
    transform.flipHorizontal()
    transform.flipHorizontal()
    expect(transform.transformState.value.flipHorizontal).toBe(false)
  })

  /**
   * Requirement 9.4: WHEN enableFlip is set to false,
   * THE Cropper_Component SHALL ignore flip method calls
   */
  test('flipVertical respects enableFlip configuration (disabled)', () => {
    const { transform } = createTestTransform({ enableFlip: false })

    // Initial state
    expect(transform.transformState.value.flipVertical).toBe(false)

    // Try to flip - should be no-op
    transform.flipVertical()
    expect(transform.transformState.value.flipVertical).toBe(false)

    // Try multiple times - should remain false
    transform.flipVertical()
    transform.flipVertical()
    expect(transform.transformState.value.flipVertical).toBe(false)
  })

  /**
   * Requirement 9.1: WHERE flip is enabled,
   * THE Cropper_Component SHALL expose flip methods
   */
  test('flip methods are exposed when enabled', () => {
    const { transform } = createTestTransform({ enableFlip: true })

    expect(typeof transform.flipHorizontal).toBe('function')
    expect(typeof transform.flipVertical).toBe('function')
    expect(transform.canFlip.value).toBe(true)
  })

  /**
   * Test that both flip methods work independently
   */
  test('flipHorizontal and flipVertical work independently', () => {
    const { transform } = createTestTransform()

    // Flip horizontal only
    transform.flipHorizontal()
    expect(transform.transformState.value.flipHorizontal).toBe(true)
    expect(transform.transformState.value.flipVertical).toBe(false)

    // Flip vertical only
    transform.flipVertical()
    expect(transform.transformState.value.flipHorizontal).toBe(true)
    expect(transform.transformState.value.flipVertical).toBe(true)

    // Toggle horizontal back
    transform.flipHorizontal()
    expect(transform.transformState.value.flipHorizontal).toBe(false)
    expect(transform.transformState.value.flipVertical).toBe(true)
  })

  /**
   * Test that flip methods emit transform-change events
   */
  test('flipHorizontal emits transform-change event', () => {
    const { transform, emit } = createTestTransform()

    transform.flipHorizontal()

    expect(emit).toHaveBeenCalledWith('transform-change', {
      type: 'flip-horizontal',
      state: {
        rotation: 0,
        flipHorizontal: true,
        flipVertical: false,
      },
    })
  })

  /**
   * Test that flip methods emit transform-change events
   */
  test('flipVertical emits transform-change event', () => {
    const { transform, emit } = createTestTransform()

    transform.flipVertical()

    expect(emit).toHaveBeenCalledWith('transform-change', {
      type: 'flip-vertical',
      state: {
        rotation: 0,
        flipHorizontal: false,
        flipVertical: true,
      },
    })
  })

  /**
   * Test that flip methods do not emit events when disabled
   */
  test('flip methods do not emit events when enableFlip is false', () => {
    const { transform, emit } = createTestTransform({ enableFlip: false })

    transform.flipHorizontal()
    transform.flipVertical()

    expect(emit).not.toHaveBeenCalled()
  })

  /**
   * Requirement 3.4, 4.4: WHEN flip is applied,
   * THE Cropper_Component SHALL preserve the Crop_Box dimensions and relative position
   */
  test('flip preserves crop box dimensions', () => {
    const { transform, crop } = createTestTransform()

    const initialWidth = crop.value.width
    const initialHeight = crop.value.height
    const initialX = crop.value.x
    const initialY = crop.value.y

    // Apply horizontal flip
    transform.flipHorizontal()
    expect(crop.value.width).toBe(initialWidth)
    expect(crop.value.height).toBe(initialHeight)
    expect(crop.value.x).toBe(initialX)
    expect(crop.value.y).toBe(initialY)

    // Apply vertical flip
    transform.flipVertical()
    expect(crop.value.width).toBe(initialWidth)
    expect(crop.value.height).toBe(initialHeight)
    expect(crop.value.x).toBe(initialX)
    expect(crop.value.y).toBe(initialY)
  })

  /**
   * Requirement 3.5, 4.5: WHEN flip is combined with rotation,
   * THE Cropper_Component SHALL apply both transformations correctly
   */
  test('flip works correctly with rotation', () => {
    const { transform } = createTestTransform()

    // Apply rotation
    transform.rotateTo(90)
    expect(transform.transformState.value.rotation).toBe(90)

    // Apply horizontal flip
    transform.flipHorizontal()
    expect(transform.transformState.value.rotation).toBe(90)
    expect(transform.transformState.value.flipHorizontal).toBe(true)

    // Apply vertical flip
    transform.flipVertical()
    expect(transform.transformState.value.rotation).toBe(90)
    expect(transform.transformState.value.flipHorizontal).toBe(true)
    expect(transform.transformState.value.flipVertical).toBe(true)

    // Verify all transformations are preserved
    const state = transform.getTransformState()
    expect(state.rotation).toBe(90)
    expect(state.flipHorizontal).toBe(true)
    expect(state.flipVertical).toBe(true)
  })

  /**
   * Test CSS transform generation includes flip transformations
   */
  test('getTransformCSS includes flip transformations', () => {
    const { transform } = createTestTransform()

    // No transformations
    expect(transform.getTransformCSS()).toBe('none')

    // Horizontal flip only
    transform.flipHorizontal()
    expect(transform.getTransformCSS()).toBe('scaleX(-1)')

    // Add vertical flip
    transform.flipVertical()
    expect(transform.getTransformCSS()).toBe('scaleX(-1) scaleY(-1)')

    // Add rotation
    transform.rotateTo(45)
    expect(transform.getTransformCSS()).toBe('scaleX(-1) scaleY(-1) rotate(45deg)')
  })
})

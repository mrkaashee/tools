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

describe('useCropperTransform - Reset and State Getter Methods (Task 2.7)', () => {
  /**
   * Test resetTransforms() method
   * Requirements: 5.1, 5.2, 5.3, 5.4
   */
  test('resetTransforms() resets rotation to 0', () => {
    const { transform } = createTestTransform()

    // Apply some rotation
    transform.rotateTo(45)
    expect(transform.transformState.value.rotation).toBe(45)

    // Reset
    transform.resetTransforms()
    expect(transform.transformState.value.rotation).toBe(0)
  })

  test('resetTransforms() resets flipHorizontal to false', () => {
    const { transform } = createTestTransform()

    // Apply horizontal flip
    transform.flipHorizontal()
    expect(transform.transformState.value.flipHorizontal).toBe(true)

    // Reset
    transform.resetTransforms()
    expect(transform.transformState.value.flipHorizontal).toBe(false)
  })

  test('resetTransforms() resets flipVertical to false', () => {
    const { transform } = createTestTransform()

    // Apply vertical flip
    transform.flipVertical()
    expect(transform.transformState.value.flipVertical).toBe(true)

    // Reset
    transform.resetTransforms()
    expect(transform.transformState.value.flipVertical).toBe(false)
  })

  test('resetTransforms() resets all transformations at once', () => {
    const { transform } = createTestTransform()

    // Apply multiple transformations
    transform.rotateTo(90)
    transform.flipHorizontal()
    transform.flipVertical()

    expect(transform.transformState.value.rotation).toBe(90)
    expect(transform.transformState.value.flipHorizontal).toBe(true)
    expect(transform.transformState.value.flipVertical).toBe(true)

    // Reset all
    transform.resetTransforms()

    expect(transform.transformState.value.rotation).toBe(0)
    expect(transform.transformState.value.flipHorizontal).toBe(false)
    expect(transform.transformState.value.flipVertical).toBe(false)
  })

  test('resetTransforms() emits transform-change event with type reset', () => {
    const { transform, emit } = createTestTransform()

    // Apply some transformations
    transform.rotateTo(45)
    transform.flipHorizontal()

    // Clear previous calls
    emit.mockClear()

    // Reset
    transform.resetTransforms()

    expect(emit).toHaveBeenCalledTimes(1)
    expect(emit).toHaveBeenCalledWith('transform-change', {
      type: 'reset',
      state: {
        rotation: 0,
        flipHorizontal: false,
        flipVertical: false,
      },
    })
  })

  /**
   * Test getTransformState() method
   * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
   */
  test('getTransformState() returns current transform state', () => {
    const { transform } = createTestTransform()

    // Apply some transformations
    transform.rotateTo(45)
    transform.flipHorizontal()

    const state = transform.getTransformState()

    expect(state.rotation).toBe(45)
    expect(state.flipHorizontal).toBe(true)
    expect(state.flipVertical).toBe(false)
  })

  test('getTransformState() returns object with rotation, flipHorizontal, and flipVertical', () => {
    const { transform } = createTestTransform()

    const state = transform.getTransformState()

    expect(state).toHaveProperty('rotation')
    expect(state).toHaveProperty('flipHorizontal')
    expect(state).toHaveProperty('flipVertical')
    expect(typeof state.rotation).toBe('number')
    expect(typeof state.flipHorizontal).toBe('boolean')
    expect(typeof state.flipVertical).toBe('boolean')
  })

  test('getTransformState() returns a copy (not the original state)', () => {
    const { transform } = createTestTransform()

    const state1 = transform.getTransformState()
    const state2 = transform.getTransformState()

    // Should be different objects
    expect(state1).not.toBe(state2)

    // But with same values
    expect(state1).toEqual(state2)
  })

  test('getTransformState() does not modify internal state', () => {
    const { transform } = createTestTransform()

    transform.rotateTo(45)

    const state = transform.getTransformState()
    const originalRotation = transform.transformState.value.rotation

    // Try to modify the returned state (should not affect internal state)
    // @ts-expect-error - Testing that modifications don't affect internal state
    state.rotation = 90

    expect(transform.transformState.value.rotation).toBe(originalRotation)
    expect(transform.transformState.value.rotation).toBe(45)
  })

  test('getTransformState() called multiple times returns equivalent values', () => {
    const { transform } = createTestTransform()

    transform.rotateTo(45)
    transform.flipHorizontal()

    const state1 = transform.getTransformState()
    const state2 = transform.getTransformState()
    const state3 = transform.getTransformState()

    expect(state1).toEqual(state2)
    expect(state2).toEqual(state3)
  })

  /**
   * Test getTransformCSS() method
   * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
   */
  test('getTransformCSS() returns "none" for default state', () => {
    const { transform } = createTestTransform()

    const css = transform.getTransformCSS()

    expect(css).toBe('none')
  })

  test('getTransformCSS() returns rotation transform', () => {
    const { transform } = createTestTransform()

    transform.rotateTo(45)

    const css = transform.getTransformCSS()

    expect(css).toBe('rotate(45deg)')
  })

  test('getTransformCSS() returns horizontal flip transform', () => {
    const { transform } = createTestTransform()

    transform.flipHorizontal()

    const css = transform.getTransformCSS()

    expect(css).toBe('scaleX(-1)')
  })

  test('getTransformCSS() returns vertical flip transform', () => {
    const { transform } = createTestTransform()

    transform.flipVertical()

    const css = transform.getTransformCSS()

    expect(css).toBe('scaleY(-1)')
  })

  test('getTransformCSS() combines multiple transformations', () => {
    const { transform } = createTestTransform()

    transform.rotateTo(45)
    transform.flipHorizontal()
    transform.flipVertical()

    const css = transform.getTransformCSS()

    expect(css).toBe('scaleX(-1) scaleY(-1) rotate(45deg)')
  })

  test('getTransformCSS() applies transformations in correct order', () => {
    const { transform } = createTestTransform()

    // Order should be: flipHorizontal, flipVertical, rotation
    transform.flipHorizontal()
    transform.rotateTo(90)

    const css = transform.getTransformCSS()

    expect(css).toBe('scaleX(-1) rotate(90deg)')
  })

  test('getTransformCSS() handles rotation at 0 degrees', () => {
    const { transform } = createTestTransform()

    transform.rotateTo(0)

    const css = transform.getTransformCSS()

    expect(css).toBe('none')
  })

  test('getTransformCSS() updates after reset', () => {
    const { transform } = createTestTransform()

    transform.rotateTo(45)
    transform.flipHorizontal()

    let css = transform.getTransformCSS()
    expect(css).toBe('scaleX(-1) rotate(45deg)')

    transform.resetTransforms()

    css = transform.getTransformCSS()
    expect(css).toBe('none')
  })
})

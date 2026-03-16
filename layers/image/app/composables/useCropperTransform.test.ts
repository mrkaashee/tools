import { describe, test, expect, vi } from 'vitest'
import { ref } from 'vue'
import fc from 'fast-check'
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

describe('useCropperTransform - Property-Based Tests', () => {
  /**
   * Feature: image-transformations, Property 2: Angle Normalization
   * **Validates: Requirements 1.4, 2.2**
   *
   * For any rotation angle (including values outside 0-359 range),
   * the stored rotation state should always be normalized to the range [0, 359].
   */
  test('Property 2: Angle Normalization - rotateTo normalizes any angle to [0, 359]', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -10000, max: 10000 }), // Test with wide range including negative and large values
        (angle: number) => {
          const { transform } = createTestTransform()

          // Apply rotation
          transform.rotateTo(angle)

          // Get the resulting rotation
          const resultRotation = transform.transformState.value.rotation

          // Assert: rotation should be in [0, 359] range
          expect(resultRotation).toBeGreaterThanOrEqual(0)
          expect(resultRotation).toBeLessThan(360)

          // Assert: normalized angle should be mathematically equivalent to input angle (modulo 360)
          const expectedNormalized = ((angle % 360) + 360) % 360
          expect(resultRotation).toBe(expectedNormalized)
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: image-transformations, Property 2: Angle Normalization
   * **Validates: Requirements 1.4, 2.2**
   *
   * Test that angle normalization works correctly with rotateRight and rotateLeft
   * when angles exceed boundaries.
   */
  test('Property 2: Angle Normalization - rotateRight/rotateLeft normalize angles exceeding boundaries', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 359 }), // Initial angle
        fc.integer({ min: 1, max: 360 }), // Rotation step
        fc.integer({ min: 1, max: 20 }), // Number of rotations
        (initialAngle: number, step: number, rotations: number) => {
          const { transform } = createTestTransform({ rotationStep: step })

          // Set initial angle
          transform.rotateTo(initialAngle)

          // Apply multiple rotations
          for (let i = 0; i < rotations; i++) {
            transform.rotateRight()
          }

          // Get the resulting rotation
          const resultRotation = transform.transformState.value.rotation

          // Assert: rotation should always be in [0, 359] range
          expect(resultRotation).toBeGreaterThanOrEqual(0)
          expect(resultRotation).toBeLessThan(360)

          // Assert: result should match expected normalized value
          const expectedAngle = (initialAngle + (step * rotations)) % 360
          expect(resultRotation).toBe(expectedAngle)
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: image-transformations, Property 2: Angle Normalization
   * **Validates: Requirements 1.4, 2.2**
   *
   * Test that angle normalization works correctly with negative angles
   * from rotateLeft operations.
   */
  test('Property 2: Angle Normalization - rotateLeft normalizes negative angles correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 359 }), // Initial angle
        fc.integer({ min: 1, max: 360 }), // Rotation step
        fc.integer({ min: 1, max: 20 }), // Number of rotations
        (initialAngle: number, step: number, rotations: number) => {
          const { transform } = createTestTransform({ rotationStep: step })

          // Set initial angle
          transform.rotateTo(initialAngle)

          // Apply multiple left rotations (counter-clockwise)
          for (let i = 0; i < rotations; i++) {
            transform.rotateLeft()
          }

          // Get the resulting rotation
          const resultRotation = transform.transformState.value.rotation

          // Assert: rotation should always be in [0, 359] range
          expect(resultRotation).toBeGreaterThanOrEqual(0)
          expect(resultRotation).toBeLessThan(360)

          // Assert: result should match expected normalized value
          const rawAngle = initialAngle - (step * rotations)
          const expectedAngle = ((rawAngle % 360) + 360) % 360
          expect(resultRotation).toBe(expectedAngle)
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: image-transformations, Property 2: Angle Normalization
   * **Validates: Requirements 1.4, 2.2**
   *
   * Test edge cases: NaN, Infinity, and special values should be handled gracefully.
   */
  test('Property 2: Angle Normalization - handles special numeric values', () => {
    const { transform } = createTestTransform()

    // Test NaN
    transform.rotateTo(NaN)
    expect(transform.transformState.value.rotation).toBe(0)

    // Test Infinity
    transform.rotateTo(Infinity)
    expect(transform.transformState.value.rotation).toBeGreaterThanOrEqual(0)
    expect(transform.transformState.value.rotation).toBeLessThan(360)

    // Test -Infinity
    transform.rotateTo(-Infinity)
    expect(transform.transformState.value.rotation).toBeGreaterThanOrEqual(0)
    expect(transform.transformState.value.rotation).toBeLessThan(360)

    // Test exact boundary values
    transform.rotateTo(0)
    expect(transform.transformState.value.rotation).toBe(0)

    transform.rotateTo(360)
    expect(transform.transformState.value.rotation).toBe(0)

    transform.rotateTo(-360)
    expect(transform.transformState.value.rotation).toBe(0)

    transform.rotateTo(359)
    expect(transform.transformState.value.rotation).toBe(359)

    transform.rotateTo(-1)
    expect(transform.transformState.value.rotation).toBe(359)
  })

  /**
   * Feature: image-transformations, Property 1: Rotation Step Consistency
   * **Validates: Requirements 1.1, 1.2, 1.3, 10.2**
   *
   * For any initial rotation angle and any valid rotation step size,
   * calling rotateRight() should increase the rotation angle by exactly the step size (modulo 360),
   * and calling rotateLeft() should decrease it by exactly the step size (modulo 360).
   */
  test('Property 1: Rotation Step Consistency - rotateRight increases angle by step size', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 359 }), // Initial angle
        fc.integer({ min: 1, max: 360 }), // Rotation step
        (initialAngle: number, step: number) => {
          const { transform } = createTestTransform({ rotationStep: step })

          // Set initial angle
          transform.rotateTo(initialAngle)

          // Apply rotateRight
          transform.rotateRight()

          // Get the resulting rotation
          const resultRotation = transform.transformState.value.rotation

          // Assert: rotation should increase by step size (modulo 360)
          const expectedAngle = (initialAngle + step) % 360
          expect(resultRotation).toBe(expectedAngle)
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: image-transformations, Property 1: Rotation Step Consistency
   * **Validates: Requirements 1.1, 1.2, 1.3, 10.2**
   *
   * Test that rotateLeft decreases the angle by exactly the step size.
   */
  test('Property 1: Rotation Step Consistency - rotateLeft decreases angle by step size', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 359 }), // Initial angle
        fc.integer({ min: 1, max: 360 }), // Rotation step
        (initialAngle: number, step: number) => {
          const { transform } = createTestTransform({ rotationStep: step })

          // Set initial angle
          transform.rotateTo(initialAngle)

          // Apply rotateLeft
          transform.rotateLeft()

          // Get the resulting rotation
          const resultRotation = transform.transformState.value.rotation

          // Assert: rotation should decrease by step size (modulo 360)
          const rawAngle = initialAngle - step
          const expectedAngle = ((rawAngle % 360) + 360) % 360
          expect(resultRotation).toBe(expectedAngle)
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: image-transformations, Property 1: Rotation Step Consistency
   * **Validates: Requirements 1.1, 1.2, 1.3, 10.2**
   *
   * Test that multiple rotateRight calls consistently increment by step size.
   */
  test('Property 1: Rotation Step Consistency - multiple rotateRight calls are consistent', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 359 }), // Initial angle
        fc.integer({ min: 1, max: 360 }), // Rotation step
        fc.integer({ min: 1, max: 10 }), // Number of rotations
        (initialAngle: number, step: number, rotations: number) => {
          const { transform } = createTestTransform({ rotationStep: step })

          // Set initial angle
          transform.rotateTo(initialAngle)

          // Apply multiple rotateRight calls
          for (let i = 0; i < rotations; i++) {
            transform.rotateRight()
          }

          // Get the resulting rotation
          const resultRotation = transform.transformState.value.rotation

          // Assert: rotation should be initial + (step * rotations) modulo 360
          const expectedAngle = (initialAngle + (step * rotations)) % 360
          expect(resultRotation).toBe(expectedAngle)
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: image-transformations, Property 1: Rotation Step Consistency
   * **Validates: Requirements 1.1, 1.2, 1.3, 10.2**
   *
   * Test that multiple rotateLeft calls consistently decrement by step size.
   */
  test('Property 1: Rotation Step Consistency - multiple rotateLeft calls are consistent', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 359 }), // Initial angle
        fc.integer({ min: 1, max: 360 }), // Rotation step
        fc.integer({ min: 1, max: 10 }), // Number of rotations
        (initialAngle: number, step: number, rotations: number) => {
          const { transform } = createTestTransform({ rotationStep: step })

          // Set initial angle
          transform.rotateTo(initialAngle)

          // Apply multiple rotateLeft calls
          for (let i = 0; i < rotations; i++) {
            transform.rotateLeft()
          }

          // Get the resulting rotation
          const resultRotation = transform.transformState.value.rotation

          // Assert: rotation should be initial - (step * rotations) normalized to [0, 359]
          const rawAngle = initialAngle - (step * rotations)
          const expectedAngle = ((rawAngle % 360) + 360) % 360
          expect(resultRotation).toBe(expectedAngle)
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: image-transformations, Property 3: Free Rotation Acceptance
   * **Validates: Requirements 2.1, 2.2**
   *
   * For any angle in the range [-360, 360], calling rotateTo(angle) should
   * set the rotation to that angle (normalized to 0-359).
   */
  test('Property 3: Free Rotation Acceptance - rotateTo accepts any angle in [-360, 360]', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -360, max: 360 }), // Angle in valid range
        (angle: number) => {
          const { transform } = createTestTransform()

          // Apply rotation
          transform.rotateTo(angle)

          // Get the resulting rotation
          const resultRotation = transform.transformState.value.rotation

          // Assert: rotation should be normalized to [0, 359]
          expect(resultRotation).toBeGreaterThanOrEqual(0)
          expect(resultRotation).toBeLessThan(360)

          // Assert: normalized angle should be mathematically equivalent to input angle
          const expectedNormalized = ((angle % 360) + 360) % 360
          expect(resultRotation).toBe(expectedNormalized)
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: image-transformations, Property 3: Free Rotation Acceptance
   * **Validates: Requirements 2.1, 2.2**
   *
   * Test that rotateTo accepts fractional angles and normalizes them correctly.
   */
  test('Property 3: Free Rotation Acceptance - rotateTo accepts fractional angles', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -360, max: 360, noNaN: true }), // Fractional angle
        (angle: number) => {
          const { transform } = createTestTransform()

          // Apply rotation
          transform.rotateTo(angle)

          // Get the resulting rotation
          const resultRotation = transform.transformState.value.rotation

          // Assert: rotation should be normalized to [0, 359]
          expect(resultRotation).toBeGreaterThanOrEqual(0)
          expect(resultRotation).toBeLessThan(360)

          // Assert: normalized angle should be mathematically equivalent to input angle
          const expectedNormalized = ((angle % 360) + 360) % 360
          // Use toBeCloseTo for floating point comparison
          expect(resultRotation).toBeCloseTo(expectedNormalized, 10)
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: image-transformations, Property 3: Free Rotation Acceptance
   * **Validates: Requirements 2.1, 2.2**
   *
   * Test that rotateTo is idempotent - calling it multiple times with the same angle
   * produces the same result.
   */
  test('Property 3: Free Rotation Acceptance - rotateTo is idempotent', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -360, max: 360 }), // Angle
        (angle: number) => {
          const { transform } = createTestTransform()

          // Apply rotation multiple times
          transform.rotateTo(angle)
          const firstResult = transform.transformState.value.rotation

          transform.rotateTo(angle)
          const secondResult = transform.transformState.value.rotation

          transform.rotateTo(angle)
          const thirdResult = transform.transformState.value.rotation

          // Assert: all results should be identical
          expect(secondResult).toBe(firstResult)
          expect(thirdResult).toBe(firstResult)
        },
      ),
      { numRuns: 100 },
    )
  })
})

/**
 * Property-Based Tests for Input Handling
 *
 * Tests universal properties that should hold across all valid inputs
 * for input event normalization and coordinate conversion.
 */

import { describe, test, expect, beforeEach, vi } from 'vitest'
import fc from 'fast-check'
import { normalizeInputEvent, normalizePointerEvent } from './inputHandler'
import type { Point } from '../types/drawing'

describe('inputHandler - Property-Based Tests', () => {
  let canvas: HTMLCanvasElement

  beforeEach(() => {
    // Create a mock canvas element
    canvas = document.createElement('canvas')
    canvas.width = 800
    canvas.height = 600
  })

  /**
   * Fast-check arbitrary for generating canvas configurations
   * Represents different canvas sizes and display sizes (scaling scenarios)
   */
  const canvasConfigArbitrary = fc.record({
    canvasWidth: fc.integer({ min: 100, max: 4000 }),
    canvasHeight: fc.integer({ min: 100, max: 4000 }),
    displayWidth: fc.integer({ min: 50, max: 2000 }),
    displayHeight: fc.integer({ min: 50, max: 2000 }),
    offsetLeft: fc.integer({ min: 0, max: 500 }),
    offsetTop: fc.integer({ min: 0, max: 500 }),
  })

  /**
   * Fast-check arbitrary for generating client coordinates
   */
  const clientCoordinatesArbitrary = fc.record({
    clientX: fc.double({ min: 0, max: 3000, noNaN: true }),
    clientY: fc.double({ min: 0, max: 3000, noNaN: true }),
  })

  /**
   * Helper function to setup canvas with specific configuration
   */
  const setupCanvas = (config: {
    canvasWidth: number
    canvasHeight: number
    displayWidth: number
    displayHeight: number
    offsetLeft: number
    offsetTop: number
  }) => {
    canvas.width = config.canvasWidth
    canvas.height = config.canvasHeight

    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
      left: config.offsetLeft,
      top: config.offsetTop,
      width: config.displayWidth,
      height: config.displayHeight,
      right: config.offsetLeft + config.displayWidth,
      bottom: config.offsetTop + config.displayHeight,
      x: config.offsetLeft,
      y: config.offsetTop,
      toJSON: () => ({}),
    })
  }

  /**
   * Feature: drawing-tools, Property 26: Input Coordinate Normalization
   * **Validates: Requirements 9.5**
   *
   * For any mouse or touch input event, the Input_Handler should normalize
   * the coordinates to the same canvas coordinate system regardless of input type.
   */
  test('Property 26: Input Coordinate Normalization - same coordinates for mouse and touch', () => {
    fc.assert(
      fc.property(
        canvasConfigArbitrary,
        clientCoordinatesArbitrary,
        (config, coords) => {
          setupCanvas(config)

          // Create mouse event
          const mouseEvent = new MouseEvent('mousedown', {
            clientX: coords.clientX,
            clientY: coords.clientY,
          })

          // Create touch event with same client coordinates
          const touchEvent = new TouchEvent('touchstart', {
            touches: [
              {
                clientX: coords.clientX,
                clientY: coords.clientY,
              } as Touch,
            ],
          })

          // Normalize both events
          const mousePoint = normalizeInputEvent(mouseEvent, canvas)
          const touchPoint = normalizeInputEvent(touchEvent, canvas)

          // Assert: Both should produce identical canvas coordinates
          expect(mousePoint.x).toBe(touchPoint.x)
          expect(mousePoint.y).toBe(touchPoint.y)

          // Assert: Coordinates should be properly scaled
          const expectedX = (coords.clientX - config.offsetLeft) * (config.canvasWidth / config.displayWidth)
          const expectedY = (coords.clientY - config.offsetTop) * (config.canvasHeight / config.displayHeight)

          expect(mousePoint.x).toBeCloseTo(expectedX, 10)
          expect(mousePoint.y).toBeCloseTo(expectedY, 10)
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: drawing-tools, Property 26: Input Coordinate Normalization
   * **Validates: Requirements 9.5**
   *
   * Test that pointer events also normalize to the same coordinates.
   */
  test('Property 26: Input Coordinate Normalization - pointer events match mouse/touch', () => {
    fc.assert(
      fc.property(
        canvasConfigArbitrary,
        clientCoordinatesArbitrary,
        (config, coords) => {
          setupCanvas(config)

          // Create mouse event
          const mouseEvent = new MouseEvent('mousedown', {
            clientX: coords.clientX,
            clientY: coords.clientY,
          })

          // Create pointer event with same client coordinates
          const pointerEvent = new PointerEvent('pointerdown', {
            clientX: coords.clientX,
            clientY: coords.clientY,
          })

          // Normalize both events
          const mousePoint = normalizeInputEvent(mouseEvent, canvas)
          const pointerPoint = normalizePointerEvent(pointerEvent, canvas)

          // Assert: Both should produce identical canvas coordinates
          expect(pointerPoint.x).toBe(mousePoint.x)
          expect(pointerPoint.y).toBe(mousePoint.y)
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: drawing-tools, Property 26: Input Coordinate Normalization
   * **Validates: Requirements 9.5**
   *
   * Test that touchend events (using changedTouches) normalize correctly.
   */
  test('Property 26: Input Coordinate Normalization - touchend uses changedTouches', () => {
    fc.assert(
      fc.property(
        canvasConfigArbitrary,
        clientCoordinatesArbitrary,
        (config, coords) => {
          setupCanvas(config)

          // Create touchstart event
          const touchStartEvent = new TouchEvent('touchstart', {
            touches: [
              {
                clientX: coords.clientX,
                clientY: coords.clientY,
              } as Touch,
            ],
          })

          // Create touchend event (touches array is empty, uses changedTouches)
          const touchEndEvent = new TouchEvent('touchend', {
            touches: [],
            changedTouches: [
              {
                clientX: coords.clientX,
                clientY: coords.clientY,
              } as Touch,
            ],
          })

          // Normalize both events
          const startPoint = normalizeInputEvent(touchStartEvent, canvas)
          const endPoint = normalizeInputEvent(touchEndEvent, canvas)

          // Assert: Both should produce identical canvas coordinates
          expect(endPoint.x).toBe(startPoint.x)
          expect(endPoint.y).toBe(startPoint.y)
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: drawing-tools, Property 26: Input Coordinate Normalization
   * **Validates: Requirements 9.5**
   *
   * Test that coordinate normalization is consistent across different scaling factors.
   */
  test('Property 26: Input Coordinate Normalization - consistent across scaling factors', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 2000 }),
        fc.integer({ min: 100, max: 2000 }),
        fc.double({ min: 0.1, max: 4.0, noNaN: true }),
        fc.double({ min: 0.1, max: 4.0, noNaN: true }),
        fc.double({ min: 0, max: 1000, noNaN: true }),
        fc.double({ min: 0, max: 1000, noNaN: true }),
        (canvasWidth, canvasHeight, scaleX, scaleY, relativeX, relativeY) => {
          const displayWidth = canvasWidth / scaleX
          const displayHeight = canvasHeight / scaleY
          const offsetLeft = 100
          const offsetTop = 50

          setupCanvas({
            canvasWidth,
            canvasHeight,
            displayWidth,
            displayHeight,
            offsetLeft,
            offsetTop,
          })

          // Calculate client coordinates from relative position
          const clientX = offsetLeft + relativeX
          const clientY = offsetTop + relativeY

          // Create events with same client coordinates
          const mouseEvent = new MouseEvent('mousedown', { clientX, clientY })
          const touchEvent = new TouchEvent('touchstart', {
            touches: [{ clientX, clientY } as Touch],
          })

          // Normalize both events
          const mousePoint = normalizeInputEvent(mouseEvent, canvas)
          const touchPoint = normalizeInputEvent(touchEvent, canvas)

          // Assert: Both should produce identical canvas coordinates
          expect(touchPoint.x).toBeCloseTo(mousePoint.x, 10)
          expect(touchPoint.y).toBeCloseTo(mousePoint.y, 10)

          // Assert: Coordinates should be properly scaled
          const expectedX = relativeX * scaleX
          const expectedY = relativeY * scaleY

          expect(mousePoint.x).toBeCloseTo(expectedX, 10)
          expect(mousePoint.y).toBeCloseTo(expectedY, 10)
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: drawing-tools, Property 27: Input Accuracy Equivalence
   * **Validates: Requirements 9.7**
   *
   * For any drawing operation, touch input and mouse input at the same canvas
   * coordinates should produce equivalent Drawing_Layers.
   *
   * This test verifies that the normalized coordinates are identical, which is
   * the foundation for producing equivalent layers. The actual layer creation
   * is tested in the drawing tools tests.
   */
  test('Property 27: Input Accuracy Equivalence - touch and mouse produce equivalent coordinates', () => {
    fc.assert(
      fc.property(
        canvasConfigArbitrary,
        fc.array(clientCoordinatesArbitrary, { minLength: 2, maxLength: 20 }),
        (config, coordSequence) => {
          setupCanvas(config)

          // Simulate a drawing operation with mouse
          const mousePoints: Point[] = []
          for (const coords of coordSequence) {
            const mouseEvent = new MouseEvent('mousemove', {
              clientX: coords.clientX,
              clientY: coords.clientY,
            })
            mousePoints.push(normalizeInputEvent(mouseEvent, canvas))
          }

          // Simulate the same drawing operation with touch
          const touchPoints: Point[] = []
          for (const coords of coordSequence) {
            const touchEvent = new TouchEvent('touchmove', {
              touches: [
                {
                  clientX: coords.clientX,
                  clientY: coords.clientY,
                } as Touch,
              ],
            })
            touchPoints.push(normalizeInputEvent(touchEvent, canvas))
          }

          // Assert: All corresponding points should be identical
          expect(touchPoints).toHaveLength(mousePoints.length)

          for (let i = 0; i < mousePoints.length; i++) {
            expect(touchPoints[i]!.x).toBe(mousePoints[i]!.x)
            expect(touchPoints[i]!.y).toBe(mousePoints[i]!.y)
          }
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: drawing-tools, Property 27: Input Accuracy Equivalence
   * **Validates: Requirements 9.7**
   *
   * Test that pointer events produce the same coordinate sequence as mouse/touch.
   */
  test('Property 27: Input Accuracy Equivalence - pointer events produce equivalent coordinates', () => {
    fc.assert(
      fc.property(
        canvasConfigArbitrary,
        fc.array(clientCoordinatesArbitrary, { minLength: 2, maxLength: 20 }),
        (config, coordSequence) => {
          setupCanvas(config)

          // Simulate a drawing operation with mouse
          const mousePoints: Point[] = []
          for (const coords of coordSequence) {
            const mouseEvent = new MouseEvent('mousemove', {
              clientX: coords.clientX,
              clientY: coords.clientY,
            })
            mousePoints.push(normalizeInputEvent(mouseEvent, canvas))
          }

          // Simulate the same drawing operation with pointer events
          const pointerPoints: Point[] = []
          for (const coords of coordSequence) {
            const pointerEvent = new PointerEvent('pointermove', {
              clientX: coords.clientX,
              clientY: coords.clientY,
            })
            pointerPoints.push(normalizePointerEvent(pointerEvent, canvas))
          }

          // Assert: All corresponding points should be identical
          expect(pointerPoints).toHaveLength(mousePoints.length)

          for (let i = 0; i < mousePoints.length; i++) {
            expect(pointerPoints[i]!.x).toBe(mousePoints[i]!.x)
            expect(pointerPoints[i]!.y).toBe(mousePoints[i]!.y)
          }
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: drawing-tools, Property 27: Input Accuracy Equivalence
   * **Validates: Requirements 9.7**
   *
   * Test that coordinate sequences maintain relative distances regardless of input type.
   */
  test('Property 27: Input Accuracy Equivalence - relative distances preserved', () => {
    fc.assert(
      fc.property(
        canvasConfigArbitrary,
        fc.array(clientCoordinatesArbitrary, { minLength: 3, maxLength: 10 }),
        (config, coordSequence) => {
          setupCanvas(config)

          // Helper to calculate distance between two points
          const distance = (p1: Point, p2: Point): number => {
            return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2)
          }

          // Normalize coordinates with mouse events
          const mousePoints: Point[] = coordSequence.map(coords => {
            const mouseEvent = new MouseEvent('mousemove', {
              clientX: coords.clientX,
              clientY: coords.clientY,
            })
            return normalizeInputEvent(mouseEvent, canvas)
          })

          // Normalize coordinates with touch events
          const touchPoints: Point[] = coordSequence.map(coords => {
            const touchEvent = new TouchEvent('touchmove', {
              touches: [
                {
                  clientX: coords.clientX,
                  clientY: coords.clientY,
                } as Touch,
              ],
            })
            return normalizeInputEvent(touchEvent, canvas)
          })

          // Assert: Distances between consecutive points should be identical
          for (let i = 0; i < mousePoints.length - 1; i++) {
            const mouseDist = distance(mousePoints[i]!, mousePoints[i + 1]!)
            const touchDist = distance(touchPoints[i]!, touchPoints[i + 1]!)

            expect(touchDist).toBeCloseTo(mouseDist, 10)
          }
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: drawing-tools, Property 26: Input Coordinate Normalization
   * **Validates: Requirements 9.5**
   *
   * Test that normalization handles edge cases correctly (coordinates at canvas boundaries).
   */
  test('Property 26: Input Coordinate Normalization - handles boundary coordinates', () => {
    fc.assert(
      fc.property(
        canvasConfigArbitrary,
        fc.constantFrom('top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'),
        (config, position) => {
          setupCanvas(config)

          let clientX: number
          let clientY: number

          // Calculate client coordinates for different boundary positions
          switch (position) {
            case 'top-left':
              clientX = config.offsetLeft
              clientY = config.offsetTop
              break
            case 'top-right':
              clientX = config.offsetLeft + config.displayWidth
              clientY = config.offsetTop
              break
            case 'bottom-left':
              clientX = config.offsetLeft
              clientY = config.offsetTop + config.displayHeight
              break
            case 'bottom-right':
              clientX = config.offsetLeft + config.displayWidth
              clientY = config.offsetTop + config.displayHeight
              break
            case 'center':
              clientX = config.offsetLeft + config.displayWidth / 2
              clientY = config.offsetTop + config.displayHeight / 2
              break
          }

          // Create events with boundary coordinates
          const mouseEvent = new MouseEvent('mousedown', { clientX, clientY })
          const touchEvent = new TouchEvent('touchstart', {
            touches: [{ clientX, clientY } as Touch],
          })

          // Normalize both events
          const mousePoint = normalizeInputEvent(mouseEvent, canvas)
          const touchPoint = normalizeInputEvent(touchEvent, canvas)

          // Assert: Both should produce identical canvas coordinates
          expect(touchPoint.x).toBeCloseTo(mousePoint.x, 10)
          expect(touchPoint.y).toBeCloseTo(mousePoint.y, 10)

          // Assert: Coordinates should be within expected ranges
          if (position === 'top-left') {
            expect(mousePoint.x).toBeCloseTo(0, 10)
            expect(mousePoint.y).toBeCloseTo(0, 10)
          }
          else if (position === 'bottom-right') {
            expect(mousePoint.x).toBeCloseTo(config.canvasWidth, 10)
            expect(mousePoint.y).toBeCloseTo(config.canvasHeight, 10)
          }
          else if (position === 'center') {
            expect(mousePoint.x).toBeCloseTo(config.canvasWidth / 2, 10)
            expect(mousePoint.y).toBeCloseTo(config.canvasHeight / 2, 10)
          }
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: drawing-tools, Property 26: Input Coordinate Normalization
   * **Validates: Requirements 9.5**
   *
   * Test that normalization is deterministic (same input always produces same output).
   */
  test('Property 26: Input Coordinate Normalization - deterministic normalization', () => {
    fc.assert(
      fc.property(
        canvasConfigArbitrary,
        clientCoordinatesArbitrary,
        (config, coords) => {
          setupCanvas(config)

          // Create multiple events with same coordinates
          const mouseEvent1 = new MouseEvent('mousedown', {
            clientX: coords.clientX,
            clientY: coords.clientY,
          })
          const mouseEvent2 = new MouseEvent('mousedown', {
            clientX: coords.clientX,
            clientY: coords.clientY,
          })

          // Normalize both events
          const point1 = normalizeInputEvent(mouseEvent1, canvas)
          const point2 = normalizeInputEvent(mouseEvent2, canvas)

          // Assert: Both should produce identical results
          expect(point2.x).toBe(point1.x)
          expect(point2.y).toBe(point1.y)
        },
      ),
      { numRuns: 100 },
    )
  })
})

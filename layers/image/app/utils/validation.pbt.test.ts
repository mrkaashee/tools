/**
 * Property-Based Tests for Validation Utilities
 *
 * Tests universal properties that should hold across all valid inputs
 * for drawing properties validation and layer data integrity checks.
 */

import { describe, test, expect } from 'vitest'
import fc from 'fast-check'
import {
  validateStrokeWidth,
  validateOpacity,
  validateDrawingProperties,
  validateLayer,
} from './validation'
import type { DrawingLayer } from '../types/drawing'

describe('validation - Property-Based Tests', () => {
  /**
   * Feature: drawing-tools, Property 8: Stroke Width Validation
   * **Validates: Requirements 3.2**
   *
   * For any numeric input, validateStrokeWidth should enforce the range [1, 50].
   * Values below 1 should be clamped to 1, values above 50 should be clamped to 50.
   */
  test('Property 8: Stroke Width Validation - enforces range [1, 50]', () => {
    fc.assert(
      fc.property(fc.double({ min: -1000, max: 1000, noNaN: true }), width => {
        const validated = validateStrokeWidth(width)

        // Assert: Result should always be within [1, 50]
        expect(validated).toBeGreaterThanOrEqual(1)
        expect(validated).toBeLessThanOrEqual(50)

        // Assert: Clamping behavior
        if (width < 1) {
          expect(validated).toBe(1)
        }
        else if (width > 50) {
          expect(validated).toBe(50)
        }
        else {
          expect(validated).toBe(width)
        }
      }),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: drawing-tools, Property 8: Stroke Width Validation
   * **Validates: Requirements 3.2**
   *
   * Test that invalid inputs (NaN, Infinity) are handled with default value.
   */
  test('Property 8: Stroke Width Validation - handles invalid inputs', () => {
    // Test NaN
    expect(validateStrokeWidth(Number.NaN)).toBe(1)

    // Test Infinity
    expect(validateStrokeWidth(Number.POSITIVE_INFINITY)).toBe(50)
    expect(validateStrokeWidth(Number.NEGATIVE_INFINITY)).toBe(1)

    // Test invalid types (cast to number)
    expect(validateStrokeWidth(undefined as unknown as number)).toBe(1)
    expect(validateStrokeWidth(null as unknown as number)).toBe(1)
  })

  /**
   * Feature: drawing-tools, Property 8: Stroke Width Validation
   * **Validates: Requirements 3.2**
   *
   * Test that valid range values pass through unchanged.
   */
  test('Property 8: Stroke Width Validation - preserves valid values', () => {
    fc.assert(
      fc.property(fc.double({ min: 1, max: 50, noNaN: true }), width => {
        const validated = validateStrokeWidth(width)

        // Assert: Valid values should pass through unchanged
        expect(validated).toBe(width)
      }),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: drawing-tools, Property 9: Opacity Validation
   * **Validates: Requirements 3.3**
   *
   * For any numeric input, validateOpacity should enforce the range [0, 100].
   * Values below 0 should be clamped to 0, values above 100 should be clamped to 100.
   */
  test('Property 9: Opacity Validation - enforces range [0, 100]', () => {
    fc.assert(
      fc.property(fc.double({ min: -1000, max: 1000, noNaN: true }), opacity => {
        const validated = validateOpacity(opacity)

        // Assert: Result should always be within [0, 100]
        expect(validated).toBeGreaterThanOrEqual(0)
        expect(validated).toBeLessThanOrEqual(100)

        // Assert: Clamping behavior
        if (opacity < 0) {
          expect(validated).toBe(0)
        }
        else if (opacity > 100) {
          expect(validated).toBe(100)
        }
        else {
          expect(validated).toBe(opacity)
        }
      }),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: drawing-tools, Property 9: Opacity Validation
   * **Validates: Requirements 3.3**
   *
   * Test that invalid inputs (NaN, Infinity) are handled with default value.
   */
  test('Property 9: Opacity Validation - handles invalid inputs', () => {
    // Test NaN
    expect(validateOpacity(Number.NaN)).toBe(100)

    // Test Infinity
    expect(validateOpacity(Number.POSITIVE_INFINITY)).toBe(100)
    expect(validateOpacity(Number.NEGATIVE_INFINITY)).toBe(0)

    // Test invalid types (cast to number)
    expect(validateOpacity(undefined as unknown as number)).toBe(100)
    expect(validateOpacity(null as unknown as number)).toBe(100)
  })

  /**
   * Feature: drawing-tools, Property 9: Opacity Validation
   * **Validates: Requirements 3.3**
   *
   * Test that valid range values pass through unchanged.
   */
  test('Property 9: Opacity Validation - preserves valid values', () => {
    fc.assert(
      fc.property(fc.double({ min: 0, max: 100, noNaN: true }), opacity => {
        const validated = validateOpacity(opacity)

        // Assert: Valid values should pass through unchanged
        expect(validated).toBe(opacity)
      }),
      { numRuns: 100 },
    )
  })

  /**
   * Fast-check arbitrary for generating partial drawing properties
   */
  const partialPropertiesArbitrary = fc.record(
    {
      strokeColor: fc.option(fc.integer({ min: 0, max: 0xFFFFFF }).map(n => `#${n.toString(16).padStart(6, '0')}`), { nil: undefined }),
      fillColor: fc.option(fc.integer({ min: 0, max: 0xFFFFFF }).map(n => `#${n.toString(16).padStart(6, '0')}`), { nil: undefined }),
      strokeWidth: fc.option(fc.double({ min: -100, max: 200, noNaN: true }), { nil: undefined }),
      opacity: fc.option(fc.double({ min: -100, max: 200, noNaN: true }), { nil: undefined }),
      enableFill: fc.option(fc.boolean(), { nil: undefined }),
    },
    { requiredKeys: [] },
  )

  /**
   * Feature: drawing-tools, Property 8 & 9: Combined Validation
   * **Validates: Requirements 3.2, 3.3**
   *
   * Test that validateDrawingProperties enforces all property constraints.
   */
  test('Property 8 & 9: validateDrawingProperties enforces all constraints', () => {
    fc.assert(
      fc.property(partialPropertiesArbitrary, partial => {
        const validated = validateDrawingProperties(partial)

        // Assert: All required fields are present
        expect(validated).toHaveProperty('strokeColor')
        expect(validated).toHaveProperty('fillColor')
        expect(validated).toHaveProperty('strokeWidth')
        expect(validated).toHaveProperty('opacity')
        expect(validated).toHaveProperty('enableFill')

        // Assert: Stroke width is within [1, 50]
        expect(validated.strokeWidth).toBeGreaterThanOrEqual(1)
        expect(validated.strokeWidth).toBeLessThanOrEqual(50)

        // Assert: Opacity is within [0, 100]
        expect(validated.opacity).toBeGreaterThanOrEqual(0)
        expect(validated.opacity).toBeLessThanOrEqual(100)

        // Assert: Colors are strings
        expect(typeof validated.strokeColor).toBe('string')
        expect(typeof validated.fillColor).toBe('string')

        // Assert: enableFill is boolean
        expect(typeof validated.enableFill).toBe('boolean')
      }),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: drawing-tools, Property 8 & 9: Combined Validation
   * **Validates: Requirements 3.2, 3.3**
   *
   * Test that validateDrawingProperties provides sensible defaults.
   */
  test('Property 8 & 9: validateDrawingProperties provides defaults', () => {
    const validated = validateDrawingProperties({})

    // Assert: Default values are set
    expect(validated.strokeColor).toBe('#000000')
    expect(validated.fillColor).toBe('#000000')
    expect(validated.strokeWidth).toBe(2)
    expect(validated.opacity).toBe(100)
    expect(validated.enableFill).toBe(false)
  })

  /**
   * Fast-check arbitrary for generating valid points
   */
  const pointArbitrary = fc.record({
    x: fc.double({ min: -10000, max: 10000, noNaN: true }),
    y: fc.double({ min: -10000, max: 10000, noNaN: true }),
  })

  /**
   * Fast-check arbitrary for generating valid stroke layers
   */
  const strokeLayerArbitrary = fc.record({
    id: fc.uuid(),
    type: fc.constant('stroke' as const),
    data: fc.record({
      points: fc.array(pointArbitrary, { minLength: 1, maxLength: 100 }),
      smoothed: fc.boolean(),
    }),
    properties: fc.record({
      strokeColor: fc.integer({ min: 0, max: 0xFFFFFF }).map(n => `#${n.toString(16).padStart(6, '0')}`),
      fillColor: fc.integer({ min: 0, max: 0xFFFFFF }).map(n => `#${n.toString(16).padStart(6, '0')}`),
      strokeWidth: fc.double({ min: 1, max: 50, noNaN: true }),
      opacity: fc.double({ min: 0, max: 100, noNaN: true }),
      enableFill: fc.boolean(),
    }),
    timestamp: fc.integer({ min: 0, max: Date.now() }),
    bounds: fc.record({
      x: fc.double({ min: -10000, max: 10000, noNaN: true }),
      y: fc.double({ min: -10000, max: 10000, noNaN: true }),
      width: fc.double({ min: 0, max: 10000, noNaN: true }),
      height: fc.double({ min: 0, max: 10000, noNaN: true }),
    }),
  })

  /**
   * Fast-check arbitrary for generating valid shape layers
   */
  const shapeLayerArbitrary = fc.record({
    id: fc.uuid(),
    type: fc.constant('shape' as const),
    data: fc.record({
      shapeType: fc.constantFrom('rectangle', 'circle', 'line', 'arrow'),
      start: pointArbitrary,
      end: pointArbitrary,
      constrained: fc.boolean(),
    }),
    properties: fc.record({
      strokeColor: fc.integer({ min: 0, max: 0xFFFFFF }).map(n => `#${n.toString(16).padStart(6, '0')}`),
      fillColor: fc.integer({ min: 0, max: 0xFFFFFF }).map(n => `#${n.toString(16).padStart(6, '0')}`),
      strokeWidth: fc.double({ min: 1, max: 50, noNaN: true }),
      opacity: fc.double({ min: 0, max: 100, noNaN: true }),
      enableFill: fc.boolean(),
    }),
    timestamp: fc.integer({ min: 0, max: Date.now() }),
    bounds: fc.record({
      x: fc.double({ min: -10000, max: 10000, noNaN: true }),
      y: fc.double({ min: -10000, max: 10000, noNaN: true }),
      width: fc.double({ min: 0, max: 10000, noNaN: true }),
      height: fc.double({ min: 0, max: 10000, noNaN: true }),
    }),
  })

  /**
   * Feature: drawing-tools, Layer Validation
   * **Validates: Requirements 15.4**
   *
   * Test that validateLayer accepts all valid stroke layers.
   */
  test('validateLayer accepts valid stroke layers', () => {
    fc.assert(
      fc.property(strokeLayerArbitrary, layer => {
        const isValid = validateLayer(layer)

        // Assert: Valid layers should pass validation
        expect(isValid).toBe(true)
      }),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: drawing-tools, Layer Validation
   * **Validates: Requirements 15.4**
   *
   * Test that validateLayer accepts all valid shape layers.
   */
  test('validateLayer accepts valid shape layers', () => {
    fc.assert(
      fc.property(shapeLayerArbitrary, layer => {
        const isValid = validateLayer(layer)

        // Assert: Valid layers should pass validation
        expect(isValid).toBe(true)
      }),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: drawing-tools, Layer Validation
   * **Validates: Requirements 15.4**
   *
   * Test that validateLayer rejects layers with missing required fields.
   */
  test('validateLayer rejects invalid layers', () => {
    // Missing id
    expect(validateLayer({ type: 'stroke' } as unknown as DrawingLayer)).toBe(false)

    // Invalid type
    expect(validateLayer({ id: '123', type: 'invalid' } as unknown as DrawingLayer)).toBe(false)

    // Missing data
    expect(validateLayer({ id: '123', type: 'stroke' } as unknown as DrawingLayer)).toBe(false)

    // Missing properties
    expect(
      validateLayer({
        id: '123',
        type: 'stroke',
        data: { points: [], smoothed: true },
      } as unknown as DrawingLayer),
    ).toBe(false)

    // Missing timestamp
    expect(
      validateLayer({
        id: '123',
        type: 'stroke',
        data: { points: [{ x: 0, y: 0 }], smoothed: true },
        properties: {
          strokeColor: '#000000',
          fillColor: '#000000',
          strokeWidth: 2,
          opacity: 100,
          enableFill: false,
        },
      } as unknown as DrawingLayer),
    ).toBe(false)

    // Missing bounds
    expect(
      validateLayer({
        id: '123',
        type: 'stroke',
        data: { points: [{ x: 0, y: 0 }], smoothed: true },
        properties: {
          strokeColor: '#000000',
          fillColor: '#000000',
          strokeWidth: 2,
          opacity: 100,
          enableFill: false,
        },
        timestamp: Date.now(),
      } as unknown as DrawingLayer),
    ).toBe(false)
  })

  /**
   * Feature: drawing-tools, Layer Validation
   * **Validates: Requirements 15.4**
   *
   * Test that validateLayer rejects stroke layers with invalid point data.
   */
  test('validateLayer rejects stroke layers with invalid points', () => {
    const baseLayer: DrawingLayer = {
      id: '123',
      type: 'stroke',
      data: {
        points: [{ x: 0, y: 0 }],
        smoothed: true,
      },
      properties: {
        strokeColor: '#000000',
        fillColor: '#000000',
        strokeWidth: 2,
        opacity: 100,
        enableFill: false,
      },
      timestamp: Date.now(),
      bounds: { x: 0, y: 0, width: 100, height: 100 },
    }

    // Empty points array
    expect(
      validateLayer({
        ...baseLayer,
        data: { points: [], smoothed: true },
      }),
    ).toBe(false)

    // Points with NaN
    expect(
      validateLayer({
        ...baseLayer,
        data: { points: [{ x: Number.NaN, y: 0 }], smoothed: true },
      }),
    ).toBe(false)

    // Points with invalid structure
    expect(
      validateLayer({
        ...baseLayer,
        data: { points: [{ x: 0 }], smoothed: true },
      } as unknown as DrawingLayer),
    ).toBe(false)
  })

  /**
   * Feature: drawing-tools, Layer Validation
   * **Validates: Requirements 15.4**
   *
   * Test that validateLayer rejects shape layers with invalid shape data.
   */
  test('validateLayer rejects shape layers with invalid shape data', () => {
    const baseLayer: DrawingLayer = {
      id: '123',
      type: 'shape',
      data: {
        shapeType: 'rectangle',
        start: { x: 0, y: 0 },
        end: { x: 100, y: 100 },
        constrained: false,
      },
      properties: {
        strokeColor: '#000000',
        fillColor: '#000000',
        strokeWidth: 2,
        opacity: 100,
        enableFill: false,
      },
      timestamp: Date.now(),
      bounds: { x: 0, y: 0, width: 100, height: 100 },
    }

    // Invalid shape type
    expect(
      validateLayer({
        ...baseLayer,
        data: {
          shapeType: 'invalid',
          start: { x: 0, y: 0 },
          end: { x: 100, y: 100 },
          constrained: false,
        },
      } as unknown as DrawingLayer),
    ).toBe(false)

    // Missing start point
    expect(
      validateLayer({
        ...baseLayer,
        data: {
          shapeType: 'rectangle',
          end: { x: 100, y: 100 },
          constrained: false,
        },
      } as unknown as DrawingLayer),
    ).toBe(false)

    // Start point with NaN
    expect(
      validateLayer({
        ...baseLayer,
        data: {
          shapeType: 'rectangle',
          start: { x: Number.NaN, y: 0 },
          end: { x: 100, y: 100 },
          constrained: false,
        },
      }),
    ).toBe(false)
  })
})

import { describe, test, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import fc from 'fast-check'
import { useDrawingTools } from './useDrawingTools'
import type { DrawingProperties, ShapeData } from '../types/drawing'

/**
 * Property-Based Tests for Shape Tools
 *
 * Tests universal properties that should hold across all valid inputs
 * for the shape tool functionality.
 */

describe('useDrawingTools - Shape Tools Property-Based Tests', () => {
  /**
   * Fast-check arbitrary for generating points
   */
  const pointArbitrary = fc.record({
    x: fc.double({ min: 0, max: 1000, noNaN: true }),
    y: fc.double({ min: 0, max: 1000, noNaN: true }),
  })

  /**
   * Fast-check arbitrary for generating shape types
   */
  const shapeTypeArbitrary = fc.constantFrom('rectangle', 'circle', 'line', 'arrow')

  /**
   * Helper function to create mock dependencies for useDrawingTools
   */
  const createMockDependencies = () => {
    const mockCanvas = document.createElement('canvas')
    mockCanvas.width = 800
    mockCanvas.height = 600

    const properties = ref<DrawingProperties>({
      strokeColor: '#000000',
      fillColor: '#FFFFFF',
      strokeWidth: 2,
      opacity: 1,
      enableFill: false,
    })
    const overlayCanvasRef = ref<HTMLCanvasElement | null>(mockCanvas)
    const addLayer = vi.fn()
    const renderLayer = vi.fn()
    const removeLayer = vi.fn()
    const getLayerAtPoint = vi.fn()
    const renderAllLayers = vi.fn()

    return { properties, overlayCanvasRef, addLayer, renderLayer, removeLayer, getLayerAtPoint, renderAllLayers }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  /**
   * Feature: drawing-tools, Property 5: Shape Preview Updates
   * **Validates: Requirements 2.3**
   *
   * For any shape being drawn, the Canvas_Renderer should render a preview
   * that updates from the start point to the current cursor position.
   */
  test('Property 5: Shape Preview Updates - preview updates from start to cursor position', () => {
    fc.assert(
      fc.property(
        shapeTypeArbitrary,
        pointArbitrary,
        fc.array(pointArbitrary, { minLength: 1, maxLength: 20 }),
        (shapeType, startPoint, movePoints) => {
          // Skip if all move points are identical to start point (no actual movement)
          const hasMovement = movePoints.some(
            p => Math.abs(p.x - startPoint.x) > 0.1 || Math.abs(p.y - startPoint.y) > 0.1
          )
          fc.pre(hasMovement)

          const deps = createMockDependencies()
          const tools = useDrawingTools(
            deps.properties,
            deps.overlayCanvasRef,
            deps.addLayer,
            deps.renderLayer,
            deps.removeLayer,
            deps.getLayerAtPoint,
            deps.renderAllLayers
          )

          // Select shape tool
          tools.selectTool(shapeType as 'rectangle' | 'circle' | 'line' | 'arrow')

          // Start drawing
          tools.handleDrawStart(startPoint)

          // Verify initial state: shapeStart is set, shapePreview is null
          expect(tools.shapeStart.value).toEqual(startPoint)
          expect(tools.shapePreview.value).toBeNull()

          // Move through each point and verify preview updates
          for (const movePoint of movePoints) {
            tools.handleDrawMove(movePoint)

            // Assert: shapePreview should be updated with current cursor position
            expect(tools.shapePreview.value).not.toBeNull()
            expect(tools.shapePreview.value?.shapeType).toBe(shapeType)
            expect(tools.shapePreview.value?.start).toEqual(startPoint)
            expect(tools.shapePreview.value?.end).toEqual(movePoint)
          }

          // Verify the preview always reflects the latest cursor position
          const lastMovePoint = movePoints[movePoints.length - 1]!
          expect(tools.shapePreview.value?.end).toEqual(lastMovePoint)
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: drawing-tools, Property 5: Shape Preview Updates
   * **Validates: Requirements 2.3**
   *
   * Test that shape preview is cleared after drawing ends.
   */
  test('Property 5: Shape Preview Updates - preview cleared after drawing ends', () => {
    fc.assert(
      fc.property(
        shapeTypeArbitrary,
        pointArbitrary,
        pointArbitrary,
        (shapeType, startPoint, endPoint) => {
          const deps = createMockDependencies()
          const tools = useDrawingTools(
            deps.properties,
            deps.overlayCanvasRef,
            deps.addLayer,
            deps.renderLayer,
            deps.removeLayer,
            deps.getLayerAtPoint,
            deps.renderAllLayers
          )

          // Select shape tool
          tools.selectTool(shapeType as 'rectangle' | 'circle' | 'line' | 'arrow')

          // Draw shape
          tools.handleDrawStart(startPoint)
          tools.handleDrawMove(endPoint)

          // Verify preview exists during drawing
          expect(tools.shapePreview.value).not.toBeNull()

          // End drawing
          tools.handleDrawEnd(endPoint)

          // Assert: preview should be cleared
          expect(tools.shapePreview.value).toBeNull()
          expect(tools.shapeStart.value).toBeNull()
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: drawing-tools, Property 6: Constrained Shape Aspect Ratios
   * **Validates: Requirements 2.9**
   *
   * For any rectangle or circle drawn while holding the Shift key,
   * the resulting shape should have an aspect ratio of 1:1 (square or perfect circle).
   */
  test('Property 6: Constrained Shape Aspect Ratios - rectangles constrained to squares', () => {
    fc.assert(
      fc.property(
        pointArbitrary,
        pointArbitrary,
        (startPoint, endPoint) => {
          // Skip if start and end are the same point
          fc.pre(
            Math.abs(endPoint.x - startPoint.x) > 1
            || Math.abs(endPoint.y - startPoint.y) > 1
          )

          const deps = createMockDependencies()
          const tools = useDrawingTools(
            deps.properties,
            deps.overlayCanvasRef,
            deps.addLayer,
            deps.renderLayer,
            deps.removeLayer,
            deps.getLayerAtPoint,
            deps.renderAllLayers
          )

          // Enable shape constraints (Shift key)
          tools.updateToolOptions({ constrainShapes: true })

          // Select rectangle tool
          tools.selectTool('rectangle')

          // Draw rectangle
          tools.handleDrawStart(startPoint)
          tools.handleDrawEnd(endPoint)

          // Get the created layer
          expect(deps.addLayer).toHaveBeenCalledTimes(1)
          const layer = deps.addLayer.mock.calls[0]![0]
          const shapeData = layer.data as ShapeData

          // Calculate width and height
          const width = Math.abs(shapeData.end.x - shapeData.start.x)
          const height = Math.abs(shapeData.end.y - shapeData.start.y)

          // Assert: aspect ratio should be 1:1 (square)
          expect(width).toBeCloseTo(height, 5)

          // Assert: constrained flag should be set
          expect(shapeData.constrained).toBe(true)

          // Assert: size should be the larger of the two original dimensions
          const originalWidth = Math.abs(endPoint.x - startPoint.x)
          const originalHeight = Math.abs(endPoint.y - startPoint.y)
          const expectedSize = Math.max(originalWidth, originalHeight)
          expect(width).toBeCloseTo(expectedSize, 5)
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: drawing-tools, Property 6: Constrained Shape Aspect Ratios
   * **Validates: Requirements 2.9**
   *
   * Test that circles are constrained to perfect circles (1:1 aspect ratio).
   */
  test('Property 6: Constrained Shape Aspect Ratios - circles constrained to perfect circles', () => {
    fc.assert(
      fc.property(
        pointArbitrary,
        pointArbitrary,
        (startPoint, endPoint) => {
          // Skip if start and end are the same point
          fc.pre(
            Math.abs(endPoint.x - startPoint.x) > 1
            || Math.abs(endPoint.y - startPoint.y) > 1
          )

          const deps = createMockDependencies()
          const tools = useDrawingTools(
            deps.properties,
            deps.overlayCanvasRef,
            deps.addLayer,
            deps.renderLayer,
            deps.removeLayer,
            deps.getLayerAtPoint,
            deps.renderAllLayers
          )

          // Enable shape constraints (Shift key)
          tools.updateToolOptions({ constrainShapes: true })

          // Select circle tool
          tools.selectTool('circle')

          // Draw circle
          tools.handleDrawStart(startPoint)
          tools.handleDrawEnd(endPoint)

          // Get the created layer
          expect(deps.addLayer).toHaveBeenCalledTimes(1)
          const layer = deps.addLayer.mock.calls[0]![0]
          const shapeData = layer.data as ShapeData

          // Calculate width and height
          const width = Math.abs(shapeData.end.x - shapeData.start.x)
          const height = Math.abs(shapeData.end.y - shapeData.start.y)

          // Assert: aspect ratio should be 1:1 (perfect circle)
          expect(width).toBeCloseTo(height, 5)

          // Assert: constrained flag should be set
          expect(shapeData.constrained).toBe(true)

          // Assert: size should be the larger of the two original dimensions
          const originalWidth = Math.abs(endPoint.x - startPoint.x)
          const originalHeight = Math.abs(endPoint.y - startPoint.y)
          const expectedSize = Math.max(originalWidth, originalHeight)
          expect(width).toBeCloseTo(expectedSize, 5)
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: drawing-tools, Property 6: Constrained Shape Aspect Ratios
   * **Validates: Requirements 2.9**
   *
   * Test that shapes are NOT constrained when constrainShapes is disabled.
   */
  test('Property 6: Constrained Shape Aspect Ratios - shapes not constrained without Shift key', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('rectangle', 'circle'),
        pointArbitrary,
        pointArbitrary,
        (shapeType, startPoint, endPoint) => {
          // Skip if start and end are the same point
          fc.pre(
            Math.abs(endPoint.x - startPoint.x) > 1
            || Math.abs(endPoint.y - startPoint.y) > 1
          )

          // Skip if the points would naturally create a 1:1 aspect ratio
          const width = Math.abs(endPoint.x - startPoint.x)
          const height = Math.abs(endPoint.y - startPoint.y)
          fc.pre(Math.abs(width - height) > 5) // Ensure they're different enough

          const deps = createMockDependencies()
          const tools = useDrawingTools(
            deps.properties,
            deps.overlayCanvasRef,
            deps.addLayer,
            deps.renderLayer,
            deps.removeLayer,
            deps.getLayerAtPoint,
            deps.renderAllLayers
          )

          // Disable shape constraints (no Shift key)
          tools.updateToolOptions({ constrainShapes: false })

          // Select shape tool
          tools.selectTool(shapeType as 'rectangle' | 'circle')

          // Draw shape
          tools.handleDrawStart(startPoint)
          tools.handleDrawEnd(endPoint)

          // Get the created layer
          expect(deps.addLayer).toHaveBeenCalledTimes(1)
          const layer = deps.addLayer.mock.calls[0]![0]
          const shapeData = layer.data as ShapeData

          // Assert: end point should match the original end point (no constraint applied)
          expect(shapeData.end).toEqual(endPoint)

          // Assert: constrained flag should be false
          expect(shapeData.constrained).toBe(false)
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: drawing-tools, Property 7: Constrained Line Angles
   * **Validates: Requirements 2.10**
   *
   * For any line drawn while holding the Shift key,
   * the resulting line angle should be a multiple of 45 degrees.
   */
  test('Property 7: Constrained Line Angles - lines constrained to 45-degree increments', () => {
    fc.assert(
      fc.property(
        pointArbitrary,
        pointArbitrary,
        (startPoint, endPoint) => {
          // Skip if start and end are the same point
          fc.pre(
            Math.abs(endPoint.x - startPoint.x) > 1
            || Math.abs(endPoint.y - startPoint.y) > 1
          )

          const deps = createMockDependencies()
          const tools = useDrawingTools(
            deps.properties,
            deps.overlayCanvasRef,
            deps.addLayer,
            deps.renderLayer,
            deps.removeLayer,
            deps.getLayerAtPoint,
            deps.renderAllLayers
          )

          // Enable shape constraints (Shift key)
          tools.updateToolOptions({ constrainShapes: true })

          // Select line tool
          tools.selectTool('line')

          // Draw line
          tools.handleDrawStart(startPoint)
          tools.handleDrawEnd(endPoint)

          // Get the created layer
          expect(deps.addLayer).toHaveBeenCalledTimes(1)
          const layer = deps.addLayer.mock.calls[0]![0]
          const shapeData = layer.data as ShapeData

          // Calculate the angle of the constrained line
          const dx = shapeData.end.x - shapeData.start.x
          const dy = shapeData.end.y - shapeData.start.y
          const angle = Math.atan2(dy, dx)
          const angleDegrees = (angle * 180) / Math.PI

          // Assert: angle should be a multiple of 45 degrees
          // Valid angles: 0, 45, 90, 135, 180, -45, -90, -135
          // Normalize the remainder to handle edge cases
          const remainder = Math.abs(angleDegrees % 45)
          const normalizedRemainder = Math.min(remainder, 45 - remainder)
          expect(normalizedRemainder).toBeLessThan(0.1) // Allow small floating point error

          // Assert: constrained flag should be set
          expect(shapeData.constrained).toBe(true)

          // Assert: distance should be preserved (same as original)
          const originalDistance = Math.sqrt(
            (endPoint.x - startPoint.x) ** 2
            + (endPoint.y - startPoint.y) ** 2
          )
          const constrainedDistance = Math.sqrt(dx ** 2 + dy ** 2)
          expect(constrainedDistance).toBeCloseTo(originalDistance, 5)
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: drawing-tools, Property 7: Constrained Line Angles
   * **Validates: Requirements 2.10**
   *
   * Test that arrows are also constrained to 45-degree increments.
   */
  test('Property 7: Constrained Line Angles - arrows constrained to 45-degree increments', () => {
    fc.assert(
      fc.property(
        pointArbitrary,
        pointArbitrary,
        (startPoint, endPoint) => {
          // Skip if start and end are the same point
          fc.pre(
            Math.abs(endPoint.x - startPoint.x) > 1
            || Math.abs(endPoint.y - startPoint.y) > 1
          )

          const deps = createMockDependencies()
          const tools = useDrawingTools(
            deps.properties,
            deps.overlayCanvasRef,
            deps.addLayer,
            deps.renderLayer,
            deps.removeLayer,
            deps.getLayerAtPoint,
            deps.renderAllLayers
          )

          // Enable shape constraints (Shift key)
          tools.updateToolOptions({ constrainShapes: true })

          // Select arrow tool
          tools.selectTool('arrow')

          // Draw arrow
          tools.handleDrawStart(startPoint)
          tools.handleDrawEnd(endPoint)

          // Get the created layer
          expect(deps.addLayer).toHaveBeenCalledTimes(1)
          const layer = deps.addLayer.mock.calls[0]![0]
          const shapeData = layer.data as ShapeData

          // Calculate the angle of the constrained arrow
          const dx = shapeData.end.x - shapeData.start.x
          const dy = shapeData.end.y - shapeData.start.y
          const angle = Math.atan2(dy, dx)
          const angleDegrees = (angle * 180) / Math.PI

          // Assert: angle should be a multiple of 45 degrees
          // Normalize the remainder to handle edge cases (e.g., -135 degrees)
          const remainder = Math.abs(angleDegrees % 45)
          const normalizedRemainder = Math.min(remainder, 45 - remainder)
          expect(normalizedRemainder).toBeLessThan(0.1) // Allow small floating point error

          // Assert: constrained flag should be set
          expect(shapeData.constrained).toBe(true)

          // Assert: distance should be preserved
          const originalDistance = Math.sqrt(
            (endPoint.x - startPoint.x) ** 2
            + (endPoint.y - startPoint.y) ** 2
          )
          const constrainedDistance = Math.sqrt(dx ** 2 + dy ** 2)
          expect(constrainedDistance).toBeCloseTo(originalDistance, 5)
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: drawing-tools, Property 7: Constrained Line Angles
   * **Validates: Requirements 2.10**
   *
   * Test that lines are NOT constrained when constrainShapes is disabled.
   */
  test('Property 7: Constrained Line Angles - lines not constrained without Shift key', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('line', 'arrow'),
        pointArbitrary,
        pointArbitrary,
        (shapeType, startPoint, endPoint) => {
          // Skip if start and end are the same point
          fc.pre(
            Math.abs(endPoint.x - startPoint.x) > 1
            || Math.abs(endPoint.y - startPoint.y) > 1
          )

          // Skip if the angle is already a multiple of 45 degrees
          const dx = endPoint.x - startPoint.x
          const dy = endPoint.y - startPoint.y
          const angle = Math.atan2(dy, dx)
          const angleDegrees = (angle * 180) / Math.PI
          const remainder = Math.abs(angleDegrees % 45)
          fc.pre(remainder > 5) // Ensure it's not already at 45-degree increment

          const deps = createMockDependencies()
          const tools = useDrawingTools(
            deps.properties,
            deps.overlayCanvasRef,
            deps.addLayer,
            deps.renderLayer,
            deps.removeLayer,
            deps.getLayerAtPoint,
            deps.renderAllLayers
          )

          // Disable shape constraints (no Shift key)
          tools.updateToolOptions({ constrainShapes: false })

          // Select line/arrow tool
          tools.selectTool(shapeType as 'line' | 'arrow')

          // Draw line/arrow
          tools.handleDrawStart(startPoint)
          tools.handleDrawEnd(endPoint)

          // Get the created layer
          expect(deps.addLayer).toHaveBeenCalledTimes(1)
          const layer = deps.addLayer.mock.calls[0]![0]
          const shapeData = layer.data as ShapeData

          // Assert: end point should match the original end point (no constraint applied)
          expect(shapeData.end).toEqual(endPoint)

          // Assert: constrained flag should be false
          expect(shapeData.constrained).toBe(false)
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: drawing-tools, Property 6 & 7: Constraint Consistency
   * **Validates: Requirements 2.9, 2.10**
   *
   * Test that constraints are applied consistently across multiple shapes.
   */
  test('Property 6 & 7: Constraints applied consistently across multiple shapes', () => {
    fc.assert(
      fc.property(
        shapeTypeArbitrary,
        fc.array(
          fc.record({
            start: pointArbitrary,
            end: pointArbitrary,
          }),
          { minLength: 2, maxLength: 10 }
        ),
        (shapeType, shapePairs) => {
          const deps = createMockDependencies()
          const tools = useDrawingTools(
            deps.properties,
            deps.overlayCanvasRef,
            deps.addLayer,
            deps.renderLayer,
            deps.removeLayer,
            deps.getLayerAtPoint,
            deps.renderAllLayers
          )

          // Enable shape constraints
          tools.updateToolOptions({ constrainShapes: true })

          // Select shape tool
          tools.selectTool(shapeType as 'rectangle' | 'circle' | 'line' | 'arrow')

          // Draw multiple shapes
          for (const { start, end } of shapePairs) {
            // Skip if start and end are too close
            if (
              Math.abs(end.x - start.x) < 1
              && Math.abs(end.y - start.y) < 1
            ) {
              continue
            }

            tools.handleDrawStart(start)
            tools.handleDrawEnd(end)
          }

          // Verify all created layers have constrained flag set
          const layers = deps.addLayer.mock.calls.map(call => call[0])
          for (const layer of layers) {
            const shapeData = layer.data as ShapeData
            expect(shapeData.constrained).toBe(true)

            // Verify constraint is applied based on shape type
            if (shapeType === 'rectangle' || shapeType === 'circle') {
              // Should have 1:1 aspect ratio
              const width = Math.abs(shapeData.end.x - shapeData.start.x)
              const height = Math.abs(shapeData.end.y - shapeData.start.y)
              expect(width).toBeCloseTo(height, 5)
            }
            else if (shapeType === 'line' || shapeType === 'arrow') {
              // Should have angle at 45-degree increment
              const dx = shapeData.end.x - shapeData.start.x
              const dy = shapeData.end.y - shapeData.start.y
              const angle = Math.atan2(dy, dx)
              const angleDegrees = (angle * 180) / Math.PI
              const remainder = Math.abs(angleDegrees % 45)
              const normalizedRemainder = Math.min(remainder, 45 - remainder)
              expect(normalizedRemainder).toBeLessThan(0.1)
            }
          }
        },
      ),
      { numRuns: 50 },
    )
  })
})

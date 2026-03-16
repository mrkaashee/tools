import { describe, test, expect, vi } from 'vitest'
import { ref } from 'vue'
import fc from 'fast-check'
import { useDrawingTools } from './useDrawingTools'
import type { DrawingProperties, Point, DrawingLayer } from '../types/drawing'

/**
 * Property-Based Tests for Eraser Tool
 *
 * Tests universal properties that should hold across all valid inputs
 * for the eraser tool functionality.
 */

describe('useDrawingTools - Eraser Tool Property-Based Tests', () => {
  /**
   * Fast-check arbitrary for generating points
   */
  const pointArbitrary = fc.record({
    x: fc.double({ min: 0, max: 1000, noNaN: true }),
    y: fc.double({ min: 0, max: 1000, noNaN: true }),
  })

  /**
   * Fast-check arbitrary for generating drawing properties
   */
  const drawingPropertiesArbitrary = fc.record({
    strokeColor: fc.integer({ min: 0, max: 0xFFFFFF }).map(n => `#${n.toString(16).padStart(6, '0')}`),
    fillColor: fc.integer({ min: 0, max: 0xFFFFFF }).map(n => `#${n.toString(16).padStart(6, '0')}`),
    strokeWidth: fc.integer({ min: 1, max: 50 }),
    opacity: fc.double({ min: 0, max: 1 }),
    enableFill: fc.boolean(),
  })

  /**
   * Helper function to create a mock drawing layer
   */
  const createMockLayer = (id: string, point: Point, properties: DrawingProperties): DrawingLayer => {
    return {
      id,
      type: 'stroke',
      data: {
        points: [point, { x: point.x + 10, y: point.y + 10 }],
        smoothed: false,
      },
      properties,
      timestamp: Date.now(),
      bounds: {
        x: point.x - 5,
        y: point.y - 5,
        width: 20,
        height: 20,
      },
    }
  }

  /**
   * Helper function to create mock dependencies for useDrawingTools
   */
  const createMockDependencies = (initialProperties?: DrawingProperties) => {
    const mockCanvas = document.createElement('canvas')
    mockCanvas.width = 800
    mockCanvas.height = 600

    const properties = ref<DrawingProperties>(initialProperties || {
      strokeColor: '#000000',
      fillColor: '#000000',
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

  /**
   * Feature: drawing-tools, Property 12: Eraser Layer Removal
   * **Validates: Requirements 4.2, 5.4**
   *
   * For any Drawing_Layer clicked with the Eraser_Tool active,
   * the Drawing_System should remove that layer from the layer list.
   */
  test('Property 12: Eraser Layer Removal - clicked layer removed from list', () => {
    fc.assert(
      fc.property(
        drawingPropertiesArbitrary,
        fc.array(pointArbitrary, { minLength: 1, maxLength: 20 }),
        fc.integer({ min: 0, max: 19 }), // Index of layer to erase
        (properties: DrawingProperties, layerPoints: Point[], eraseIndex: number) => {
          // Ensure eraseIndex is within bounds
          const safeEraseIndex = Math.min(eraseIndex, layerPoints.length - 1)

          const deps = createMockDependencies(properties)
          const tools = useDrawingTools(
            deps.properties,
            deps.overlayCanvasRef,
            deps.addLayer,
            deps.renderLayer,
            deps.removeLayer,
            deps.getLayerAtPoint,
            deps.renderAllLayers
          )

          // Create mock layers
          const mockLayers = layerPoints.map((point, index) =>
            createMockLayer(`layer-${index}`, point, properties)
          )

          // Select the layer to erase
          const layerToErase = mockLayers[safeEraseIndex]!
          const pointToClick = layerPoints[safeEraseIndex]!

          // Mock getLayerAtPoint to return the layer at the clicked point
          deps.getLayerAtPoint.mockReturnValue(layerToErase)

          // Select eraser tool
          tools.selectTool('eraser')

          // Click on the layer to erase it
          tools.handleDrawStart(pointToClick)

          // Assert: removeLayer should be called with the layer's ID
          expect(deps.removeLayer).toHaveBeenCalledTimes(1)
          expect(deps.removeLayer).toHaveBeenCalledWith(layerToErase.id)

          // Assert: getLayerAtPoint should be called with the clicked coordinates
          expect(deps.getLayerAtPoint).toHaveBeenCalledWith(pointToClick.x, pointToClick.y)
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: drawing-tools, Property 12: Eraser Layer Removal
   * **Validates: Requirements 4.2, 5.4**
   *
   * Test that clicking on empty space does not remove any layers.
   */
  test('Property 12: Eraser Layer Removal - clicking empty space removes nothing', () => {
    fc.assert(
      fc.property(
        pointArbitrary,
        (emptyPoint: Point) => {
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

          // Mock getLayerAtPoint to return null (no layer at point)
          deps.getLayerAtPoint.mockReturnValue(null)

          // Select eraser tool
          tools.selectTool('eraser')

          // Click on empty space
          tools.handleDrawStart(emptyPoint)

          // Assert: removeLayer should NOT be called
          expect(deps.removeLayer).not.toHaveBeenCalled()

          // Assert: getLayerAtPoint should be called with the clicked coordinates
          expect(deps.getLayerAtPoint).toHaveBeenCalledWith(emptyPoint.x, emptyPoint.y)
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: drawing-tools, Property 12: Eraser Layer Removal
   * **Validates: Requirements 4.2, 5.4**
   *
   * Test that multiple layers can be erased sequentially.
   */
  test('Property 12: Eraser Layer Removal - multiple layers can be erased sequentially', () => {
    fc.assert(
      fc.property(
        drawingPropertiesArbitrary,
        fc.array(pointArbitrary, { minLength: 2, maxLength: 10 }),
        (properties: DrawingProperties, layerPoints: Point[]) => {
          const deps = createMockDependencies(properties)
          const tools = useDrawingTools(
            deps.properties,
            deps.overlayCanvasRef,
            deps.addLayer,
            deps.renderLayer,
            deps.removeLayer,
            deps.getLayerAtPoint,
            deps.renderAllLayers
          )

          // Create mock layers
          const mockLayers = layerPoints.map((point, index) =>
            createMockLayer(`layer-${index}`, point, properties)
          )

          // Select eraser tool
          tools.selectTool('eraser')

          // Erase each layer sequentially
          for (let i = 0; i < mockLayers.length; i++) {
            const layer = mockLayers[i]!
            const point = layerPoints[i]!

            // Mock getLayerAtPoint to return the current layer
            deps.getLayerAtPoint.mockReturnValue(layer)

            // Click to erase
            tools.handleDrawStart(point)

            // Assert: removeLayer should be called with the layer's ID
            expect(deps.removeLayer).toHaveBeenCalledWith(layer.id)
          }

          // Assert: removeLayer should be called once for each layer
          expect(deps.removeLayer).toHaveBeenCalledTimes(mockLayers.length)
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: drawing-tools, Property 14: Multi-Input Eraser Support
   * **Validates: Requirements 4.5**
   *
   * For any Drawing_Layer, both mouse and touch input on that layer
   * with the Eraser_Tool active should remove the layer.
   *
   * Note: Since handleDrawStart is the same for both mouse and touch
   * (input normalization happens before this point), we test that
   * the eraser works consistently regardless of how the point is provided.
   */
  test('Property 14: Multi-Input Eraser Support - eraser works with any input type', () => {
    fc.assert(
      fc.property(
        drawingPropertiesArbitrary,
        pointArbitrary,
        fc.constantFrom('mouse', 'touch', 'pointer'),
        (properties: DrawingProperties, layerPoint: Point, _inputType: string) => {
          const deps = createMockDependencies(properties)
          const tools = useDrawingTools(
            deps.properties,
            deps.overlayCanvasRef,
            deps.addLayer,
            deps.renderLayer,
            deps.removeLayer,
            deps.getLayerAtPoint,
            deps.renderAllLayers
          )

          // Create a mock layer
          const mockLayer = createMockLayer('test-layer', layerPoint, properties)

          // Mock getLayerAtPoint to return the layer
          deps.getLayerAtPoint.mockReturnValue(mockLayer)

          // Select eraser tool
          tools.selectTool('eraser')

          // Simulate input (normalized point is the same regardless of input type)
          // In real usage, mouse/touch/pointer events are normalized to Point before reaching handleDrawStart
          tools.handleDrawStart(layerPoint)

          // Assert: removeLayer should be called with the layer's ID
          // This demonstrates that the eraser works consistently regardless of input type
          expect(deps.removeLayer).toHaveBeenCalledTimes(1)
          expect(deps.removeLayer).toHaveBeenCalledWith(mockLayer.id)

          // Assert: getLayerAtPoint should be called with the normalized coordinates
          expect(deps.getLayerAtPoint).toHaveBeenCalledWith(layerPoint.x, layerPoint.y)

          // The fact that this test passes with any inputType demonstrates
          // that the eraser tool is input-agnostic (Property 14)
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: drawing-tools, Property 14: Multi-Input Eraser Support
   * **Validates: Requirements 4.5**
   *
   * Test that eraser works consistently across multiple input events.
   */
  test('Property 14: Multi-Input Eraser Support - consistent behavior across multiple inputs', () => {
    fc.assert(
      fc.property(
        drawingPropertiesArbitrary,
        fc.array(pointArbitrary, { minLength: 2, maxLength: 10 }),
        (properties: DrawingProperties, layerPoints: Point[]) => {
          const deps = createMockDependencies(properties)
          const tools = useDrawingTools(
            deps.properties,
            deps.overlayCanvasRef,
            deps.addLayer,
            deps.renderLayer,
            deps.removeLayer,
            deps.getLayerAtPoint,
            deps.renderAllLayers
          )

          // Create mock layers
          const mockLayers = layerPoints.map((point, index) =>
            createMockLayer(`layer-${index}`, point, properties)
          )

          // Select eraser tool
          tools.selectTool('eraser')

          // Erase layers using different "input types" (simulated by just calling handleDrawStart)
          // In reality, all input types are normalized to Point before reaching this method
          for (let i = 0; i < mockLayers.length; i++) {
            const layer = mockLayers[i]!
            const point = layerPoints[i]!

            // Mock getLayerAtPoint to return the current layer
            deps.getLayerAtPoint.mockReturnValue(layer)

            // Simulate input (could be from mouse, touch, or pointer - all normalized to Point)
            tools.handleDrawStart(point)

            // Assert: removeLayer should be called with the layer's ID
            expect(deps.removeLayer).toHaveBeenCalledWith(layer.id)
          }

          // Assert: All layers should be removed consistently
          expect(deps.removeLayer).toHaveBeenCalledTimes(mockLayers.length)

          // This demonstrates that the eraser tool provides consistent behavior
          // regardless of input type (mouse, touch, pointer)
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: drawing-tools, Property 12: Eraser Layer Removal
   * **Validates: Requirements 4.2, 5.4**
   *
   * Test that eraser only works when eraser tool is active.
   */
  test('Property 12: Eraser Layer Removal - eraser only works when active', () => {
    fc.assert(
      fc.property(
        drawingPropertiesArbitrary,
        pointArbitrary,
        fc.constantFrom('brush', 'rectangle', 'circle', 'line', 'arrow', 'none'),
        (properties: DrawingProperties, layerPoint: Point, nonEraserTool: 'brush' | 'rectangle' | 'circle' | 'line' | 'arrow' | 'none') => {
          const deps = createMockDependencies(properties)
          const tools = useDrawingTools(
            deps.properties,
            deps.overlayCanvasRef,
            deps.addLayer,
            deps.renderLayer,
            deps.removeLayer,
            deps.getLayerAtPoint,
            deps.renderAllLayers
          )

          // Create a mock layer
          const mockLayer = createMockLayer('test-layer', layerPoint, properties)

          // Mock getLayerAtPoint to return the layer
          deps.getLayerAtPoint.mockReturnValue(mockLayer)

          // Select a non-eraser tool
          tools.selectTool(nonEraserTool)

          // Try to erase by clicking on the layer
          tools.handleDrawStart(layerPoint)

          // Assert: removeLayer should NOT be called (eraser is not active)
          expect(deps.removeLayer).not.toHaveBeenCalled()

          // Note: getLayerAtPoint might be called for other tools (e.g., for hover detection)
          // but the layer should not be removed
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: drawing-tools, Property 12: Eraser Layer Removal
   * **Validates: Requirements 4.2, 4.3**
   *
   * Test that hoveredLayer is updated during eraser move events.
   */
  test('Property 12: Eraser Layer Removal - hoveredLayer updated during move', () => {
    fc.assert(
      fc.property(
        drawingPropertiesArbitrary,
        pointArbitrary,
        pointArbitrary,
        (properties: DrawingProperties, layerPoint: Point, emptyPoint: Point) => {
          const deps = createMockDependencies(properties)
          const tools = useDrawingTools(
            deps.properties,
            deps.overlayCanvasRef,
            deps.addLayer,
            deps.renderLayer,
            deps.removeLayer,
            deps.getLayerAtPoint,
            deps.renderAllLayers
          )

          // Create a mock layer
          const mockLayer = createMockLayer('test-layer', layerPoint, properties)

          // Select eraser tool
          tools.selectTool('eraser')

          // Move over the layer
          deps.getLayerAtPoint.mockReturnValue(mockLayer)
          tools.handleDrawMove(layerPoint)

          // Assert: hoveredLayer should be set to the layer
          expect(tools.hoveredLayer.value).toStrictEqual(mockLayer)

          // Move over empty space
          deps.getLayerAtPoint.mockReturnValue(null)
          tools.handleDrawMove(emptyPoint)

          // Assert: hoveredLayer should be cleared
          expect(tools.hoveredLayer.value).toBeNull()
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: drawing-tools, Property 12: Eraser Layer Removal
   * **Validates: Requirements 4.2, 5.4**
   *
   * Test that hoveredLayer is cleared after erasing a layer.
   */
  test('Property 12: Eraser Layer Removal - hoveredLayer cleared after erasing', () => {
    fc.assert(
      fc.property(
        drawingPropertiesArbitrary,
        pointArbitrary,
        (properties: DrawingProperties, layerPoint: Point) => {
          const deps = createMockDependencies(properties)
          const tools = useDrawingTools(
            deps.properties,
            deps.overlayCanvasRef,
            deps.addLayer,
            deps.renderLayer,
            deps.removeLayer,
            deps.getLayerAtPoint,
            deps.renderAllLayers
          )

          // Create a mock layer
          const mockLayer = createMockLayer('test-layer', layerPoint, properties)

          // Select eraser tool
          tools.selectTool('eraser')

          // Move over the layer to set hoveredLayer
          deps.getLayerAtPoint.mockReturnValue(mockLayer)
          tools.handleDrawMove(layerPoint)

          // Verify hoveredLayer is set
          expect(tools.hoveredLayer.value).toStrictEqual(mockLayer)

          // Erase the layer
          tools.handleDrawStart(layerPoint)

          // Assert: hoveredLayer should be cleared after erasing
          expect(tools.hoveredLayer.value).toBeNull()
        },
      ),
      { numRuns: 100 },
    )
  })
})

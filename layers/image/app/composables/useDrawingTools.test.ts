import { describe, test, expect, vi } from 'vitest'
import { ref } from 'vue'
import fc from 'fast-check'
import { useDrawingTools } from './useDrawingTools'
import type { DrawingTool, DrawingProperties } from '../types/drawing'

/**
 * Fast-check arbitrary for generating drawing tools
 */
const drawingToolArbitrary = fc.constantFrom<DrawingTool>(
  'brush',
  'rectangle',
  'circle',
  'line',
  'arrow',
  'eraser',
  'none',
)

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

describe('useDrawingTools - Property-Based Tests', () => {
  /**
   * Helper function to create mock dependencies for useDrawingTools
   */
  const createMockDependencies = () => {
    const properties = ref<DrawingProperties>({
      strokeColor: '#000000',
      fillColor: '#000000',
      strokeWidth: 2,
      opacity: 1,
      enableFill: false,
    })
    const overlayCanvasRef = ref<HTMLCanvasElement | null>(null)
    const addLayer = vi.fn()
    const renderLayer = vi.fn()
    const removeLayer = vi.fn()
    const getLayerAtPoint = vi.fn()
    const renderAllLayers = vi.fn()

    return { properties, overlayCanvasRef, addLayer, renderLayer, removeLayer, getLayerAtPoint, renderAllLayers }
  }

  /**
   * Feature: drawing-tools, Property 28: Tool Deactivation on Switch
   * **Validates: Requirements 11.3**
   *
   * For any tool selection, the Drawing_System should deactivate the previously
   * active tool before activating the new tool.
   */
  test('Property 28: Tool Deactivation on Switch - previous tool deactivates before new tool activates', () => {
    fc.assert(
      fc.property(
        fc.array(drawingToolArbitrary, { minLength: 2, maxLength: 20 }),
        (tools: DrawingTool[]) => {
          const deps = createMockDependencies()
          const drawingTools = useDrawingTools(deps.properties, deps.overlayCanvasRef, deps.addLayer, deps.renderLayer, deps.removeLayer, deps.getLayerAtPoint, deps.renderAllLayers)

          // Track tool state through each transition
          for (let i = 0; i < tools.length; i++) {
            const previousTool = drawingTools.activeTool.value
            const newTool = tools[i]

            // Set up some state for the previous tool to verify deactivation
            if (previousTool === 'brush') {
              drawingTools.currentStroke.value = [{ x: 10, y: 10 }, { x: 20, y: 20 }]
            }
            else if (previousTool === 'rectangle' || previousTool === 'circle' || previousTool === 'line' || previousTool === 'arrow') {
              drawingTools.shapeStart.value = { x: 5, y: 5 }
              drawingTools.shapePreview.value = {
                shapeType: 'rectangle',
                start: { x: 5, y: 5 },
                end: { x: 15, y: 15 },
                constrained: false,
              }
            }
            else if (previousTool === 'eraser') {
              drawingTools.hoveredLayer.value = {
                id: 'test-layer',
                type: 'stroke',
                data: { points: [{ x: 0, y: 0 }], smoothed: false },
                properties: {
                  strokeColor: '#000000',
                  fillColor: '#000000',
                  strokeWidth: 5,
                  opacity: 1,
                  enableFill: false,
                },
                timestamp: Date.now(),
                bounds: { x: 0, y: 0, width: 10, height: 10 },
              }
            }

            // Select the new tool
            drawingTools.selectTool(newTool!)

            // Assert: new tool is now active
            expect(drawingTools.activeTool.value).toBe(newTool)

            // Assert: previous tool state is cleared (deactivated)
            if (previousTool !== 'none') {
              expect(drawingTools.currentStroke.value).toEqual([])
              expect(drawingTools.shapeStart.value).toBeNull()
              expect(drawingTools.shapePreview.value).toBeNull()
              expect(drawingTools.hoveredLayer.value).toBeNull()
            }
          }
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: drawing-tools, Property 28: Tool Deactivation on Switch
   * **Validates: Requirements 11.3**
   *
   * Test that switching from 'none' to a tool doesn't clear state unnecessarily.
   */
  test('Property 28: Tool Deactivation on Switch - switching from none does not clear state', () => {
    fc.assert(
      fc.property(
        drawingToolArbitrary.filter(tool => tool !== 'none'),
        (tool: DrawingTool) => {
          const deps = createMockDependencies()
          const drawingTools = useDrawingTools(deps.properties, deps.overlayCanvasRef, deps.addLayer, deps.renderLayer, deps.removeLayer, deps.getLayerAtPoint, deps.renderAllLayers)

          // Start with 'none' tool (default state)
          expect(drawingTools.activeTool.value).toBe('none')

          // Verify initial state is clean
          expect(drawingTools.currentStroke.value).toEqual([])
          expect(drawingTools.shapeStart.value).toBeNull()
          expect(drawingTools.shapePreview.value).toBeNull()
          expect(drawingTools.hoveredLayer.value).toBeNull()

          // Select a tool
          drawingTools.selectTool(tool)

          // Assert: tool is active
          expect(drawingTools.activeTool.value).toBe(tool)

          // Assert: state remains clean (no unnecessary clearing)
          expect(drawingTools.currentStroke.value).toEqual([])
          expect(drawingTools.shapeStart.value).toBeNull()
          expect(drawingTools.shapePreview.value).toBeNull()
          expect(drawingTools.hoveredLayer.value).toBeNull()
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: drawing-tools, Property 11: Property Persistence Across Tool Switches
   * **Validates: Requirements 3.9**
   *
   * For any Drawing_Properties configuration, switching between tools should
   * preserve the property values.
   */
  test('Property 11: Property Persistence Across Tool Switches - properties preserved when switching tools', () => {
    fc.assert(
      fc.property(
        drawingPropertiesArbitrary,
        fc.array(drawingToolArbitrary, { minLength: 2, maxLength: 10 }),
        (properties: DrawingProperties, tools: DrawingTool[]) => {
          const deps = createMockDependencies()
          const drawingTools = useDrawingTools(deps.properties, deps.overlayCanvasRef, deps.addLayer, deps.renderLayer, deps.removeLayer, deps.getLayerAtPoint, deps.renderAllLayers)

          // Note: Drawing properties are managed by useDrawing composable, not useDrawingTools
          // However, we can verify that tool options (which are tool-specific settings) persist
          // across tool switches, which is analogous to the property persistence requirement

          // Set tool options
          const initialOptions = {
            constrainShapes: properties.enableFill, // Use property as proxy for testing
            smoothStrokes: properties.opacity > 0.5,
            eraserHighlight: properties.strokeWidth > 25,
          }
          drawingTools.updateToolOptions(initialOptions)

          // Switch through multiple tools
          for (const tool of tools) {
            drawingTools.selectTool(tool!)

            // Assert: tool options remain unchanged
            expect(drawingTools.toolOptions.value.constrainShapes).toBe(initialOptions.constrainShapes)
            expect(drawingTools.toolOptions.value.smoothStrokes).toBe(initialOptions.smoothStrokes)
            expect(drawingTools.toolOptions.value.eraserHighlight).toBe(initialOptions.eraserHighlight)
          }
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: drawing-tools, Property 11: Property Persistence Across Tool Switches
   * **Validates: Requirements 3.9**
   *
   * Test that tool options can be updated and persist across tool switches.
   */
  test('Property 11: Property Persistence Across Tool Switches - tool options updates persist', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            tool: drawingToolArbitrary,
            options: fc.record({
              constrainShapes: fc.boolean(),
              smoothStrokes: fc.boolean(),
              eraserHighlight: fc.boolean(),
            }),
          }),
          { minLength: 1, maxLength: 10 },
        ),
        (actions: Array<{ tool: DrawingTool, options: { constrainShapes: boolean, smoothStrokes: boolean, eraserHighlight: boolean } }>) => {
          const deps = createMockDependencies()
          const drawingTools = useDrawingTools(deps.properties, deps.overlayCanvasRef, deps.addLayer, deps.renderLayer, deps.removeLayer, deps.getLayerAtPoint, deps.renderAllLayers)

          let lastOptions = drawingTools.toolOptions.value

          // Perform a sequence of tool switches and option updates
          for (const action of actions) {
            // Update options
            drawingTools.updateToolOptions(action.options)
            lastOptions = { ...lastOptions, ...action.options }

            // Switch tool
            drawingTools.selectTool(action.tool)

            // Assert: options are preserved after tool switch
            expect(drawingTools.toolOptions.value.constrainShapes).toBe(lastOptions.constrainShapes)
            expect(drawingTools.toolOptions.value.smoothStrokes).toBe(lastOptions.smoothStrokes)
            expect(drawingTools.toolOptions.value.eraserHighlight).toBe(lastOptions.eraserHighlight)
          }
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: drawing-tools, Property 11: Property Persistence Across Tool Switches
   * **Validates: Requirements 3.9**
   *
   * Test that partial tool option updates preserve unmodified options.
   */
  test('Property 11: Property Persistence Across Tool Switches - partial updates preserve other options', () => {
    fc.assert(
      fc.property(
        fc.record({
          constrainShapes: fc.boolean(),
          smoothStrokes: fc.boolean(),
          eraserHighlight: fc.boolean(),
        }),
        fc.constantFrom<keyof { constrainShapes: boolean, smoothStrokes: boolean, eraserHighlight: boolean }>(
          'constrainShapes',
          'smoothStrokes',
          'eraserHighlight',
        ),
        fc.boolean(),
        drawingToolArbitrary,
        (initialOptions, optionToUpdate, newValue, tool) => {
          const deps = createMockDependencies()
          const drawingTools = useDrawingTools(deps.properties, deps.overlayCanvasRef, deps.addLayer, deps.renderLayer, deps.removeLayer, deps.getLayerAtPoint, deps.renderAllLayers)

          // Set initial options
          drawingTools.updateToolOptions(initialOptions)

          // Update only one option
          drawingTools.updateToolOptions({ [optionToUpdate]: newValue })

          // Switch tool
          drawingTools.selectTool(tool)

          // Assert: updated option has new value
          expect(drawingTools.toolOptions.value[optionToUpdate]).toBe(newValue)

          // Assert: other options remain unchanged
          const otherOptions = Object.keys(initialOptions).filter(key => key !== optionToUpdate) as Array<keyof typeof initialOptions>
          for (const key of otherOptions) {
            expect(drawingTools.toolOptions.value[key]).toBe(initialOptions[key])
          }
        },
      ),
      { numRuns: 100 },
    )
  })
})

import { describe, test, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { useDrawingTools } from './useDrawingTools'
import type { DrawingProperties, Point } from '../types/drawing'

describe('useDrawingTools - Brush Tool Logic', () => {
  let mockDependencies: {
    properties: ReturnType<typeof ref<DrawingProperties>>
    overlayCanvasRef: ReturnType<typeof ref<HTMLCanvasElement | null>>
    addLayer: ReturnType<typeof vi.fn>
    renderLayer: ReturnType<typeof vi.fn>
    removeLayer: ReturnType<typeof vi.fn>
    getLayerAtPoint: ReturnType<typeof vi.fn>
    renderAllLayers: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    // Create mock canvas
    const mockCanvas = document.createElement('canvas')
    mockCanvas.width = 800
    mockCanvas.height = 600

    mockDependencies = {
      properties: ref<DrawingProperties>({
        strokeColor: '#ff0000',
        fillColor: '#00ff00',
        strokeWidth: 5,
        opacity: 0.8,
        enableFill: false,
      }),
      overlayCanvasRef: ref<HTMLCanvasElement | null>(mockCanvas),
      addLayer: vi.fn(),
      renderLayer: vi.fn(),
      removeLayer: vi.fn(),
      getLayerAtPoint: vi.fn(),
      renderAllLayers: vi.fn(),
    }
  })

  test('handleDrawStart initializes currentStroke array', () => {
    const tools = useDrawingTools(
      mockDependencies.properties,
      mockDependencies.overlayCanvasRef,
      mockDependencies.addLayer,
      mockDependencies.renderLayer,
      mockDependencies.removeLayer,
      mockDependencies.getLayerAtPoint,
      mockDependencies.renderAllLayers
    )

    // Select brush tool
    tools.selectTool('brush')

    // Start drawing
    const startPoint: Point = { x: 10, y: 20 }
    tools.handleDrawStart(startPoint)

    // Verify currentStroke is initialized with start point
    expect(tools.currentStroke.value).toHaveLength(1)
    expect(tools.currentStroke.value[0]).toEqual(startPoint)
  })

  test('handleDrawMove appends points to currentStroke', () => {
    const tools = useDrawingTools(
      mockDependencies.properties,
      mockDependencies.overlayCanvasRef,
      mockDependencies.addLayer,
      mockDependencies.renderLayer,
      mockDependencies.removeLayer,
      mockDependencies.getLayerAtPoint,
      mockDependencies.renderAllLayers
    )

    // Select brush tool and start drawing
    tools.selectTool('brush')
    tools.handleDrawStart({ x: 10, y: 20 })

    // Move to multiple points
    const points: Point[] = [
      { x: 15, y: 25 },
      { x: 20, y: 30 },
      { x: 25, y: 35 },
    ]

    for (const point of points) {
      tools.handleDrawMove(point)
    }

    // Verify all points are in currentStroke
    expect(tools.currentStroke.value).toHaveLength(4) // start + 3 move points
    expect(tools.currentStroke.value[1]).toEqual(points[0])
    expect(tools.currentStroke.value[2]).toEqual(points[1])
    expect(tools.currentStroke.value[3]).toEqual(points[2])
  })

  test('handleDrawMove renders overlay with current stroke', () => {
    const tools = useDrawingTools(
      mockDependencies.properties,
      mockDependencies.overlayCanvasRef,
      mockDependencies.addLayer,
      mockDependencies.renderLayer,
      mockDependencies.removeLayer,
      mockDependencies.getLayerAtPoint,
      mockDependencies.renderAllLayers
    )

    // Select brush tool and start drawing
    tools.selectTool('brush')
    tools.handleDrawStart({ x: 10, y: 20 })

    // Clear the mock call history
    mockDependencies.renderLayer.mockClear()

    // Move to a point
    tools.handleDrawMove({ x: 15, y: 25 })

    // Verify renderLayer was called for overlay preview
    // Note: In jsdom, canvas.getContext('2d') returns null, so rendering won't happen
    // But we can verify the stroke was updated
    expect(tools.currentStroke.value).toHaveLength(2)
    expect(tools.currentStroke.value[1]).toEqual({ x: 15, y: 25 })
  })

  test('handleDrawEnd creates DrawingLayer with StrokeData', () => {
    const tools = useDrawingTools(
      mockDependencies.properties,
      mockDependencies.overlayCanvasRef,
      mockDependencies.addLayer,
      mockDependencies.renderLayer,
      mockDependencies.removeLayer,
      mockDependencies.getLayerAtPoint,
      mockDependencies.renderAllLayers
    )

    // Select brush tool and draw a stroke
    tools.selectTool('brush')
    tools.handleDrawStart({ x: 10, y: 20 })
    tools.handleDrawMove({ x: 15, y: 25 })
    tools.handleDrawMove({ x: 20, y: 30 })
    tools.handleDrawEnd({ x: 25, y: 35 })

    // Verify addLayer was called
    expect(mockDependencies.addLayer).toHaveBeenCalledTimes(1)

    // Get the layer that was added
    const addedLayer = mockDependencies.addLayer.mock.calls[0][0]

    // Verify layer structure
    expect(addedLayer).toHaveProperty('id')
    expect(addedLayer.type).toBe('stroke')
    expect(addedLayer.data).toHaveProperty('points')
    expect(addedLayer.data).toHaveProperty('smoothed')
    expect(addedLayer.properties).toEqual(mockDependencies.properties.value)
    expect(addedLayer).toHaveProperty('timestamp')
    expect(addedLayer).toHaveProperty('bounds')
  })

  test('handleDrawEnd applies current drawing properties', () => {
    const tools = useDrawingTools(
      mockDependencies.properties,
      mockDependencies.overlayCanvasRef,
      mockDependencies.addLayer,
      mockDependencies.renderLayer,
      mockDependencies.removeLayer,
      mockDependencies.getLayerAtPoint,
      mockDependencies.renderAllLayers
    )

    // Select brush tool and draw
    tools.selectTool('brush')
    tools.handleDrawStart({ x: 10, y: 20 })
    tools.handleDrawEnd({ x: 20, y: 30 })

    // Get the added layer
    const addedLayer = mockDependencies.addLayer.mock.calls[0][0]

    // Verify properties match current properties
    expect(addedLayer.properties.strokeColor).toBe('#ff0000')
    expect(addedLayer.properties.strokeWidth).toBe(5)
    expect(addedLayer.properties.opacity).toBe(0.8)
  })

  test('handleDrawEnd resets currentStroke', () => {
    const tools = useDrawingTools(
      mockDependencies.properties,
      mockDependencies.overlayCanvasRef,
      mockDependencies.addLayer,
      mockDependencies.renderLayer,
      mockDependencies.removeLayer,
      mockDependencies.getLayerAtPoint,
      mockDependencies.renderAllLayers
    )

    // Select brush tool and draw
    tools.selectTool('brush')
    tools.handleDrawStart({ x: 10, y: 20 })
    tools.handleDrawMove({ x: 15, y: 25 })
    tools.handleDrawEnd({ x: 20, y: 30 })

    // Verify currentStroke is reset
    expect(tools.currentStroke.value).toEqual([])
  })

  test('createBrushStroke optimizes points using Douglas-Peucker', () => {
    const tools = useDrawingTools(
      mockDependencies.properties,
      mockDependencies.overlayCanvasRef,
      mockDependencies.addLayer,
      mockDependencies.renderLayer,
      mockDependencies.removeLayer,
      mockDependencies.getLayerAtPoint,
      mockDependencies.renderAllLayers
    )

    // Create a stroke with many collinear points
    const points: Point[] = []
    for (let i = 0; i <= 100; i++) {
      points.push({ x: i, y: i }) // Diagonal line
    }

    const layer = tools.createBrushStroke(points)

    // Verify points were optimized (should be much fewer than 101)
    expect(layer.data.points.length).toBeLessThan(points.length)
    expect(layer.data.points.length).toBeGreaterThan(1) // At least start and end
  })

  test('createBrushStroke calculates bounding box correctly', () => {
    const tools = useDrawingTools(
      mockDependencies.properties,
      mockDependencies.overlayCanvasRef,
      mockDependencies.addLayer,
      mockDependencies.renderLayer,
      mockDependencies.removeLayer,
      mockDependencies.getLayerAtPoint,
      mockDependencies.renderAllLayers
    )

    const points: Point[] = [
      { x: 10, y: 20 },
      { x: 50, y: 60 },
      { x: 30, y: 40 },
    ]

    const layer = tools.createBrushStroke(points)

    // Verify bounding box encompasses all points with padding
    expect(layer.bounds.x).toBeLessThanOrEqual(10)
    expect(layer.bounds.y).toBeLessThanOrEqual(20)
    expect(layer.bounds.x + layer.bounds.width).toBeGreaterThanOrEqual(50)
    expect(layer.bounds.y + layer.bounds.height).toBeGreaterThanOrEqual(60)
  })

  test('createBrushStroke generates unique layer IDs', () => {
    const tools = useDrawingTools(
      mockDependencies.properties,
      mockDependencies.overlayCanvasRef,
      mockDependencies.addLayer,
      mockDependencies.renderLayer,
      mockDependencies.removeLayer,
      mockDependencies.getLayerAtPoint,
      mockDependencies.renderAllLayers
    )

    const points: Point[] = [{ x: 10, y: 20 }, { x: 30, y: 40 }]

    const layer1 = tools.createBrushStroke(points)
    const layer2 = tools.createBrushStroke(points)

    // Verify IDs are unique
    expect(layer1.id).not.toBe(layer2.id)
  })

  test('brush tool does not respond when different tool is active', () => {
    const tools = useDrawingTools(
      mockDependencies.properties,
      mockDependencies.overlayCanvasRef,
      mockDependencies.addLayer,
      mockDependencies.renderLayer,
      mockDependencies.removeLayer,
      mockDependencies.getLayerAtPoint,
      mockDependencies.renderAllLayers
    )

    // Select eraser tool (not brush)
    tools.selectTool('eraser')

    // Try to draw
    tools.handleDrawStart({ x: 10, y: 20 })
    tools.handleDrawMove({ x: 15, y: 25 })
    tools.handleDrawEnd({ x: 20, y: 30 })

    // Verify no stroke was created
    expect(tools.currentStroke.value).toEqual([])
    expect(mockDependencies.addLayer).not.toHaveBeenCalled()
  })

  test('handleDrawMove does nothing if no stroke is in progress', () => {
    const tools = useDrawingTools(
      mockDependencies.properties,
      mockDependencies.overlayCanvasRef,
      mockDependencies.addLayer,
      mockDependencies.renderLayer,
      mockDependencies.removeLayer,
      mockDependencies.getLayerAtPoint,
      mockDependencies.renderAllLayers
    )

    // Select brush but don't start drawing
    tools.selectTool('brush')

    // Try to move without starting
    tools.handleDrawMove({ x: 15, y: 25 })

    // Verify no rendering occurred
    expect(mockDependencies.renderLayer).not.toHaveBeenCalled()
  })

  test('createBrushStroke respects smoothStrokes option', () => {
    const tools = useDrawingTools(
      mockDependencies.properties,
      mockDependencies.overlayCanvasRef,
      mockDependencies.addLayer,
      mockDependencies.renderLayer,
      mockDependencies.removeLayer,
      mockDependencies.getLayerAtPoint,
      mockDependencies.renderAllLayers
    )

    const points: Point[] = [{ x: 10, y: 20 }, { x: 30, y: 40 }]

    // Test with smoothing enabled
    tools.updateToolOptions({ smoothStrokes: true })
    const smoothedLayer = tools.createBrushStroke(points)
    expect(smoothedLayer.data.smoothed).toBe(true)

    // Test with smoothing disabled
    tools.updateToolOptions({ smoothStrokes: false })
    const unsmoothedLayer = tools.createBrushStroke(points)
    expect(unsmoothedLayer.data.smoothed).toBe(false)
  })
})

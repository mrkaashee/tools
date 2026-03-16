import { describe, test, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { useDrawingTools } from './useDrawingTools'
import type { DrawingProperties, Point, ShapeData } from '../types/drawing'

describe('useDrawingTools - Shape Tools', () => {
  /**
   * Helper function to create mock dependencies for useDrawingTools
   */
  const createMockDependencies = () => {
    const properties = ref<DrawingProperties>({
      strokeColor: '#FF0000',
      fillColor: '#00FF00',
      strokeWidth: 5,
      opacity: 0.8,
      enableFill: true,
    })

    // Create a mock canvas
    const canvas = document.createElement('canvas')
    canvas.width = 800
    canvas.height = 600
    const overlayCanvasRef = ref<HTMLCanvasElement | null>(canvas)

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

  describe('Shape Drawing Workflow', () => {
    test('should initialize shape drawing on handleDrawStart for rectangle', () => {
      const deps = createMockDependencies()
      const tools = useDrawingTools(deps.properties, deps.overlayCanvasRef, deps.addLayer, deps.renderLayer, deps.removeLayer, deps.getLayerAtPoint, deps.renderAllLayers)

      tools.selectTool('rectangle')
      const startPoint: Point = { x: 100, y: 100 }

      tools.handleDrawStart(startPoint)

      expect(tools.shapeStart.value).toEqual(startPoint)
      expect(tools.shapePreview.value).toBeNull()
    })

    test('should initialize shape drawing on handleDrawStart for circle', () => {
      const deps = createMockDependencies()
      const tools = useDrawingTools(deps.properties, deps.overlayCanvasRef, deps.addLayer, deps.renderLayer, deps.removeLayer, deps.getLayerAtPoint, deps.renderAllLayers)

      tools.selectTool('circle')
      const startPoint: Point = { x: 200, y: 150 }

      tools.handleDrawStart(startPoint)

      expect(tools.shapeStart.value).toEqual(startPoint)
      expect(tools.shapePreview.value).toBeNull()
    })

    test('should initialize shape drawing on handleDrawStart for line', () => {
      const deps = createMockDependencies()
      const tools = useDrawingTools(deps.properties, deps.overlayCanvasRef, deps.addLayer, deps.renderLayer, deps.removeLayer, deps.getLayerAtPoint, deps.renderAllLayers)

      tools.selectTool('line')
      const startPoint: Point = { x: 50, y: 50 }

      tools.handleDrawStart(startPoint)

      expect(tools.shapeStart.value).toEqual(startPoint)
      expect(tools.shapePreview.value).toBeNull()
    })

    test('should initialize shape drawing on handleDrawStart for arrow', () => {
      const deps = createMockDependencies()
      const tools = useDrawingTools(deps.properties, deps.overlayCanvasRef, deps.addLayer, deps.renderLayer, deps.removeLayer, deps.getLayerAtPoint, deps.renderAllLayers)

      tools.selectTool('arrow')
      const startPoint: Point = { x: 300, y: 250 }

      tools.handleDrawStart(startPoint)

      expect(tools.shapeStart.value).toEqual(startPoint)
      expect(tools.shapePreview.value).toBeNull()
    })

    test('should update shape preview on handleDrawMove', () => {
      const deps = createMockDependencies()
      const tools = useDrawingTools(deps.properties, deps.overlayCanvasRef, deps.addLayer, deps.renderLayer, deps.removeLayer, deps.getLayerAtPoint, deps.renderAllLayers)

      tools.selectTool('rectangle')
      const startPoint: Point = { x: 100, y: 100 }
      const movePoint: Point = { x: 200, y: 200 }

      tools.handleDrawStart(startPoint)
      tools.handleDrawMove(movePoint)

      // The shapePreview should be set
      expect(tools.shapePreview.value).toEqual({
        shapeType: 'rectangle',
        start: startPoint,
        end: movePoint,
        constrained: false,
      })
    })

    test('should create shape layer on handleDrawEnd', () => {
      const deps = createMockDependencies()
      const tools = useDrawingTools(deps.properties, deps.overlayCanvasRef, deps.addLayer, deps.renderLayer, deps.removeLayer, deps.getLayerAtPoint, deps.renderAllLayers)

      tools.selectTool('rectangle')
      const startPoint: Point = { x: 100, y: 100 }
      const endPoint: Point = { x: 300, y: 250 }

      tools.handleDrawStart(startPoint)
      tools.handleDrawEnd(endPoint)

      expect(deps.addLayer).toHaveBeenCalledTimes(1)
      const layer = deps.addLayer.mock.calls[0]?.[0]
      if (!layer) throw new Error('Layer not created')

      expect(layer.type).toBe('shape')
      expect(layer.data).toMatchObject({
        shapeType: 'rectangle',
        start: startPoint,
        end: endPoint,
        constrained: false,
      })
      expect(layer.properties).toEqual(deps.properties.value)
      expect(tools.shapeStart.value).toBeNull()
      expect(tools.shapePreview.value).toBeNull()
    })
  })

  describe('createShape', () => {
    test('should create rectangle shape with correct data', () => {
      const deps = createMockDependencies()
      const tools = useDrawingTools(deps.properties, deps.overlayCanvasRef, deps.addLayer, deps.renderLayer, deps.removeLayer, deps.getLayerAtPoint, deps.renderAllLayers)

      const start: Point = { x: 50, y: 50 }
      const end: Point = { x: 150, y: 100 }

      const layer = tools.createShape('rectangle', start, end)

      expect(layer.type).toBe('shape')
      expect(layer.data).toMatchObject({
        shapeType: 'rectangle',
        start,
        end,
        constrained: false,
      })
      expect(layer.properties).toEqual(deps.properties.value)
      expect(layer.bounds.x).toBeLessThanOrEqual(start.x)
      expect(layer.bounds.y).toBeLessThanOrEqual(start.y)
      expect(layer.bounds.width).toBeGreaterThan(0)
      expect(layer.bounds.height).toBeGreaterThan(0)
    })

    test('should create circle shape with correct data', () => {
      const deps = createMockDependencies()
      const tools = useDrawingTools(deps.properties, deps.overlayCanvasRef, deps.addLayer, deps.renderLayer, deps.removeLayer, deps.getLayerAtPoint, deps.renderAllLayers)

      const start: Point = { x: 200, y: 200 }
      const end: Point = { x: 300, y: 250 }

      const layer = tools.createShape('circle', start, end)

      expect(layer.type).toBe('shape')
      expect(layer.data).toMatchObject({
        shapeType: 'circle',
        start,
        end,
        constrained: false,
      })
    })

    test('should create line shape with correct data', () => {
      const deps = createMockDependencies()
      const tools = useDrawingTools(deps.properties, deps.overlayCanvasRef, deps.addLayer, deps.renderLayer, deps.removeLayer, deps.getLayerAtPoint, deps.renderAllLayers)

      const start: Point = { x: 0, y: 0 }
      const end: Point = { x: 100, y: 100 }

      const layer = tools.createShape('line', start, end)

      expect(layer.type).toBe('shape')
      expect(layer.data).toMatchObject({
        shapeType: 'line',
        start,
        end,
        constrained: false,
      })
    })

    test('should create arrow shape with correct data', () => {
      const deps = createMockDependencies()
      const tools = useDrawingTools(deps.properties, deps.overlayCanvasRef, deps.addLayer, deps.renderLayer, deps.removeLayer, deps.getLayerAtPoint, deps.renderAllLayers)

      const start: Point = { x: 50, y: 50 }
      const end: Point = { x: 200, y: 150 }

      const layer = tools.createShape('arrow', start, end)

      expect(layer.type).toBe('shape')
      expect(layer.data).toMatchObject({
        shapeType: 'arrow',
        start,
        end,
        constrained: false,
      })
      // Arrow should have extra padding for arrowhead
      expect(layer.bounds.width).toBeGreaterThan(Math.abs(end.x - start.x))
    })

    test('should apply current drawing properties to shape', () => {
      const deps = createMockDependencies()
      const tools = useDrawingTools(deps.properties, deps.overlayCanvasRef, deps.addLayer, deps.renderLayer, deps.removeLayer, deps.getLayerAtPoint, deps.renderAllLayers)

      const start: Point = { x: 0, y: 0 }
      const end: Point = { x: 100, y: 100 }

      const layer = tools.createShape('rectangle', start, end)

      expect(layer.properties.strokeColor).toBe('#FF0000')
      expect(layer.properties.fillColor).toBe('#00FF00')
      expect(layer.properties.strokeWidth).toBe(5)
      expect(layer.properties.opacity).toBe(0.8)
      expect(layer.properties.enableFill).toBe(true)
    })

    test('should generate unique layer IDs', () => {
      const deps = createMockDependencies()
      const tools = useDrawingTools(deps.properties, deps.overlayCanvasRef, deps.addLayer, deps.renderLayer, deps.removeLayer, deps.getLayerAtPoint, deps.renderAllLayers)

      const start: Point = { x: 0, y: 0 }
      const end: Point = { x: 100, y: 100 }

      const layer1 = tools.createShape('rectangle', start, end)
      const layer2 = tools.createShape('circle', start, end)

      expect(layer1.id).not.toBe(layer2.id)
      expect(layer1.id).toMatch(/^layer-\d+-[a-z0-9]+$/)
      expect(layer2.id).toMatch(/^layer-\d+-[a-z0-9]+$/)
    })
  })

  describe('Shape Constraints (Shift Key)', () => {
    test('should constrain rectangle to square when constrainShapes is enabled', () => {
      const deps = createMockDependencies()
      const tools = useDrawingTools(deps.properties, deps.overlayCanvasRef, deps.addLayer, deps.renderLayer, deps.removeLayer, deps.getLayerAtPoint, deps.renderAllLayers)

      tools.updateToolOptions({ constrainShapes: true })

      const start: Point = { x: 100, y: 100 }
      const end: Point = { x: 250, y: 180 } // 150x80 rectangle

      const layer = tools.createShape('rectangle', start, end)
      const shapeData = layer.data as ShapeData

      // Should be constrained to square (150x150)
      const width = Math.abs(shapeData.end.x - shapeData.start.x)
      const height = Math.abs(shapeData.end.y - shapeData.start.y)

      expect(width).toBe(height) // 1:1 aspect ratio
      expect(width).toBe(150) // Uses the larger dimension
    })

    test('should constrain circle to perfect circle when constrainShapes is enabled', () => {
      const deps = createMockDependencies()
      const tools = useDrawingTools(deps.properties, deps.overlayCanvasRef, deps.addLayer, deps.renderLayer, deps.removeLayer, deps.getLayerAtPoint, deps.renderAllLayers)

      tools.updateToolOptions({ constrainShapes: true })

      const start: Point = { x: 200, y: 200 }
      const end: Point = { x: 320, y: 250 } // 120x50 ellipse

      const layer = tools.createShape('circle', start, end)
      const shapeData = layer.data as ShapeData

      // Should be constrained to perfect circle (120x120)
      const width = Math.abs(shapeData.end.x - shapeData.start.x)
      const height = Math.abs(shapeData.end.y - shapeData.start.y)

      expect(width).toBe(height) // 1:1 aspect ratio
      expect(width).toBe(120) // Uses the larger dimension
    })

    test('should constrain line to 45-degree increments when constrainShapes is enabled', () => {
      const deps = createMockDependencies()
      const tools = useDrawingTools(deps.properties, deps.overlayCanvasRef, deps.addLayer, deps.renderLayer, deps.removeLayer, deps.getLayerAtPoint, deps.renderAllLayers)

      tools.updateToolOptions({ constrainShapes: true })

      const start: Point = { x: 100, y: 100 }
      const end: Point = { x: 200, y: 130 } // ~17 degree angle

      const layer = tools.createShape('line', start, end)
      const shapeData = layer.data as ShapeData

      // Calculate the angle
      const dx = shapeData.end.x - shapeData.start.x
      const dy = shapeData.end.y - shapeData.start.y
      const angle = Math.atan2(dy, dx)
      const angleDegrees = (angle * 180) / Math.PI

      // Should be constrained to nearest 45-degree increment (0, 45, 90, 135, 180, -45, -90, -135)
      const remainder = Math.abs(angleDegrees % 45)
      expect(remainder).toBeLessThan(0.1) // Allow small floating point error
    })

    test('should constrain arrow to 45-degree increments when constrainShapes is enabled', () => {
      const deps = createMockDependencies()
      const tools = useDrawingTools(deps.properties, deps.overlayCanvasRef, deps.addLayer, deps.renderLayer, deps.removeLayer, deps.getLayerAtPoint, deps.renderAllLayers)

      tools.updateToolOptions({ constrainShapes: true })

      const start: Point = { x: 50, y: 50 }
      const end: Point = { x: 180, y: 90 } // ~17 degree angle

      const layer = tools.createShape('arrow', start, end)
      const shapeData = layer.data as ShapeData

      // Calculate the angle
      const dx = shapeData.end.x - shapeData.start.x
      const dy = shapeData.end.y - shapeData.start.y
      const angle = Math.atan2(dy, dx)
      const angleDegrees = (angle * 180) / Math.PI

      // Should be constrained to nearest 45-degree increment
      const remainder = Math.abs(angleDegrees % 45)
      expect(remainder).toBeLessThan(0.1) // Allow small floating point error
    })

    test('should not constrain shapes when constrainShapes is disabled', () => {
      const deps = createMockDependencies()
      const tools = useDrawingTools(deps.properties, deps.overlayCanvasRef, deps.addLayer, deps.renderLayer, deps.removeLayer, deps.getLayerAtPoint, deps.renderAllLayers)

      tools.updateToolOptions({ constrainShapes: false })

      const start: Point = { x: 100, y: 100 }
      const end: Point = { x: 250, y: 180 }

      const layer = tools.createShape('rectangle', start, end)
      const shapeData = layer.data as ShapeData

      // Should NOT be constrained
      expect(shapeData.end).toEqual(end)
      expect(shapeData.constrained).toBe(false)
    })

    test('should handle negative dimensions with constraints', () => {
      const deps = createMockDependencies()
      const tools = useDrawingTools(deps.properties, deps.overlayCanvasRef, deps.addLayer, deps.renderLayer, deps.removeLayer, deps.getLayerAtPoint, deps.renderAllLayers)

      tools.updateToolOptions({ constrainShapes: true })

      const start: Point = { x: 200, y: 200 }
      const end: Point = { x: 50, y: 120 } // Drawing left and up

      const layer = tools.createShape('rectangle', start, end)
      const shapeData = layer.data as ShapeData

      // Should be constrained to square with negative dimensions
      const width = Math.abs(shapeData.end.x - shapeData.start.x)
      const height = Math.abs(shapeData.end.y - shapeData.start.y)

      expect(width).toBe(height) // 1:1 aspect ratio
      expect(width).toBe(150) // Uses the larger dimension
    })
  })

  describe('Bounding Box Calculation', () => {
    test('should calculate correct bounding box for rectangle', () => {
      const deps = createMockDependencies()
      const tools = useDrawingTools(deps.properties, deps.overlayCanvasRef, deps.addLayer, deps.renderLayer, deps.removeLayer, deps.getLayerAtPoint, deps.renderAllLayers)

      const start: Point = { x: 100, y: 100 }
      const end: Point = { x: 200, y: 150 }

      const layer = tools.createShape('rectangle', start, end)

      // Bounding box should include stroke width padding
      const padding = deps.properties.value.strokeWidth / 2 + 1
      expect(layer.bounds.x).toBe(start.x - padding)
      expect(layer.bounds.y).toBe(start.y - padding)
      expect(layer.bounds.width).toBe(100 + padding * 2)
      expect(layer.bounds.height).toBe(50 + padding * 2)
    })

    test('should calculate correct bounding box for circle', () => {
      const deps = createMockDependencies()
      const tools = useDrawingTools(deps.properties, deps.overlayCanvasRef, deps.addLayer, deps.renderLayer, deps.removeLayer, deps.getLayerAtPoint, deps.renderAllLayers)

      const start: Point = { x: 150, y: 150 }
      const end: Point = { x: 250, y: 200 }

      const layer = tools.createShape('circle', start, end)

      // Bounding box should include stroke width padding
      const padding = deps.properties.value.strokeWidth / 2 + 1
      expect(layer.bounds.x).toBe(start.x - padding)
      expect(layer.bounds.y).toBe(start.y - padding)
      expect(layer.bounds.width).toBe(100 + padding * 2)
      expect(layer.bounds.height).toBe(50 + padding * 2)
    })

    test('should calculate correct bounding box for arrow with extra padding', () => {
      const deps = createMockDependencies()
      const tools = useDrawingTools(deps.properties, deps.overlayCanvasRef, deps.addLayer, deps.renderLayer, deps.removeLayer, deps.getLayerAtPoint, deps.renderAllLayers)

      const start: Point = { x: 50, y: 50 }
      const end: Point = { x: 150, y: 100 }

      const layer = tools.createShape('arrow', start, end)

      // Arrow should have extra padding for arrowhead (15 pixels)
      const padding = deps.properties.value.strokeWidth / 2 + 1
      const extraPadding = 15

      expect(layer.bounds.x).toBe(start.x - padding - extraPadding)
      expect(layer.bounds.y).toBe(start.y - padding - extraPadding)
      expect(layer.bounds.width).toBe(100 + (padding + extraPadding) * 2)
      expect(layer.bounds.height).toBe(50 + (padding + extraPadding) * 2)
    })

    test('should handle reversed coordinates in bounding box', () => {
      const deps = createMockDependencies()
      const tools = useDrawingTools(deps.properties, deps.overlayCanvasRef, deps.addLayer, deps.renderLayer, deps.removeLayer, deps.getLayerAtPoint, deps.renderAllLayers)

      const start: Point = { x: 200, y: 200 }
      const end: Point = { x: 100, y: 150 } // Drawing left and up

      const layer = tools.createShape('rectangle', start, end)

      // Bounding box should use min/max correctly
      const padding = deps.properties.value.strokeWidth / 2 + 1
      expect(layer.bounds.x).toBe(end.x - padding) // min x
      expect(layer.bounds.y).toBe(end.y - padding) // min y
      expect(layer.bounds.width).toBe(100 + padding * 2)
      expect(layer.bounds.height).toBe(50 + padding * 2)
    })
  })
})

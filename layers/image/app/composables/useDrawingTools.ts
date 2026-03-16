import { ref, type Ref } from 'vue'
import type {
  DrawingTool,
  DrawingLayer,
  Point,
  ToolOptions,
  ShapeData,
  ShapeType,
  StrokeData,
  DrawingProperties,
  BoundingBox,
} from '../types/drawing'

/**
 * Tool state interface
 */
export interface ToolState {
  activeTool: Ref<DrawingTool>
  toolOptions: Ref<ToolOptions>
  currentStroke: Ref<Point[]>
  shapeStart: Ref<Point | null>
  shapePreview: Ref<ShapeData | null>
  hoveredLayer: Ref<DrawingLayer | null>
}

/**
 * Drawing tools composable for tool-specific logic
 *
 * Provides:
 * - Tool selection and deactivation
 * - Tool options management
 * - Current drawing state (stroke, shape preview, hover)
 * - Brush tool logic (handleDrawStart, handleDrawMove, handleDrawEnd)
 * - Stroke creation with point optimization
 *
 * Requirements: 11.1, 11.2, 11.3, 12.2, 1.1, 1.3, 1.4, 10.7
 */
export function useDrawingTools(
  properties: Ref<DrawingProperties>,
  overlayCanvasRef: Ref<HTMLCanvasElement | null>,
  addLayer: (layer: DrawingLayer) => void,
  renderLayer: (ctx: CanvasRenderingContext2D, layer: DrawingLayer) => void,
  removeLayer: (layerId: string) => void,
  getLayerAtPoint: (x: number, y: number) => DrawingLayer | null,
  renderAllLayers: () => void
) {
  // Reactive state
  const activeTool = ref<DrawingTool>('none')
  const toolOptions = ref<ToolOptions>({
    constrainShapes: false,
    smoothStrokes: true,
    eraserHighlight: true,
  })
  const currentStroke = ref<Point[]>([])
  const shapeStart = ref<Point | null>(null)
  const shapePreview = ref<ShapeData | null>(null)
  const hoveredLayer = ref<DrawingLayer | null>(null)

  /**
   * Select a drawing tool
   * Deactivates the previous tool before activating the new one
   * Requirements: 11.1, 11.2, 11.3
   */
  const selectTool = (tool: DrawingTool): void => {
    // Deactivate previous tool by clearing its state
    if (activeTool.value !== 'none') {
      currentStroke.value = []
      shapeStart.value = null
      shapePreview.value = null
      hoveredLayer.value = null
    }

    // Activate new tool
    activeTool.value = tool
  }

  /**
   * Update tool options
   * Supports constrainShapes, smoothStrokes, and eraserHighlight
   * Requirements: 12.2
   */
  const updateToolOptions = (options: Partial<ToolOptions>): void => {
    toolOptions.value = {
      ...toolOptions.value,
      ...options,
    }
  }

  /**
   * Handle draw start for brush, shape, and eraser tools
   * Initializes currentStroke array for brush or shapeStart for shapes
   * For eraser, removes the layer at the clicked point
   * Requirements: 1.1, 2.2, 4.1, 4.2
   */
  const handleDrawStart = (point: Point): void => {
    if (activeTool.value === 'brush') {
      currentStroke.value = [point]
    }
    else if (['rectangle', 'circle', 'line', 'arrow'].includes(activeTool.value)) {
      shapeStart.value = point
      shapePreview.value = null
    }
    else if (activeTool.value === 'eraser') {
      // Find and erase layer at point
      const layer = getLayerAtPoint(point.x, point.y)
      if (layer) {
        eraseLayer(layer.id)
      }
    }
  }

  /**
   * Handle draw move for brush, shape, and eraser tools
   * Appends points to currentStroke for brush and renders overlay
   * Updates shapePreview for shape tools
   * Updates hoveredLayer for eraser tool visual feedback
   * Requirements: 1.1, 1.2, 2.3, 4.3, 14.7
   */
  const handleDrawMove = (point: Point): void => {
    if (activeTool.value === 'brush' && currentStroke.value.length > 0) {
      // Append point to current stroke
      currentStroke.value.push(point)

      // Render overlay with current stroke
      const overlay = overlayCanvasRef.value
      if (overlay) {
        const ctx = overlay.getContext('2d')
        if (ctx) {
          // Clear overlay
          ctx.clearRect(0, 0, overlay.width, overlay.height)

          // Create temporary layer for preview
          const tempLayer: DrawingLayer = {
            id: 'temp',
            type: 'stroke',
            data: {
              points: currentStroke.value,
              smoothed: toolOptions.value.smoothStrokes,
            },
            properties: properties.value,
            timestamp: Date.now(),
            bounds: { x: 0, y: 0, width: 0, height: 0 }, // Temporary bounds
          }

          // Render the temporary stroke
          renderLayer(ctx, tempLayer)
        }
      }
    }
    else if (
      ['rectangle', 'circle', 'line', 'arrow'].includes(activeTool.value)
      && shapeStart.value
    ) {
      // Update shape preview
      shapePreview.value = {
        shapeType: activeTool.value as ShapeType,
        start: shapeStart.value,
        end: point,
        constrained: toolOptions.value.constrainShapes,
      }

      // Render overlay with shape preview
      const overlay = overlayCanvasRef.value
      if (overlay) {
        const ctx = overlay.getContext('2d')
        if (ctx) {
          // Clear overlay
          ctx.clearRect(0, 0, overlay.width, overlay.height)

          // Create temporary layer for preview
          const tempLayer: DrawingLayer = {
            id: 'temp',
            type: 'shape',
            data: shapePreview.value,
            properties: properties.value,
            timestamp: Date.now(),
            bounds: { x: 0, y: 0, width: 0, height: 0 }, // Temporary bounds
          }

          // Render the temporary shape
          renderLayer(ctx, tempLayer)
        }
      }
    }
    else if (activeTool.value === 'eraser') {
      // Update hovered layer for visual feedback
      const layer = getLayerAtPoint(point.x, point.y)
      hoveredLayer.value = layer

      // Render overlay with highlight if eraserHighlight is enabled
      if (toolOptions.value.eraserHighlight && layer) {
        const overlay = overlayCanvasRef.value
        if (overlay) {
          const ctx = overlay.getContext('2d')
          if (ctx) {
            // Clear overlay
            ctx.clearRect(0, 0, overlay.width, overlay.height)

            // Render the hovered layer with highlight effect
            ctx.save()
            ctx.globalAlpha = 0.5
            ctx.strokeStyle = '#ff0000'
            ctx.lineWidth = layer.properties.strokeWidth + 2
            renderLayer(ctx, layer)
            ctx.restore()
          }
        }
      }
      else {
        // Clear overlay if no layer is hovered
        const overlay = overlayCanvasRef.value
        if (overlay) {
          const ctx = overlay.getContext('2d')
          if (ctx) {
            ctx.clearRect(0, 0, overlay.width, overlay.height)
          }
        }
      }
    }
  }

  /**
   * Handle draw end for brush and shape tools
   * Creates DrawingLayer with StrokeData for brush or ShapeData for shapes
   * Requirements: 1.3, 1.4, 2.4, 2.5, 10.7
   */
  const handleDrawEnd = (point: Point): void => {
    if (activeTool.value === 'brush' && currentStroke.value.length > 0) {
      // Add final point
      currentStroke.value.push(point)

      // Create the brush stroke layer
      const layer = createBrushStroke(currentStroke.value)

      // Add layer to drawing state
      addLayer(layer)

      // Render all layers to base canvas
      renderAllLayers()

      // Clear overlay
      const overlay = overlayCanvasRef.value
      if (overlay) {
        const ctx = overlay.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, overlay.width, overlay.height)
        }
      }

      // Reset current stroke
      currentStroke.value = []
    }
    else if (
      ['rectangle', 'circle', 'line', 'arrow'].includes(activeTool.value)
      && shapeStart.value
    ) {
      // Create the shape layer
      const layer = createShape(activeTool.value as ShapeType, shapeStart.value, point)

      // Add layer to drawing state
      addLayer(layer)

      // Render all layers to base canvas
      renderAllLayers()

      // Clear overlay
      const overlay = overlayCanvasRef.value
      if (overlay) {
        const ctx = overlay.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, overlay.width, overlay.height)
        }
      }

      // Reset shape state
      shapeStart.value = null
      shapePreview.value = null
    }
  }

  /**
   * Create a brush stroke layer with point optimization
   * Uses Douglas-Peucker algorithm for point reduction
   * Requirements: 1.3, 1.4, 10.7
   */
  const createBrushStroke = (points: Point[]): DrawingLayer => {
    // Optimize points using Douglas-Peucker algorithm
    const optimizedPoints = optimizeStrokePoints(points, 2)

    // Calculate bounding box
    const bounds = calculateBoundingBox(optimizedPoints, properties.value.strokeWidth)

    // Create stroke data
    const strokeData: StrokeData = {
      points: optimizedPoints,
      smoothed: toolOptions.value.smoothStrokes,
    }

    // Create and return the layer
    return {
      id: generateLayerId(),
      type: 'stroke',
      data: strokeData,
      properties: { ...properties.value },
      timestamp: Date.now(),
      bounds,
    }
  }

  /**
   * Create a shape layer with constraint support
   * Applies Shift key constraints for squares, perfect circles, and 45-degree lines
   * Requirements: 2.1, 2.4, 2.5, 2.9, 2.10
   */
  const createShape = (type: ShapeType, start: Point, end: Point): DrawingLayer => {
    // Apply constraints if enabled
    let constrainedEnd = end
    if (toolOptions.value.constrainShapes) {
      constrainedEnd = applyShapeConstraints(type, start, end)
    }

    // Create shape data
    const shapeData: ShapeData = {
      shapeType: type,
      start,
      end: constrainedEnd,
      constrained: toolOptions.value.constrainShapes,
    }

    // Calculate bounding box
    const bounds = calculateShapeBoundingBox(shapeData, properties.value.strokeWidth)

    // Create and return the layer
    return {
      id: generateLayerId(),
      type: 'shape',
      data: shapeData,
      properties: { ...properties.value },
      timestamp: Date.now(),
      bounds,
    }
  }

  /**
   * Erase a layer by ID
   * Removes the layer from the drawing state
   * Requirements: 4.1, 4.2
   */
  const eraseLayer = (layerId: string): void => {
    removeLayer(layerId)

    // Clear hovered layer if it was the erased layer
    if (hoveredLayer.value?.id === layerId) {
      hoveredLayer.value = null
    }

    // Clear overlay
    const overlay = overlayCanvasRef.value
    if (overlay) {
      const ctx = overlay.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, overlay.width, overlay.height)
      }
    }
  }

  /**
   * Apply Shift key constraints to shapes
   * - Rectangle: constrain to square (1:1 aspect ratio)
   * - Circle: constrain to perfect circle (1:1 aspect ratio)
   * - Line/Arrow: constrain to 45-degree increments
   * Requirements: 2.9, 2.10
   */
  const applyShapeConstraints = (type: ShapeType, start: Point, end: Point): Point => {
    if (type === 'rectangle' || type === 'circle') {
      // Constrain to 1:1 aspect ratio (square or perfect circle)
      const dx = end.x - start.x
      const dy = end.y - start.y
      const size = Math.max(Math.abs(dx), Math.abs(dy))

      return {
        x: start.x + (dx >= 0 ? size : -size),
        y: start.y + (dy >= 0 ? size : -size),
      }
    }
    else if (type === 'line' || type === 'arrow') {
      // Constrain to 45-degree increments
      const dx = end.x - start.x
      const dy = end.y - start.y
      const angle = Math.atan2(dy, dx)

      // Round to nearest 45 degrees (π/4 radians)
      const constrainedAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4)

      // Calculate distance
      const distance = Math.sqrt(dx * dx + dy * dy)

      return {
        x: start.x + distance * Math.cos(constrainedAngle),
        y: start.y + distance * Math.sin(constrainedAngle),
      }
    }

    return end
  }

  /**
   * Calculate bounding box for a shape
   * Includes stroke width for accurate hit detection
   * Requirements: 2.1
   */
  const calculateShapeBoundingBox = (shape: ShapeData, strokeWidth: number): BoundingBox => {
    const minX = Math.min(shape.start.x, shape.end.x)
    const minY = Math.min(shape.start.y, shape.end.y)
    const maxX = Math.max(shape.start.x, shape.end.x)
    const maxY = Math.max(shape.start.y, shape.end.y)

    // Expand bounds by half stroke width on each side
    const padding = strokeWidth / 2 + 1

    // For arrows, add extra padding for the arrowhead
    const extraPadding = shape.shapeType === 'arrow' ? 15 : 0

    return {
      x: minX - padding - extraPadding,
      y: minY - padding - extraPadding,
      width: maxX - minX + (padding + extraPadding) * 2,
      height: maxY - minY + (padding + extraPadding) * 2,
    }
  }

  /**
   * Optimize stroke points using Douglas-Peucker algorithm
   * Reduces point density while maintaining visual quality
   * Requirements: 10.7
   */
  const optimizeStrokePoints = (points: Point[], tolerance: number = 2): Point[] => {
    if (points.length < 3) return points

    const result: Point[] = [points[0]!]

    const simplify = (start: number, end: number): void => {
      let maxDist = 0
      let maxIndex = 0

      for (let i = start + 1; i < end; i++) {
        const dist = perpendicularDistance(points[i]!, points[start]!, points[end]!)
        if (dist > maxDist) {
          maxDist = dist
          maxIndex = i
        }
      }

      if (maxDist > tolerance) {
        simplify(start, maxIndex)
        result.push(points[maxIndex]!)
        simplify(maxIndex, end)
      }
    }

    simplify(0, points.length - 1)
    result.push(points[points.length - 1]!)

    return result
  }

  /**
   * Calculate perpendicular distance from point to line segment
   * Used in Douglas-Peucker algorithm
   * Requirements: 10.7
   */
  const perpendicularDistance = (point: Point, lineStart: Point, lineEnd: Point): number => {
    const dx = lineEnd.x - lineStart.x
    const dy = lineEnd.y - lineStart.y

    if (dx === 0 && dy === 0) {
      // Line segment is a point
      return Math.sqrt(
        (point.x - lineStart.x) ** 2 + (point.y - lineStart.y) ** 2
      )
    }

    const t = Math.max(
      0,
      Math.min(
        1,
        ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (dx * dx + dy * dy)
      )
    )

    const projX = lineStart.x + t * dx
    const projY = lineStart.y + t * dy

    return Math.sqrt((point.x - projX) ** 2 + (point.y - projY) ** 2)
  }

  /**
   * Calculate bounding box for a stroke
   * Includes stroke width for accurate hit detection
   * Requirements: 1.3
   */
  const calculateBoundingBox = (points: Point[], strokeWidth: number): BoundingBox => {
    if (points.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 }
    }

    let minX = points[0]!.x
    let minY = points[0]!.y
    let maxX = points[0]!.x
    let maxY = points[0]!.y

    for (const point of points) {
      minX = Math.min(minX, point.x)
      minY = Math.min(minY, point.y)
      maxX = Math.max(maxX, point.x)
      maxY = Math.max(maxY, point.y)
    }

    // Expand bounds by half stroke width on each side
    const padding = strokeWidth / 2 + 1

    return {
      x: minX - padding,
      y: minY - padding,
      width: maxX - minX + padding * 2,
      height: maxY - minY + padding * 2,
    }
  }

  /**
   * Generate a unique layer ID
   * Requirements: 5.5
   */
  const generateLayerId = (): string => {
    return `layer-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  }

  return {
    // State
    activeTool,
    toolOptions,
    currentStroke,
    shapeStart,
    shapePreview,
    hoveredLayer,

    // Methods
    selectTool,
    updateToolOptions,
    handleDrawStart,
    handleDrawMove,
    handleDrawEnd,
    createBrushStroke,
    createShape,
    eraseLayer,
  }
}

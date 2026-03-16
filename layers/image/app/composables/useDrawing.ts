import { ref, type Ref } from 'vue'
import type {
  DrawingLayer,
  DrawingTool,
  DrawingProperties,
  Point,
  BoundingBox,
  StrokeData,
  ShapeData,
  HistoryAction,
} from '../types/drawing'

/**
 * Drawing state interface
 */
export interface DrawingState {
  layers: Ref<DrawingLayer[]>
  currentTool: Ref<DrawingTool>
  properties: Ref<DrawingProperties>
  isDrawing: Ref<boolean>
  canvasRef: Ref<HTMLCanvasElement | null>
  overlayCanvasRef: Ref<HTMLCanvasElement | null>
  containerSize: Ref<{ width: number, height: number }>
  imageSize: Ref<{ width: number, height: number }>
}

/**
 * Core drawing composable for state management and canvas rendering
 *
 * Provides:
 * - Reactive state for layers, tools, and properties
 * - Canvas initialization and management
 * - Layer management (add, remove, clear)
 * - Hit detection for eraser tool
 * - History integration for undo/redo support
 */
export function useDrawing(recordHistory?: (action: HistoryAction) => void) {
  // Reactive state
  const layers = ref<DrawingLayer[]>([])
  const currentTool = ref<DrawingTool>('none')
  const properties = ref<DrawingProperties>({
    strokeColor: '#000000',
    fillColor: '#000000',
    strokeWidth: 2,
    opacity: 1,
    enableFill: false,
  })
  const isDrawing = ref(false)
  const canvasRef = ref<HTMLCanvasElement | null>(null)
  const overlayCanvasRef = ref<HTMLCanvasElement | null>(null)
  const containerSize = ref({ width: 0, height: 0 })
  const imageSize = ref({ width: 0, height: 0 })

  // Flag to prevent recording history during undo/redo operations
  let isApplyingHistory = false

  /**
   * Initialize canvas contexts
   */
  const initializeCanvas = (
    canvas: HTMLCanvasElement,
    overlay: HTMLCanvasElement
  ): void => {
    canvasRef.value = canvas
    overlayCanvasRef.value = overlay
  }

  /**
   * Set the image size for coordinate calculations
   */
  const setImageSize = (width: number, height: number): void => {
    imageSize.value = { width, height }
  }

  /**
   * Add a new drawing layer
   * Records action in history for undo support (unless applying history)
   */
  const addLayer = (layer: DrawingLayer): void => {
    layers.value.push(layer)

    // Record action in history for undo support (unless we're applying history)
    if (recordHistory && !isApplyingHistory) {
      recordHistory({
        type: 'add',
        layer,
        timestamp: Date.now(),
      })
    }
  }

  /**
   * Remove a layer by ID
   * Records action in history for undo support (unless applying history)
   */
  const removeLayer = (layerId: string): void => {
    const index = layers.value.findIndex(layer => layer.id === layerId)
    if (index !== -1) {
      const layer = layers.value[index]
      layers.value.splice(index, 1)

      // Record action in history for undo support (unless we're applying history)
      if (recordHistory && !isApplyingHistory && layer) {
        recordHistory({
          type: 'remove',
          layer,
          timestamp: Date.now(),
        })
      }
    }
  }

  /**
   * Clear all layers
   * Records action in history for undo support (unless applying history)
   */
  const clearAllLayers = (): void => {
    // Store current layers for undo support
    const currentLayers = [...layers.value]

    layers.value = []

    // Record action in history for undo support (unless we're applying history)
    if (recordHistory && !isApplyingHistory) {
      recordHistory({
        type: 'clear',
        layers: currentLayers,
        timestamp: Date.now(),
      })
    }
  }

  /**
   * Set the flag to indicate we're applying history
   * This prevents double-recording during undo/redo operations
   */
  const setApplyingHistory = (value: boolean): void => {
    isApplyingHistory = value
  }

  /**
   * Get layer at a specific point for hit detection
   * Uses bounding box intersection followed by precise hit testing
   */
  const getLayerAtPoint = (x: number, y: number): DrawingLayer | null => {
    const point = { x, y }

    // Iterate in reverse order (top layer first)
    for (let i = layers.value.length - 1; i >= 0; i--) {
      const layer = layers.value[i]

      if (layer && pointInBoundingBox(point, layer.bounds)) {
        // Perform precise hit test
        if (preciseHitTest(point, layer)) {
          return layer
        }
      }
    }

    return null
  }

  /**
   * Check if a point is within a bounding box
   */
  const pointInBoundingBox = (point: Point, box: BoundingBox): boolean => {
    return (
      point.x >= box.x
      && point.x <= box.x + box.width
      && point.y >= box.y
      && point.y <= box.y + box.height
    )
  }

  /**
   * Perform precise hit test on a layer
   * For strokes: checks distance to line segments
   * For shapes: checks point containment
   */
  const preciseHitTest = (point: Point, layer: DrawingLayer): boolean => {
    if (layer.type === 'stroke') {
      // Check if point is within threshold distance of any stroke segment
      const threshold = layer.properties.strokeWidth / 2 + 5
      const points = (layer.data as StrokeData).points

      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i]
        const p2 = points[i + 1]
        if (p1 && p2) {
          const dist = distanceToLineSegment(point, p1, p2)
          if (dist <= threshold) return true
        }
      }

      return false
    }
    else {
      // Shape hit test
      return shapeContainsPoint(point, layer.data as ShapeData, layer.properties)
    }
  }

  /**
   * Calculate distance from a point to a line segment
   */
  const distanceToLineSegment = (point: Point, lineStart: Point, lineEnd: Point): number => {
    const dx = lineEnd.x - lineStart.x
    const dy = lineEnd.y - lineStart.y
    const lengthSquared = dx * dx + dy * dy

    if (lengthSquared === 0) {
      // Line segment is a point
      return Math.sqrt(
        (point.x - lineStart.x) ** 2 + (point.y - lineStart.y) ** 2
      )
    }

    // Calculate projection parameter t
    const t = Math.max(
      0,
      Math.min(
        1,
        ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lengthSquared
      )
    )

    // Calculate closest point on line segment
    const projX = lineStart.x + t * dx
    const projY = lineStart.y + t * dy

    // Return distance to closest point
    return Math.sqrt((point.x - projX) ** 2 + (point.y - projY) ** 2)
  }

  /**
   * Check if a point is contained within a shape
   */
  const shapeContainsPoint = (
    point: Point,
    shape: ShapeData,
    props: DrawingProperties
  ): boolean => {
    const threshold = props.strokeWidth / 2 + 5

    switch (shape.shapeType) {
      case 'rectangle': {
        // Check if point is inside rectangle or near its edges
        const minX = Math.min(shape.start.x, shape.end.x)
        const maxX = Math.max(shape.start.x, shape.end.x)
        const minY = Math.min(shape.start.y, shape.end.y)
        const maxY = Math.max(shape.start.y, shape.end.y)

        if (props.enableFill) {
          // If filled, check if point is inside
          return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY
        }
        else {
          // If not filled, check distance to edges
          const insideX = point.x >= minX && point.x <= maxX
          const insideY = point.y >= minY && point.y <= maxY

          if (insideX && insideY) {
            // Point is inside bounding box, check distance to edges
            const distToLeft = Math.abs(point.x - minX)
            const distToRight = Math.abs(point.x - maxX)
            const distToTop = Math.abs(point.y - minY)
            const distToBottom = Math.abs(point.y - maxY)

            const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom)
            return minDist <= threshold
          }

          return false
        }
      }

      case 'circle': {
        // Check if point is inside ellipse or near its edge
        const centerX = (shape.start.x + shape.end.x) / 2
        const centerY = (shape.start.y + shape.end.y) / 2
        const radiusX = Math.abs(shape.end.x - shape.start.x) / 2
        const radiusY = Math.abs(shape.end.y - shape.start.y) / 2

        // Normalized distance from center
        const dx = (point.x - centerX) / radiusX
        const dy = (point.y - centerY) / radiusY
        const distanceFromCenter = Math.sqrt(dx * dx + dy * dy)

        if (props.enableFill) {
          // If filled, check if point is inside
          return distanceFromCenter <= 1
        }
        else {
          // If not filled, check if near the edge
          return Math.abs(distanceFromCenter - 1) <= threshold / Math.min(radiusX, radiusY)
        }
      }

      case 'line':
      case 'arrow': {
        // Check distance to line segment
        const dist = distanceToLineSegment(point, shape.start, shape.end)
        return dist <= threshold
      }

      default:
        return false
    }
  }

  /**
   * Render all layers to the base canvas
   * Uses dual-canvas strategy: base canvas for committed layers
   */
  const renderAllLayers = (): void => {
    const canvas = canvasRef.value
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Render all layers in order (oldest to newest)
    for (const layer of layers.value) {
      renderLayer(ctx, layer)
    }
  }

  /**
   * Render a single layer to a canvas context
   * Applies context save/restore and layer properties
   */
  const renderLayer = (ctx: CanvasRenderingContext2D, layer: DrawingLayer): void => {
    ctx.save()

    // Apply layer properties
    ctx.globalAlpha = layer.properties.opacity / 100
    ctx.strokeStyle = layer.properties.strokeColor
    ctx.lineWidth = layer.properties.strokeWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // Render based on layer type
    if (layer.type === 'stroke') {
      renderStroke(ctx, layer.data as StrokeData)
    }
    else {
      renderShape(ctx, layer.data as ShapeData, layer.properties)
    }

    ctx.restore()
  }

  /**
   * Render a stroke with Catmull-Rom spline smoothing
   */
  const renderStroke = (ctx: CanvasRenderingContext2D, data: StrokeData): void => {
    const points = data.smoothed ? smoothStroke(data.points) : data.points

    if (points.length === 0) return

    ctx.beginPath()

    if (points.length === 1) {
      // Single point - draw a circle
      const point = points[0]!
      ctx.arc(point.x, point.y, ctx.lineWidth / 2, 0, 2 * Math.PI)
      ctx.fill()
    }
    else {
      // Multiple points - draw connected lines
      const firstPoint = points[0]!
      ctx.moveTo(firstPoint.x, firstPoint.y)
      for (let i = 1; i < points.length; i++) {
        const point = points[i]!
        ctx.lineTo(point.x, point.y)
      }
      ctx.stroke()
    }
  }

  /**
   * Smooth stroke points using Catmull-Rom spline interpolation
   */
  const smoothStroke = (points: Point[]): Point[] => {
    if (points.length < 3) return points

    const smoothed: Point[] = []

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)]!
      const p1 = points[i]!
      const p2 = points[i + 1]!
      const p3 = points[Math.min(points.length - 1, i + 2)]!

      // Catmull-Rom interpolation with 10 steps between each pair of points
      for (let t = 0; t < 1; t += 0.1) {
        const t2 = t * t
        const t3 = t2 * t

        const x = 0.5 * (
          (2 * p1.x)
          + (-p0.x + p2.x) * t
          + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2
          + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
        )

        const y = 0.5 * (
          (2 * p1.y)
          + (-p0.y + p2.y) * t
          + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2
          + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
        )

        smoothed.push({ x, y })
      }
    }

    // Add the last point
    const lastPoint = points[points.length - 1]
    if (lastPoint) {
      smoothed.push(lastPoint)
    }

    return smoothed
  }

  /**
   * Render a shape with type-specific rendering
   * Supports rectangle, circle, line, and arrow
   */
  const renderShape = (
    ctx: CanvasRenderingContext2D,
    data: ShapeData,
    props: DrawingProperties
  ): void => {
    switch (data.shapeType) {
      case 'rectangle':
        renderRectangle(ctx, data, props)
        break
      case 'circle':
        renderCircle(ctx, data, props)
        break
      case 'line':
        renderLine(ctx, data)
        break
      case 'arrow':
        renderArrow(ctx, data)
        break
    }
  }

  /**
   * Render a rectangle shape
   */
  const renderRectangle = (
    ctx: CanvasRenderingContext2D,
    shape: ShapeData,
    props: DrawingProperties
  ): void => {
    const width = shape.end.x - shape.start.x
    const height = shape.end.y - shape.start.y

    if (props.enableFill) {
      ctx.fillStyle = props.fillColor
      ctx.fillRect(shape.start.x, shape.start.y, width, height)
    }

    ctx.strokeRect(shape.start.x, shape.start.y, width, height)
  }

  /**
   * Render a circle (ellipse) shape
   */
  const renderCircle = (
    ctx: CanvasRenderingContext2D,
    shape: ShapeData,
    props: DrawingProperties
  ): void => {
    const centerX = (shape.start.x + shape.end.x) / 2
    const centerY = (shape.start.y + shape.end.y) / 2
    const radiusX = Math.abs(shape.end.x - shape.start.x) / 2
    const radiusY = Math.abs(shape.end.y - shape.start.y) / 2

    ctx.beginPath()
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI)

    if (props.enableFill) {
      ctx.fillStyle = props.fillColor
      ctx.fill()
    }

    ctx.stroke()
  }

  /**
   * Render a line shape
   */
  const renderLine = (
    ctx: CanvasRenderingContext2D,
    shape: ShapeData
  ): void => {
    ctx.beginPath()
    ctx.moveTo(shape.start.x, shape.start.y)
    ctx.lineTo(shape.end.x, shape.end.y)
    ctx.stroke()
  }

  /**
   * Render an arrow shape with arrowhead
   */
  const renderArrow = (
    ctx: CanvasRenderingContext2D,
    shape: ShapeData
  ): void => {
    const dx = shape.end.x - shape.start.x
    const dy = shape.end.y - shape.start.y
    const angle = Math.atan2(dy, dx)
    const headLength = 15

    // Draw line
    ctx.beginPath()
    ctx.moveTo(shape.start.x, shape.start.y)
    ctx.lineTo(shape.end.x, shape.end.y)
    ctx.stroke()

    // Draw arrowhead
    ctx.beginPath()
    ctx.moveTo(shape.end.x, shape.end.y)
    ctx.lineTo(
      shape.end.x - headLength * Math.cos(angle - Math.PI / 6),
      shape.end.y - headLength * Math.sin(angle - Math.PI / 6)
    )
    ctx.moveTo(shape.end.x, shape.end.y)
    ctx.lineTo(
      shape.end.x - headLength * Math.cos(angle + Math.PI / 6),
      shape.end.y - headLength * Math.sin(angle + Math.PI / 6)
    )
    ctx.stroke()
  }

  /**
   * Render with requestAnimationFrame for 60fps
   */
  let animationFrameId: number | null = null

  const scheduleRender = (): void => {
    if (animationFrameId !== null) return

    animationFrameId = requestAnimationFrame(() => {
      renderAllLayers()
      animationFrameId = null
    })
  }

  return {
    // State
    layers,
    currentTool,
    properties,
    isDrawing,
    canvasRef,
    overlayCanvasRef,
    containerSize,
    imageSize,

    // Methods
    initializeCanvas,
    setImageSize,
    addLayer,
    removeLayer,
    clearAllLayers,
    setApplyingHistory,
    getLayerAtPoint,
    renderAllLayers,
    renderLayer,
    scheduleRender,
  }
}

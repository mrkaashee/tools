/**
 * Drawing Tools Type Definitions
 *
 * Core type definitions for the drawing tools feature.
 * Supports freehand drawing, shapes, layers, history, and transforms.
 */

/**
 * Available drawing tools
 */
export type DrawingTool = 'brush' | 'rectangle' | 'circle' | 'line' | 'arrow' | 'eraser' | 'none'

/**
 * Available shape types
 */
export type ShapeType = 'rectangle' | 'circle' | 'line' | 'arrow'

/**
 * Point in 2D space
 */
export interface Point {
  x: number
  y: number
}

/**
 * Drawing properties for strokes and shapes
 */
export interface DrawingProperties {
  strokeColor: string
  fillColor: string
  strokeWidth: number
  opacity: number
  enableFill: boolean
}

/**
 * Data for freehand brush strokes
 */
export interface StrokeData {
  points: Point[]
  smoothed: boolean
}

/**
 * Data for geometric shapes
 */
export interface ShapeData {
  shapeType: ShapeType
  start: Point
  end: Point
  constrained: boolean
}

/**
 * Bounding box for layer hit detection
 */
export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

/**
 * A single drawing layer (stroke or shape)
 */
export interface DrawingLayer {
  id: string
  type: 'stroke' | 'shape'
  data: StrokeData | ShapeData
  properties: DrawingProperties
  timestamp: number
  bounds: BoundingBox
}

/**
 * History action types
 */
export interface HistoryAction {
  type: 'add' | 'remove' | 'clear'
  layer?: DrawingLayer
  layers?: DrawingLayer[]
  timestamp: number
}

/**
 * History entry with action and inverse
 */
export interface HistoryEntry {
  action: HistoryAction
  inverse: HistoryAction
}

/**
 * Transform matrix for coordinate transformations
 */
export interface TransformMatrix {
  scaleX: number
  scaleY: number
  translateX: number
  translateY: number
  rotation: number
}

/**
 * Tool-specific options
 */
export interface ToolOptions {
  constrainShapes: boolean
  smoothStrokes: boolean
  eraserHighlight: boolean
}

/**
 * Serialized drawing state for save/load functionality
 */
export interface SerializedDrawingState {
  version: string
  layers: DrawingLayer[]
  imageSize: {
    width: number
    height: number
  }
  metadata: {
    created: number
    modified: number
    layerCount: number
  }
}

/**
 * ImgDrawing Component Types
 */
export interface ImgDrawingProps {
  enableBrush?: boolean
  enableShapes?: boolean
  enableEraser?: boolean
  defaultTool?: DrawingTool
  defaultColor?: string
  defaultStrokeWidth?: number
  defaultOpacity?: number
  maxHistorySize?: number
}

export interface ImgDrawingEmits {
  (e: 'tool-change', tool: DrawingTool): void
  (e: 'layer-added' | 'layer-removed', layerId: string): void
  (e: 'properties-change', properties: DrawingProperties): void
}

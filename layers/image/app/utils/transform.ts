/**
 * Transform Utilities for Drawing Layers
 *
 * Provides coordinate transformation functions to keep drawing layers
 * aligned with the image during crop, rotate, flip, and resize operations.
 */

import type { DrawingLayer, Point, BoundingBox, TransformMatrix, StrokeData, ShapeData } from '../types/drawing'

/**
 * Transform all layers with a transformation matrix
 * Applies scale, rotation, and translation to layer coordinates
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */
export function transformLayers(
  layers: DrawingLayer[],
  matrix: TransformMatrix,
): DrawingLayer[] {
  return layers.map(layer => transformLayer(layer, matrix))
}

/**
 * Transform a single layer with a transformation matrix
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */
export function transformLayer(
  layer: DrawingLayer,
  matrix: TransformMatrix,
): DrawingLayer {
  // Transform the layer data based on type
  const transformedData = transformLayerData(layer.data, layer.type, matrix)

  // Transform the bounding box
  const transformedBounds = transformBoundingBox(layer.bounds, matrix)

  return {
    ...layer,
    data: transformedData,
    bounds: transformedBounds,
  }
}

/**
 * Transform layer data (stroke or shape)
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */
export function transformLayerData(
  data: StrokeData | ShapeData,
  type: 'stroke' | 'shape',
  matrix: TransformMatrix,
): StrokeData | ShapeData {
  if (type === 'stroke') {
    const strokeData = data as StrokeData
    return {
      ...strokeData,
      points: strokeData.points.map(point => transformPoint(point, matrix)),
    }
  }
  else {
    const shapeData = data as ShapeData
    return {
      ...shapeData,
      start: transformPoint(shapeData.start, matrix),
      end: transformPoint(shapeData.end, matrix),
    }
  }
}

/**
 * Transform a point with scale, rotation, and translation
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */
export function transformPoint(point: Point, matrix: TransformMatrix): Point {
  const { scaleX, scaleY, rotation, translateX, translateY } = matrix

  // Apply rotation if present
  let x = point.x
  let y = point.y

  if (rotation !== 0) {
    const rad = (rotation * Math.PI) / 180
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)

    // Rotate around origin
    const rotatedX = x * cos - y * sin
    const rotatedY = x * sin + y * cos

    x = rotatedX
    y = rotatedY
  }

  // Apply scale
  x *= scaleX
  y *= scaleY

  // Apply translation
  x += translateX
  y += translateY

  return { x, y }
}

/**
 * Transform a bounding box
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */
export function transformBoundingBox(
  bounds: BoundingBox,
  matrix: TransformMatrix,
): BoundingBox {
  // Transform all four corners of the bounding box
  const topLeft = transformPoint({ x: bounds.x, y: bounds.y }, matrix)
  const topRight = transformPoint({ x: bounds.x + bounds.width, y: bounds.y }, matrix)
  const bottomLeft = transformPoint({ x: bounds.x, y: bounds.y + bounds.height }, matrix)
  const bottomRight = transformPoint(
    { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
    matrix,
  )

  // Find the new bounding box that contains all transformed corners
  const minX = Math.min(topLeft.x, topRight.x, bottomLeft.x, bottomRight.x)
  const minY = Math.min(topLeft.y, topRight.y, bottomLeft.y, bottomRight.y)
  const maxX = Math.max(topLeft.x, topRight.x, bottomLeft.x, bottomRight.x)
  const maxY = Math.max(topLeft.y, topRight.y, bottomLeft.y, bottomRight.y)

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  }
}

/**
 * Create a transformation matrix for crop operation
 * Requirements: 7.1
 */
export function createCropMatrix(
  cropX: number,
  cropY: number,
  _cropWidth: number,
  _cropHeight: number,
  _originalWidth: number,
  _originalHeight: number,
): TransformMatrix {
  return {
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    translateX: -cropX,
    translateY: -cropY,
  }
}

/**
 * Create a transformation matrix for rotation operation
 * Requirements: 7.2
 */
export function createRotationMatrix(
  angle: number,
  centerX: number,
  centerY: number,
): TransformMatrix {
  return {
    scaleX: 1,
    scaleY: 1,
    rotation: angle,
    translateX: centerX,
    translateY: centerY,
  }
}

/**
 * Create a transformation matrix for flip operation
 * Requirements: 7.3
 */
export function createFlipMatrix(
  horizontal: boolean,
  vertical: boolean,
  width: number,
  height: number,
): TransformMatrix {
  return {
    scaleX: horizontal ? -1 : 1,
    scaleY: vertical ? -1 : 1,
    rotation: 0,
    translateX: horizontal ? width : 0,
    translateY: vertical ? height : 0,
  }
}

/**
 * Create a transformation matrix for resize operation
 * Requirements: 7.4
 */
export function createResizeMatrix(
  originalWidth: number,
  originalHeight: number,
  newWidth: number,
  newHeight: number,
): TransformMatrix {
  return {
    scaleX: newWidth / originalWidth,
    scaleY: newHeight / originalHeight,
    rotation: 0,
    translateX: 0,
    translateY: 0,
  }
}

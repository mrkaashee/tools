/**
 * Drawing Properties Validation Utilities
 *
 * Provides validation and clamping functions for drawing properties
 * to ensure values stay within valid ranges.
 */

import type { DrawingProperties, DrawingLayer, StrokeData, ShapeData } from '../types/drawing'

/**
 * Validates and clamps stroke width to the range [1, 50]
 *
 * @param width - The stroke width value to validate
 * @returns The clamped stroke width value
 */
export function validateStrokeWidth(width: number): number {
  if (typeof width !== 'number' || isNaN(width)) {
    return 1 // Default to minimum valid value
  }
  return Math.max(1, Math.min(50, width))
}

/**
 * Validates and clamps opacity to the range [0, 100]
 *
 * @param opacity - The opacity value to validate (0-100 scale)
 * @returns The clamped opacity value
 */
export function validateOpacity(opacity: number): number {
  if (typeof opacity !== 'number' || isNaN(opacity)) {
    return 100 // Default to fully opaque
  }
  return Math.max(0, Math.min(100, opacity))
}

/**
 * Validates and normalizes drawing properties
 *
 * @param properties - The drawing properties to validate
 * @returns Validated drawing properties with clamped values
 */
export function validateDrawingProperties(properties: Partial<DrawingProperties>): DrawingProperties {
  return {
    strokeColor: typeof properties.strokeColor === 'string' ? properties.strokeColor : '#000000',
    fillColor: typeof properties.fillColor === 'string' ? properties.fillColor : '#000000',
    strokeWidth: validateStrokeWidth(properties.strokeWidth ?? 2),
    opacity: validateOpacity(properties.opacity ?? 100),
    enableFill: typeof properties.enableFill === 'boolean' ? properties.enableFill : false,
  }
}

/**
 * Validates layer data integrity
 *
 * @param layer - The drawing layer to validate
 * @returns True if the layer is valid, false otherwise
 */
export function validateLayer(layer: DrawingLayer): boolean {
  // Check basic structure
  if (!layer || typeof layer !== 'object') {
    return false
  }

  // Validate required fields
  if (typeof layer.id !== 'string' || !layer.id) {
    return false
  }

  if (layer.type !== 'stroke' && layer.type !== 'shape') {
    return false
  }

  if (!layer.data || typeof layer.data !== 'object') {
    return false
  }

  if (!layer.properties || typeof layer.properties !== 'object') {
    return false
  }

  if (typeof layer.timestamp !== 'number' || isNaN(layer.timestamp)) {
    return false
  }

  if (!layer.bounds || typeof layer.bounds !== 'object') {
    return false
  }

  // Validate bounds
  const { bounds } = layer
  if (
    typeof bounds.x !== 'number'
    || typeof bounds.y !== 'number'
    || typeof bounds.width !== 'number'
    || typeof bounds.height !== 'number'
    || isNaN(bounds.x)
    || isNaN(bounds.y)
    || isNaN(bounds.width)
    || isNaN(bounds.height)
  ) {
    return false
  }

  // Validate properties
  const { properties } = layer
  if (
    typeof properties.strokeColor !== 'string'
    || typeof properties.fillColor !== 'string'
    || typeof properties.strokeWidth !== 'number'
    || typeof properties.opacity !== 'number'
    || typeof properties.enableFill !== 'boolean'
    || isNaN(properties.strokeWidth)
    || isNaN(properties.opacity)
  ) {
    return false
  }

  // Validate type-specific data
  if (layer.type === 'stroke') {
    const strokeData = layer.data as StrokeData
    if (!Array.isArray(strokeData.points) || strokeData.points.length === 0) {
      return false
    }

    // Validate all points
    for (const point of strokeData.points) {
      if (
        !point
        || typeof point.x !== 'number'
        || typeof point.y !== 'number'
        || isNaN(point.x)
        || isNaN(point.y)
      ) {
        return false
      }
    }

    if (typeof strokeData.smoothed !== 'boolean') {
      return false
    }
  }
  else if (layer.type === 'shape') {
    const shapeData = layer.data as ShapeData
    if (
      shapeData.shapeType !== 'rectangle'
      && shapeData.shapeType !== 'circle'
      && shapeData.shapeType !== 'line'
      && shapeData.shapeType !== 'arrow'
    ) {
      return false
    }

    // Validate start and end points
    if (
      !shapeData.start
      || !shapeData.end
      || typeof shapeData.start.x !== 'number'
      || typeof shapeData.start.y !== 'number'
      || typeof shapeData.end.x !== 'number'
      || typeof shapeData.end.y !== 'number'
      || isNaN(shapeData.start.x)
      || isNaN(shapeData.start.y)
      || isNaN(shapeData.end.x)
      || isNaN(shapeData.end.y)
    ) {
      return false
    }

    if (typeof shapeData.constrained !== 'boolean') {
      return false
    }
  }

  return true
}

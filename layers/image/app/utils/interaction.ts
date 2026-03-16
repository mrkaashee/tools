import type { CropArea as Rect } from '../types/cropper'

/**
 * Utility to get normalized point from mouse or touch event
 */
export const getEventPoint = (e: MouseEvent | TouchEvent) => {
  return 'touches' in e ? e.touches[0] : e
}

export type { Rect }

export interface ResizeOptions {
  aspectRatio?: number
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
  bounds?: { width: number, height: number }
}

/**
 * Common logic for moving a rectangle within bounds
 */
export const calculateMove = (
  initialRect: Rect,
  dx: number,
  dy: number,
  bounds?: { width: number, height: number }
): Rect => {
  let nx = initialRect.x + dx
  let ny = initialRect.y + dy

  if (bounds) {
    nx = Math.max(0, Math.min(nx, bounds.width - initialRect.width))
    ny = Math.max(0, Math.min(ny, bounds.height - initialRect.height))
  }

  return { ...initialRect, x: nx, y: ny }
}

/**
 * Common logic for resizing a rectangle
 */
export const calculateResize = (
  initialRect: Rect,
  dx: number,
  dy: number,
  handle: string,
  options: ResizeOptions = {}
): Rect => {
  const { aspectRatio, minWidth = 10, minHeight = 10, bounds } = options
  let { x, y, width, height } = { ...initialRect }

  // 1. Raw resize based on handle
  if (handle.includes('r')) width = initialRect.width + dx
  if (handle.includes('b')) height = initialRect.height + dy
  if (handle.includes('l')) {
    const d = Math.min(dx, initialRect.width - minWidth)
    x = initialRect.x + d
    width = initialRect.width - d
  }
  if (handle.includes('t')) {
    const d = Math.min(dy, initialRect.height - minHeight)
    y = initialRect.y + d
    height = initialRect.height - d
  }

  // 2. Apply minimums
  width = Math.max(minWidth, width)
  height = Math.max(minHeight, height)

  // 3. Aspect Ratio constraint
  if (aspectRatio) {
    if (handle === 'l' || handle === 'r') {
      height = width / aspectRatio
    }
    else if (handle === 't' || handle === 'b') {
      width = height * aspectRatio
    }
    else {
      // Corner resize - maintain aspect ratio while favoring the larger change
      const useW = Math.abs(dx) > Math.abs(dy)
      if (useW) height = width / aspectRatio
      else width = height * aspectRatio
    }

    // Adjust position for symmetrical scaling when using top/left handles
    if (handle.includes('l')) x = initialRect.x + (initialRect.width - width)
    if (handle.includes('t')) y = initialRect.y + (initialRect.height - height)
  }

  // 4. Bounds check
  if (bounds) {
    if (x < 0) {
      const diff = -x
      x = 0
      width = aspectRatio ? width : width - diff
    }
    if (y < 0) {
      const diff = -y
      y = 0
      height = aspectRatio ? height : height - diff
    }
    if (x + width > bounds.width) {
      width = bounds.width - x
      if (aspectRatio) height = width / aspectRatio
    }
    if (y + height > bounds.height) {
      height = bounds.height - y
      if (aspectRatio) width = height * aspectRatio
    }
  }

  return { x, y, width: Math.max(minWidth, width), height: Math.max(minHeight, height) }
}

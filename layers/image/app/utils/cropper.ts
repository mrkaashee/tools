import type { TransformState } from '../types/editor'

/**
 * Maps pointer angle (relative to stencil center) → CSS resize cursor.
 * We modulo 180 because resize cursors are symmetric.
 */
export function cursorForAngle(angleDeg: number): string {
  const n = ((angleDeg % 180) + 180) % 180
  if (n < 22.5 || n >= 157.5) return 'ew-resize'
  if (n < 67.5) return 'nwse-resize'
  if (n < 112.5) return 'ns-resize'
  return 'nesw-resize'
}

/**
 * Calculate angle from center to pointer position
 */
export function calculateAngle(
  pointerX: number,
  pointerY: number,
  centerX: number,
  centerY: number
): number {
  return Math.atan2(pointerY - centerY, pointerX - centerX) * (180 / Math.PI)
}

/**
 * Export cropped image to canvas
 */
export function cropToCanvas(
  image: HTMLImageElement,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  opts: { width?: number, height?: number, isCircle?: boolean, transforms?: TransformState } = {}
): HTMLCanvasElement | null {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  // Calculate canvas dimensions accounting for rotation
  const transforms = opts.transforms
  const outputWidth = opts.width ?? sw
  const outputHeight = opts.height ?? sh

  // For 90 and 270 degree rotations, swap width and height
  const needsDimensionSwap = transforms && (transforms.rotation === 90 || transforms.rotation === 270)

  if (needsDimensionSwap) {
    canvas.width = outputHeight
    canvas.height = outputWidth
  }
  else {
    canvas.width = outputWidth
    canvas.height = outputHeight
  }

  // Apply transformations if provided
  if (transforms && (transforms.rotation !== 0 || transforms.flipHorizontal || transforms.flipVertical)) {
    // Save the current context state
    ctx.save()

    // Translate to center
    ctx.translate(canvas.width / 2, canvas.height / 2)

    // Apply rotation
    if (transforms.rotation !== 0) {
      ctx.rotate((transforms.rotation * Math.PI) / 180)
    }

    // Apply horizontal flip (scaleX) and vertical flip (scaleY)
    const scaleX = transforms.flipHorizontal ? -1 : 1
    const scaleY = transforms.flipVertical ? -1 : 1

    if (scaleX !== 1 || scaleY !== 1) {
      ctx.scale(scaleX, scaleY)
    }

    // Translate back - use the original output dimensions for proper positioning
    ctx.translate(-outputWidth / 2, -outputHeight / 2)

    // For circle shape, apply circular clipping
    if (opts.isCircle) {
      ctx.beginPath()
      ctx.arc(outputWidth / 2, outputHeight / 2, outputWidth / 2, 0, Math.PI * 2)
      ctx.closePath()
      ctx.clip()
    }

    // Draw image with transformations applied
    ctx.drawImage(image, sx, sy, sw, sh, 0, 0, outputWidth, outputHeight)

    // Restore context state
    ctx.restore()
  }
  else {
    // No transformations - simple draw
    // For circle shape, apply circular clipping
    if (opts.isCircle) {
      ctx.beginPath()
      ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, Math.PI * 2)
      ctx.closePath()
      ctx.clip()
    }

    ctx.drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)
  }

  return canvas
}

/**
 * Convert canvas to data URL
 */
export function canvasToDataURL(
  canvas: HTMLCanvasElement,
  format: 'image/png' | 'image/jpeg' | 'image/webp' = 'image/png',
  quality = 0.92
): string {
  return canvas.toDataURL(format, quality)
}

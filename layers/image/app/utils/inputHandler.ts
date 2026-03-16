/**
 * Input Handler Utilities
 *
 * Normalizes mouse, touch, and pointer events into a unified coordinate system
 * for the drawing tools. Handles coordinate conversion from client space to
 * canvas space with proper scaling.
 */

import type { Point } from '../types/drawing'

/**
 * Normalizes mouse or touch events into canvas coordinates
 *
 * Converts client coordinates (relative to viewport) to canvas coordinates
 * (relative to canvas element) with proper scaling to account for canvas
 * resolution vs display size.
 *
 * @param event - Mouse or touch event to normalize
 * @param canvas - Target canvas element
 * @returns Point in canvas coordinate space
 *
 * @example
 * ```typescript
 * const handleMouseDown = (event: MouseEvent) => {
 *   const point = normalizeInputEvent(event, canvasRef.value)
 *   startDrawing(point)
 * }
 * ```
 */
export function normalizeInputEvent(
  event: MouseEvent | TouchEvent,
  canvas: HTMLCanvasElement
): Point {
  const rect = canvas.getBoundingClientRect()

  let clientX: number
  let clientY: number

  // Extract client coordinates based on event type
  if (event instanceof MouseEvent) {
    clientX = event.clientX
    clientY = event.clientY
  }
  else {
    // For touch events, use the first touch point
    // Use changedTouches for touchend events where touches array is empty
    const touch = event.touches[0] || event.changedTouches[0]
    clientX = touch.clientX
    clientY = touch.clientY
  }

  // Calculate scaling factors
  // Canvas may have different internal resolution than display size
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height

  // Convert to canvas coordinates
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  }
}

/**
 * Normalizes pointer events into canvas coordinates
 *
 * Pointer events provide a unified interface for mouse, touch, and pen input.
 * This function is preferred when pointer events are available as it handles
 * all input types consistently.
 *
 * @param event - Pointer event to normalize
 * @param canvas - Target canvas element
 * @returns Point in canvas coordinate space
 *
 * @example
 * ```typescript
 * const handlePointerDown = (event: PointerEvent) => {
 *   const point = normalizePointerEvent(event, canvasRef.value)
 *   startDrawing(point)
 * }
 * ```
 */
export function normalizePointerEvent(
  event: PointerEvent,
  canvas: HTMLCanvasElement
): Point {
  const rect = canvas.getBoundingClientRect()

  // Calculate scaling factors
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height

  // Convert to canvas coordinates
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  }
}

/**
 * Prevents default browser gestures during drawing operations
 *
 * When drawing with touch input, we need to prevent default browser behaviors
 * like scrolling, zooming, and context menus. This function should be called
 * on touch events during active drawing.
 *
 * @param event - Touch event to prevent defaults on
 *
 * @example
 * ```typescript
 * const handleTouchMove = (event: TouchEvent) => {
 *   if (isDrawing) {
 *     preventTouchDefaults(event)
 *     const point = normalizeInputEvent(event, canvasRef.value)
 *     continueDrawing(point)
 *   }
 * }
 * ```
 */
export function preventTouchDefaults(event: TouchEvent): void {
  // Prevent scrolling, zooming, and other default touch behaviors
  event.preventDefault()

  // Also stop propagation to prevent parent handlers from interfering
  event.stopPropagation()
}

/**
 * Checks if pointer events are supported by the browser
 *
 * Pointer events provide a unified interface for all input types but may not
 * be available in older browsers. Use this to determine whether to use pointer
 * events or fall back to mouse/touch events.
 *
 * @returns true if pointer events are supported
 *
 * @example
 * ```typescript
 * if (supportsPointerEvents()) {
 *   canvas.addEventListener('pointerdown', handlePointerDown)
 * } else {
 *   canvas.addEventListener('mousedown', handleMouseDown)
 *   canvas.addEventListener('touchstart', handleTouchStart)
 * }
 * ```
 */
export function supportsPointerEvents(): boolean {
  return typeof window !== 'undefined' && 'PointerEvent' in window
}

/**
 * Checks if touch events are supported by the browser
 *
 * @returns true if touch events are supported
 *
 * @example
 * ```typescript
 * if (supportsTouchEvents()) {
 *   canvas.addEventListener('touchstart', handleTouchStart)
 * }
 * ```
 */
export function supportsTouchEvents(): boolean {
  return typeof window !== 'undefined' && 'ontouchstart' in window
}

/**
 * Gets the input type from an event
 *
 * Useful for analytics or conditional logic based on input method.
 *
 * @param event - Input event to check
 * @returns 'mouse', 'touch', or 'pen'
 *
 * @example
 * ```typescript
 * const inputType = getInputType(event)
 * if (inputType === 'pen') {
 *   // Enable pressure sensitivity
 * }
 * ```
 */
export function getInputType(
  event: MouseEvent | TouchEvent | PointerEvent
): 'mouse' | 'touch' | 'pen' {
  if (event instanceof PointerEvent) {
    if (event.pointerType === 'pen')
      return 'pen'
    if (event.pointerType === 'touch')
      return 'touch'
    return 'mouse'
  }

  if (event instanceof TouchEvent) {
    return 'touch'
  }

  return 'mouse'
}

/**
 * Extracts pressure information from pointer events
 *
 * Useful for implementing pressure-sensitive drawing with stylus input.
 * Returns 0.5 as default pressure for non-pressure-sensitive input.
 *
 * @param event - Input event to extract pressure from
 * @returns Pressure value between 0 and 1
 *
 * @example
 * ```typescript
 * const pressure = getPressure(event)
 * const strokeWidth = baseWidth * pressure
 * ```
 */
export function getPressure(
  event: MouseEvent | TouchEvent | PointerEvent
): number {
  if (event instanceof PointerEvent && event.pressure !== undefined && event.pressure > 0) {
    return event.pressure
  }

  // Default pressure for non-pressure-sensitive input
  return 0.5
}

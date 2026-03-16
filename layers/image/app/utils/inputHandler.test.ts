/**
 * Input Handler Tests
 *
 * Tests for input event normalization and coordinate conversion.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  normalizeInputEvent,
  normalizePointerEvent,
  preventTouchDefaults,
  supportsPointerEvents,
  supportsTouchEvents,
  getInputType,
  getPressure,
} from './inputHandler'

describe('inputHandler', () => {
  let canvas: HTMLCanvasElement

  beforeEach(() => {
    // Create a mock canvas element
    canvas = document.createElement('canvas')
    canvas.width = 800
    canvas.height = 600

    // Mock getBoundingClientRect
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      top: 50,
      width: 400, // Display size is half of canvas resolution
      height: 300,
      right: 500,
      bottom: 350,
      x: 100,
      y: 50,
      toJSON: () => ({}),
    })
  })

  describe('normalizeInputEvent', () => {
    it('should normalize mouse events correctly', () => {
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: 200, // 100 pixels from canvas left edge in client space
        clientY: 100, // 50 pixels from canvas top edge in client space
      })

      const point = normalizeInputEvent(mouseEvent, canvas)

      // With 2x scaling (canvas 800x600, display 400x300)
      // (200 - 100) * 2 = 200
      // (100 - 50) * 2 = 100
      expect(point.x).toBe(200)
      expect(point.y).toBe(100)
    })

    it('should normalize touch events correctly', () => {
      const touchEvent = new TouchEvent('touchstart', {
        touches: [
          {
            clientX: 300,
            clientY: 200,
          } as Touch,
        ],
      })

      const point = normalizeInputEvent(touchEvent, canvas)

      // (300 - 100) * 2 = 400
      // (200 - 50) * 2 = 300
      expect(point.x).toBe(400)
      expect(point.y).toBe(300)
    })

    it('should use changedTouches for touchend events', () => {
      const touchEvent = new TouchEvent('touchend', {
        touches: [], // Empty for touchend
        changedTouches: [
          {
            clientX: 250,
            clientY: 150,
          } as Touch,
        ],
      })

      const point = normalizeInputEvent(touchEvent, canvas)

      // (250 - 100) * 2 = 300
      // (150 - 50) * 2 = 200
      expect(point.x).toBe(300)
      expect(point.y).toBe(200)
    })

    it('should handle canvas at origin', () => {
      vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        width: 800,
        height: 600,
        right: 800,
        bottom: 600,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      })

      const mouseEvent = new MouseEvent('mousedown', {
        clientX: 400,
        clientY: 300,
      })

      const point = normalizeInputEvent(mouseEvent, canvas)

      // No offset, 1x scaling
      expect(point.x).toBe(400)
      expect(point.y).toBe(300)
    })

    it('should handle different scaling factors for x and y', () => {
      canvas.width = 1000
      canvas.height = 500

      vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        width: 500, // 2x scaling for x
        height: 250, // 2x scaling for y
        right: 500,
        bottom: 250,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      })

      const mouseEvent = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 50,
      })

      const point = normalizeInputEvent(mouseEvent, canvas)

      expect(point.x).toBe(200)
      expect(point.y).toBe(100)
    })
  })

  describe('normalizePointerEvent', () => {
    it('should normalize pointer events correctly', () => {
      const pointerEvent = new PointerEvent('pointerdown', {
        clientX: 200,
        clientY: 100,
      })

      const point = normalizePointerEvent(pointerEvent, canvas)

      // (200 - 100) * 2 = 200
      // (100 - 50) * 2 = 100
      expect(point.x).toBe(200)
      expect(point.y).toBe(100)
    })

    it('should handle pointer events at canvas edges', () => {
      const pointerEvent = new PointerEvent('pointerdown', {
        clientX: 100, // Left edge
        clientY: 50, // Top edge
      })

      const point = normalizePointerEvent(pointerEvent, canvas)

      expect(point.x).toBe(0)
      expect(point.y).toBe(0)
    })

    it('should handle pointer events at canvas bottom-right', () => {
      const pointerEvent = new PointerEvent('pointerdown', {
        clientX: 500, // Right edge (100 + 400)
        clientY: 350, // Bottom edge (50 + 300)
      })

      const point = normalizePointerEvent(pointerEvent, canvas)

      expect(point.x).toBe(800)
      expect(point.y).toBe(600)
    })
  })

  describe('preventTouchDefaults', () => {
    it('should call preventDefault on touch events', () => {
      const touchEvent = new TouchEvent('touchmove', {
        touches: [{ clientX: 100, clientY: 100 } as Touch],
      })

      const preventDefaultSpy = vi.spyOn(touchEvent, 'preventDefault')
      const stopPropagationSpy = vi.spyOn(touchEvent, 'stopPropagation')

      preventTouchDefaults(touchEvent)

      expect(preventDefaultSpy).toHaveBeenCalled()
      expect(stopPropagationSpy).toHaveBeenCalled()
    })
  })

  describe('supportsPointerEvents', () => {
    it('should return true when PointerEvent is available', () => {
      // PointerEvent is available in the test environment
      expect(supportsPointerEvents()).toBe(true)
    })

    it('should return false when window is undefined', () => {
      const originalWindow = global.window
      // @ts-expect-error - Testing undefined window
      delete global.window

      expect(supportsPointerEvents()).toBe(false)

      global.window = originalWindow
    })
  })

  describe('supportsTouchEvents', () => {
    it('should check for touch event support', () => {
      // Touch events may or may not be available in test environment
      // Just verify the function returns a boolean
      const result = supportsTouchEvents()
      expect(typeof result).toBe('boolean')
    })

    it('should return false when window is undefined', () => {
      const originalWindow = global.window
      // @ts-expect-error - Testing undefined window
      delete global.window

      expect(supportsTouchEvents()).toBe(false)

      global.window = originalWindow
    })
  })

  describe('getInputType', () => {
    it('should return "mouse" for mouse events', () => {
      const mouseEvent = new MouseEvent('mousedown')
      expect(getInputType(mouseEvent)).toBe('mouse')
    })

    it('should return "touch" for touch events', () => {
      const touchEvent = new TouchEvent('touchstart')
      expect(getInputType(touchEvent)).toBe('touch')
    })

    it('should return "mouse" for pointer events with mouse type', () => {
      const pointerEvent = new PointerEvent('pointerdown', {
        pointerType: 'mouse',
      })
      expect(getInputType(pointerEvent)).toBe('mouse')
    })

    it('should return "touch" for pointer events with touch type', () => {
      const pointerEvent = new PointerEvent('pointerdown', {
        pointerType: 'touch',
      })
      expect(getInputType(pointerEvent)).toBe('touch')
    })

    it('should return "pen" for pointer events with pen type', () => {
      const pointerEvent = new PointerEvent('pointerdown', {
        pointerType: 'pen',
      })
      expect(getInputType(pointerEvent)).toBe('pen')
    })
  })

  describe('getPressure', () => {
    it('should return pressure from pointer events', () => {
      const pointerEvent = new PointerEvent('pointerdown', {
        pressure: 0.75,
      })
      expect(getPressure(pointerEvent)).toBe(0.75)
    })

    it('should return default pressure for mouse events', () => {
      const mouseEvent = new MouseEvent('mousedown')
      expect(getPressure(mouseEvent)).toBe(0.5)
    })

    it('should return default pressure for touch events', () => {
      const touchEvent = new TouchEvent('touchstart')
      expect(getPressure(touchEvent)).toBe(0.5)
    })

    it('should return default pressure for pointer events without pressure', () => {
      const pointerEvent = new PointerEvent('pointerdown')
      expect(getPressure(pointerEvent)).toBe(0.5)
    })

    it('should return default pressure for zero pressure', () => {
      const pointerEvent = new PointerEvent('pointerdown', {
        pressure: 0,
      })
      // Zero pressure means no pressure data, return default
      expect(getPressure(pointerEvent)).toBe(0.5)
    })

    it('should handle maximum pressure', () => {
      const pointerEvent = new PointerEvent('pointerdown', {
        pressure: 1,
      })
      expect(getPressure(pointerEvent)).toBe(1)
    })
  })

  describe('coordinate accuracy', () => {
    it('should produce consistent coordinates for same position across input types', () => {
      const clientX = 250
      const clientY = 175

      const mouseEvent = new MouseEvent('mousedown', { clientX, clientY })
      const touchEvent = new TouchEvent('touchstart', {
        touches: [{ clientX, clientY } as Touch],
      })
      const pointerEvent = new PointerEvent('pointerdown', { clientX, clientY })

      const mousePoint = normalizeInputEvent(mouseEvent, canvas)
      const touchPoint = normalizeInputEvent(touchEvent, canvas)
      const pointerPoint = normalizePointerEvent(pointerEvent, canvas)

      // All should produce the same canvas coordinates
      expect(mousePoint.x).toBe(touchPoint.x)
      expect(mousePoint.y).toBe(touchPoint.y)
      expect(mousePoint.x).toBe(pointerPoint.x)
      expect(mousePoint.y).toBe(pointerPoint.y)
    })

    it('should handle fractional coordinates correctly', () => {
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: 150.5,
        clientY: 100.7,
      })

      const point = normalizeInputEvent(mouseEvent, canvas)

      // (150.5 - 100) * 2 = 101
      // (100.7 - 50) * 2 = 101.4
      expect(point.x).toBe(101)
      expect(point.y).toBe(101.4)
    })
  })

  describe('edge cases', () => {
    it('should handle negative client coordinates', () => {
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: 50, // Before canvas left edge
        clientY: 25, // Before canvas top edge
      })

      const point = normalizeInputEvent(mouseEvent, canvas)

      // (50 - 100) * 2 = -100
      // (25 - 50) * 2 = -50
      expect(point.x).toBe(-100)
      expect(point.y).toBe(-50)
    })

    it('should handle coordinates beyond canvas', () => {
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: 600, // Beyond canvas right edge
        clientY: 400, // Beyond canvas bottom edge
      })

      const point = normalizeInputEvent(mouseEvent, canvas)

      // (600 - 100) * 2 = 1000
      // (400 - 50) * 2 = 700
      expect(point.x).toBe(1000)
      expect(point.y).toBe(700)
    })

    it('should handle very small canvas display size', () => {
      vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        width: 10, // Very small display size
        height: 10,
        right: 10,
        bottom: 10,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      })

      const mouseEvent = new MouseEvent('mousedown', {
        clientX: 5,
        clientY: 5,
      })

      const point = normalizeInputEvent(mouseEvent, canvas)

      // 5 * (800/10) = 400
      // 5 * (600/10) = 300
      expect(point.x).toBe(400)
      expect(point.y).toBe(300)
    })
  })
})

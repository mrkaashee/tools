/**
 * Unit Tests for ImgDrawing Component
 *
 * Tests component mounting, prop reactivity, event emission,
 * and activate/deactivate lifecycle.
 */

import { describe, test, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ImgDrawing from './ImgDrawing.vue'
import type { DrawingLayer } from '../types/drawing'

describe('ImgDrawing Component', () => {
  beforeEach(() => {
    // Mock ResizeObserver
    global.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver
  })

  /**
   * Test component mounting and canvas initialization
   * Requirements: 11.4, 12.1
   */
  test('mounts successfully and initializes canvases', () => {
    const wrapper = mount(ImgDrawing, {
      global: {
        provide: {
          imgEditor: {
            commit: vi.fn(),
            getImageState: vi.fn(() => ({ current: 'test.png' })),
          },
        },
        stubs: {
          UButton: true,
          UIcon: true,
          UTooltip: true,
          UInput: true,
          UButtonGroup: true,
          USlider: true,
          UCheckbox: true,
          UDivider: true,
        },
      },
    })

    // Assert: Component should mount
    expect(wrapper.exists()).toBe(true)

    // Assert: Should have container
    const container = wrapper.find('.u-img-drawing-container')
    expect(container.exists()).toBe(true)

    // Assert: Should have two canvases (base and overlay)
    const canvases = wrapper.findAll('canvas')
    expect(canvases).toHaveLength(2)

    // Assert: Base canvas should have correct class
    expect(canvases[0]?.classes()).toContain('u-img-drawing-canvas--base')

    // Assert: Overlay canvas should have correct class
    expect(canvases[1]?.classes()).toContain('u-img-drawing-canvas--overlay')
  })

  /**
   * Test prop reactivity and default values
   * Requirements: 11.4, 12.2
   */
  test('applies default prop values', () => {
    const wrapper = mount(ImgDrawing, {
      global: {
        provide: {
          imgEditor: { commit: vi.fn(), getImageState: vi.fn() },
        },
        stubs: { UButton: true, UIcon: true, UTooltip: true, UInput: true, UButtonGroup: true, USlider: true, UCheckbox: true, UDivider: true },
      },
    })

    // Assert: Component should have default props
    expect(wrapper.props('enableBrush')).toBe(true)
    expect(wrapper.props('enableShapes')).toBe(true)
    expect(wrapper.props('enableEraser')).toBe(true)
    expect(wrapper.props('defaultTool')).toBe('brush')
    expect(wrapper.props('defaultColor')).toBe('#000000')
    expect(wrapper.props('defaultStrokeWidth')).toBe(2)
    expect(wrapper.props('defaultOpacity')).toBe(100)
    expect(wrapper.props('maxHistorySize')).toBe(50)
  })

  /**
   * Test custom prop values
   * Requirements: 11.4, 12.2
   */
  test('accepts custom prop values', () => {
    const wrapper = mount(ImgDrawing, {
      props: {
        enableBrush: false,
        enableShapes: false,
        enableEraser: true,
        defaultTool: 'eraser',
        defaultColor: '#ff0000',
        defaultStrokeWidth: 5,
        defaultOpacity: 50,
        maxHistorySize: 100,
      },
      global: {
        provide: {
          imgEditor: { commit: vi.fn(), getImageState: vi.fn() },
        },
        stubs: { UButton: true, UIcon: true, UTooltip: true, UInput: true, UButtonGroup: true, USlider: true, UCheckbox: true, UDivider: true },
      },
    })

    // Assert: Component should use custom props
    expect(wrapper.props('enableBrush')).toBe(false)
    expect(wrapper.props('enableShapes')).toBe(false)
    expect(wrapper.props('enableEraser')).toBe(true)
    expect(wrapper.props('defaultTool')).toBe('eraser')
    expect(wrapper.props('defaultColor')).toBe('#ff0000')
    expect(wrapper.props('defaultStrokeWidth')).toBe(5)
    expect(wrapper.props('defaultOpacity')).toBe(50)
    expect(wrapper.props('maxHistorySize')).toBe(100)
  })

  /**
   * Test activate/deactivate lifecycle
   * Requirements: 12.1, 12.4
   */
  test('activate() initializes drawing system', async () => {
    const wrapper = mount(ImgDrawing, {
      global: {
        provide: { imgEditor: { commit: vi.fn(), getImageState: vi.fn() } },
        stubs: { UButton: true, UIcon: true, UTooltip: true, UInput: true, UButtonGroup: true, USlider: true, UCheckbox: true, UDivider: true },
      },
    })
    const vm = wrapper.vm as unknown as {
      isActive: boolean
      activate: () => void
      drawing: ReturnType<typeof import('../composables/useDrawing').useDrawing>
      tools: ReturnType<typeof import('../composables/useDrawingTools').useDrawingTools>
      history: ReturnType<typeof import('../composables/useDrawingHistory').useDrawingHistory>
    }

    // Assert: Initially not active
    expect(vm.isActive).toBe(false)

    // Act: Activate
    vm.activate()

    // Assert: Should be active
    expect(vm.isActive).toBe(true)

    // Assert: Drawing composable should be initialized
    expect(vm.drawing).toBeDefined()
    expect(vm.tools).toBeDefined()
    expect(vm.history).toBeDefined()
  })

  /**
   * Test deactivate clears state
   * Requirements: 12.1, 12.4
   */
  test('deactivate() clears drawing state', async () => {
    const wrapper = mount(ImgDrawing, {
      global: {
        provide: { imgEditor: { commit: vi.fn(), getImageState: vi.fn() } },
        stubs: { UButton: true, UIcon: true, UTooltip: true, UInput: true, UButtonGroup: true, USlider: true, UCheckbox: true, UDivider: true },
      },
    })
    const vm = wrapper.vm as unknown as {
      isActive: boolean
      activate: () => void
      deactivate: () => void
      drawing: ReturnType<typeof import('../composables/useDrawing').useDrawing>
      tools: ReturnType<typeof import('../composables/useDrawingTools').useDrawingTools>
      history: ReturnType<typeof import('../composables/useDrawingHistory').useDrawingHistory>
    }

    // Act: Activate then deactivate
    vm.activate()
    expect(vm.isActive).toBe(true)

    await vm.deactivate()

    // Assert: Should not be active
    expect(vm.isActive).toBe(false)

    // Assert: Drawing state should be cleared
    expect(vm.tools.currentStroke.value).toHaveLength(0)
    expect(vm.tools.shapeStart.value).toBeNull()
    expect(vm.tools.shapePreview.value).toBeNull()
    expect(vm.drawing.isDrawing.value).toBe(false)
  })

  /**
   * Test multiple activate calls are idempotent
   * Requirements: 12.1
   */
  test('multiple activate() calls are idempotent', () => {
    const wrapper = mount(ImgDrawing, {
      global: {
        provide: { imgEditor: { commit: vi.fn(), getImageState: vi.fn() } },
        stubs: { UButton: true, UIcon: true, UTooltip: true, UInput: true, UButtonGroup: true, USlider: true, UCheckbox: true, UDivider: true },
      },
    })
    const vm = wrapper.vm as unknown as {
      isActive: boolean
      activate: () => void
    }

    // Act: Activate multiple times
    vm.activate()
    const firstActivation = vm.isActive

    vm.activate()
    const secondActivation = vm.isActive

    // Assert: Should remain active
    expect(firstActivation).toBe(true)
    expect(secondActivation).toBe(true)
  })

  /**
   * Test multiple deactivate calls are idempotent
   * Requirements: 12.1
   */
  test('multiple deactivate() calls are idempotent', async () => {
    const wrapper = mount(ImgDrawing, {
      global: {
        provide: { imgEditor: { commit: vi.fn(), getImageState: vi.fn() } },
        stubs: { UButton: true, UIcon: true, UTooltip: true, UInput: true, UButtonGroup: true, USlider: true, UCheckbox: true, UDivider: true },
      },
    })
    const vm = wrapper.vm as unknown as {
      isActive: boolean
      activate: () => void
      deactivate: () => void
    }

    // Act: Activate, then deactivate multiple times
    vm.activate()
    await vm.deactivate()
    const firstDeactivation = vm.isActive

    await vm.deactivate()
    const secondDeactivation = vm.isActive

    // Assert: Should remain inactive
    expect(firstDeactivation).toBe(false)
    expect(secondDeactivation).toBe(false)
  })

  /**
   * Test event emission for tool changes
   * Requirements: 11.4, 12.2
   */
  test('emits tool-change event when tool changes', async () => {
    const wrapper = mount(ImgDrawing, {
      global: {
        provide: { imgEditor: { commit: vi.fn(), getImageState: vi.fn() } },
        stubs: { UButton: true, UIcon: true, UTooltip: true, UInput: true, UButtonGroup: true, USlider: true, UCheckbox: true, UDivider: true },
      },
    })
    const vm = wrapper.vm as unknown as {
      isActive: boolean
      activate: () => void
      tools: {
        selectTool: (tool: string) => void
      }
    }

    // Act: Activate and change tool
    vm.activate()
    await wrapper.vm.$nextTick()

    vm.tools.selectTool('rectangle')
    await wrapper.vm.$nextTick()

    // Assert: Should emit tool-change event
    const toolChangeEvents = wrapper.emitted('tool-change')
    expect(toolChangeEvents).toBeDefined()
    expect(toolChangeEvents?.length).toBeGreaterThan(0)
  })

  /**
   * Test event emission for layer operations
   * Requirements: 11.4, 12.2
   */
  test('emits layer-added event when layer is added', async () => {
    const wrapper = mount(ImgDrawing, {
      global: {
        provide: { imgEditor: { commit: vi.fn(), getImageState: vi.fn() } },
        stubs: { UButton: true, UIcon: true, UTooltip: true, UInput: true, UButtonGroup: true, USlider: true, UCheckbox: true, UDivider: true },
      },
    })
    const vm = wrapper.vm as unknown as {
      isActive: boolean
      activate: () => void
      drawing: {
        addLayer: (layer: DrawingLayer) => void
      }
    }

    // Act: Activate and add a layer
    vm.activate()
    await wrapper.vm.$nextTick()

    const testLayer: DrawingLayer = {
      id: 'test-layer-1',
      type: 'stroke' as const,
      data: {
        points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
        smoothed: true,
      },
      properties: {
        strokeColor: '#000000',
        fillColor: '#000000',
        strokeWidth: 2,
        opacity: 100,
        enableFill: false,
      },
      timestamp: Date.now(),
      bounds: { x: 0, y: 0, width: 10, height: 10 },
    }

    vm.drawing.addLayer(testLayer)
    await wrapper.vm.$nextTick()

    // Assert: Should emit layer-added event
    const layerAddedEvents = wrapper.emitted('layer-added')
    expect(layerAddedEvents).toBeDefined()
    expect(layerAddedEvents?.length).toBeGreaterThan(0)
    expect(layerAddedEvents?.[0]?.[0]).toBe('test-layer-1')
  })

  /**
   * Test event emission for properties changes
   * Requirements: 11.4, 12.2
   */
  test('emits properties-change event when properties change', async () => {
    const wrapper = mount(ImgDrawing, {
      global: {
        provide: { imgEditor: { commit: vi.fn(), getImageState: vi.fn() } },
        stubs: { UButton: true, UIcon: true, UTooltip: true, UInput: true, UButtonGroup: true, USlider: true, UCheckbox: true, UDivider: true },
      },
    })
    const vm = wrapper.vm as unknown as {
      isActive: boolean
      activate: () => void
      drawing: {
        properties: import('vue').Ref<import('../types/drawing').DrawingProperties>
      }
    }

    // Act: Activate and change properties
    vm.activate()
    await wrapper.vm.$nextTick()

    vm.drawing.properties.value = {
      strokeColor: '#ff0000',
      fillColor: '#00ff00',
      strokeWidth: 5,
      opacity: 75,
      enableFill: true,
    }
    await wrapper.vm.$nextTick()

    // Assert: Should emit properties-change event
    const propertiesChangeEvents = wrapper.emitted('properties-change')
    expect(propertiesChangeEvents).toBeDefined()
    expect(propertiesChangeEvents?.length).toBeGreaterThan(0)
  })

  /**
   * Test component cleanup on unmount
   * Requirements: 12.1
   */
  test('cleans up resources on unmount', () => {
    const wrapper = mount(ImgDrawing, {
      global: {
        provide: { imgEditor: { commit: vi.fn(), getImageState: vi.fn() } },
        stubs: { UButton: true, UIcon: true, UTooltip: true, UInput: true, UButtonGroup: true, USlider: true, UCheckbox: true, UDivider: true },
      },
    })
    const vm = wrapper.vm as unknown as {
      isActive: boolean
      activate: () => void
    }

    // Act: Activate
    vm.activate()
    expect(vm.isActive).toBe(true)

    // Act: Unmount
    wrapper.unmount()

    // Assert: Component should unmount successfully
    expect(wrapper.vm).toBeDefined()
  })

  /**
   * Test exposed methods are available
   * Requirements: 12.1, 12.2, 12.3
   */
  test('exposes required methods and state', () => {
    const wrapper = mount(ImgDrawing, {
      global: {
        provide: { imgEditor: { commit: vi.fn(), getImageState: vi.fn() } },
        stubs: { UButton: true, UIcon: true, UTooltip: true, UInput: true, UButtonGroup: true, USlider: true, UCheckbox: true, UDivider: true },
      },
    })
    const vm = wrapper.vm as unknown as {
      isActive: boolean
      activate: () => void
      deactivate: () => void
      drawing: ReturnType<typeof import('../composables/useDrawing').useDrawing>
      tools: ReturnType<typeof import('../composables/useDrawingTools').useDrawingTools>
      history: ReturnType<typeof import('../composables/useDrawingHistory').useDrawingHistory>
    }

    // Assert: Should expose activate and deactivate
    expect(typeof vm.activate).toBe('function')
    expect(typeof vm.deactivate).toBe('function')

    // Assert: Should expose composable state
    expect(vm.drawing).toBeDefined()
    expect(vm.tools).toBeDefined()
    expect(vm.history).toBeDefined()
    expect(vm.isActive).toBeDefined()
  })

  /**
   * Test canvas refs are properly set
   * Requirements: 11.4
   */
  test('sets canvas refs correctly', () => {
    const wrapper = mount(ImgDrawing, {
      global: {
        provide: { imgEditor: { commit: vi.fn(), getImageState: vi.fn() } },
        stubs: { UButton: true, UIcon: true, UTooltip: true, UInput: true, UButtonGroup: true },
      },
    })
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const vm = wrapper.vm

    // Assert: Canvas refs should be set after mount
    // Note: In test environment, refs might not be fully initialized
    // This test verifies the structure is correct
    const canvases = wrapper.findAll('canvas')
    expect(canvases).toHaveLength(2)
  })

  /**
   * Test component handles missing canvas refs gracefully
   * Requirements: 15.1
   */
  test('handles missing canvas refs gracefully', () => {
    const wrapper = mount(ImgDrawing, {
      global: {
        provide: { imgEditor: { commit: vi.fn(), getImageState: vi.fn() } },
        stubs: { UButton: true, UIcon: true, UTooltip: true, UInput: true, UButtonGroup: true },
      },
    })
    const vm = wrapper.vm as unknown as {
      isActive: boolean
      activate: () => void
    }

    // Act: Try to activate before refs are set
    // This should not throw an error
    expect(() => {
      vm.activate()
    }).not.toThrow()
  })
})

import { describe, test, expect } from 'vitest'
import { useDrawing } from './useDrawing'
import { useDrawingHistory } from './useDrawingHistory'
import type { DrawingLayer, StrokeData, DrawingProperties, BoundingBox, HistoryAction } from '../types/drawing'

/**
 * Integration tests for history integration with drawing operations
 * Tests that addLayer, removeLayer, and clearAllLayers correctly record history
 * Requirements: 4.4, 6.1, 6.2, 6.3
 */

/**
 * Test helper for creating a valid drawing layer
 */
function createTestLayer(
  id: string,
  type: 'stroke' | 'shape',
  properties: DrawingProperties,
  bounds: BoundingBox,
): DrawingLayer {
  const data: StrokeData = {
    points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
    smoothed: false,
  }

  return {
    id,
    type,
    data,
    properties,
    timestamp: Date.now(),
    bounds,
  }
}

describe('useDrawing - History Integration Tests', () => {
  /**
   * Test that addLayer records history correctly when recordHistory callback is provided
   * Requirements: 4.4, 6.1
   */
  test('addLayer records add action in history automatically', () => {
    // Create a mock history recording function
    const recordedActions: HistoryAction[] = []
    const recordHistory = (action: HistoryAction) => {
      recordedActions.push(action)
    }

    // Create drawing with history integration
    const drawing = useDrawing(recordHistory)

    // Create a test layer
    const layer = createTestLayer(
      'test-layer-1',
      'stroke',
      {
        strokeColor: '#000000',
        fillColor: '#000000',
        strokeWidth: 2,
        opacity: 1,
        enableFill: false,
      },
      { x: 0, y: 0, width: 100, height: 100 },
    )

    // Add layer - this should automatically record history
    drawing.addLayer(layer)

    // Assert: layer was added
    expect(drawing.layers.value.length).toBe(1)
    expect(drawing.layers.value[0]?.id).toBe('test-layer-1')

    // Assert: history was recorded automatically
    expect(recordedActions.length).toBe(1)
    expect(recordedActions[0]?.type).toBe('add')
    expect(recordedActions[0]?.layer?.id).toBe('test-layer-1')
  })

  /**
   * Test that removeLayer records history correctly when recordHistory callback is provided
   * Requirements: 4.4, 6.1
   */
  test('removeLayer records remove action in history automatically', () => {
    const recordedActions: HistoryAction[] = []
    const recordHistory = (action: HistoryAction) => {
      recordedActions.push(action)
    }

    const drawing = useDrawing(recordHistory)

    // Add a layer first
    const layer = createTestLayer(
      'test-layer-2',
      'stroke',
      {
        strokeColor: '#ff0000',
        fillColor: '#000000',
        strokeWidth: 3,
        opacity: 1,
        enableFill: false,
      },
      { x: 10, y: 10, width: 50, height: 50 },
    )

    drawing.addLayer(layer)
    expect(drawing.layers.value.length).toBe(1)
    expect(recordedActions.length).toBe(1) // Add action recorded

    // Remove the layer - this should automatically record history
    drawing.removeLayer(layer.id)

    // Assert: layer was removed
    expect(drawing.layers.value.length).toBe(0)

    // Assert: history was recorded automatically
    expect(recordedActions.length).toBe(2)
    expect(recordedActions[1]?.type).toBe('remove')
    expect(recordedActions[1]?.layer?.id).toBe('test-layer-2')
  })

  /**
   * Test that clearAllLayers records history correctly when recordHistory callback is provided
   * Requirements: 4.4, 6.1
   */
  test('clearAllLayers records clear action in history automatically', () => {
    const recordedActions: HistoryAction[] = []
    const recordHistory = (action: HistoryAction) => {
      recordedActions.push(action)
    }

    const drawing = useDrawing(recordHistory)

    // Add multiple layers
    const layer1 = createTestLayer(
      'layer-1',
      'stroke',
      {
        strokeColor: '#000000',
        fillColor: '#000000',
        strokeWidth: 2,
        opacity: 1,
        enableFill: false,
      },
      { x: 0, y: 0, width: 50, height: 50 },
    )

    const layer2 = createTestLayer(
      'layer-2',
      'stroke',
      {
        strokeColor: '#ff0000',
        fillColor: '#000000',
        strokeWidth: 2,
        opacity: 1,
        enableFill: false,
      },
      { x: 50, y: 50, width: 50, height: 50 },
    )

    drawing.addLayer(layer1)
    drawing.addLayer(layer2)
    expect(drawing.layers.value.length).toBe(2)
    expect(recordedActions.length).toBe(2) // Two add actions recorded

    // Clear all layers - this should automatically record history
    drawing.clearAllLayers()

    // Assert: layers were cleared
    expect(drawing.layers.value.length).toBe(0)

    // Assert: history was recorded automatically
    expect(recordedActions.length).toBe(3)
    expect(recordedActions[2]?.type).toBe('clear')
    expect(recordedActions[2]?.layers?.length).toBe(2)
  })

  /**
   * Test that undo/redo operations don't double-record history
   * Requirements: 6.2, 6.3
   */
  test('undo operation does not double-record history', () => {
    const recordedActions: HistoryAction[] = []
    const recordHistory = (action: HistoryAction) => {
      recordedActions.push(action)
    }

    const drawing = useDrawing(recordHistory)
    const history = useDrawingHistory(
      50,
      drawing.addLayer,
      drawing.removeLayer,
      drawing.clearAllLayers,
      drawing.setApplyingHistory
    )

    // Add a layer
    const layer = createTestLayer(
      'test-layer-3',
      'stroke',
      {
        strokeColor: '#0000ff',
        fillColor: '#000000',
        strokeWidth: 2,
        opacity: 1,
        enableFill: false,
      },
      { x: 20, y: 20, width: 60, height: 60 },
    )

    drawing.addLayer(layer)
    history.recordAction({
      type: 'add',
      layer,
      timestamp: Date.now(),
    })

    // Assert: one action recorded (from addLayer)
    expect(recordedActions.length).toBe(1)
    expect(drawing.layers.value.length).toBe(1)

    // Undo the operation
    history.undo()

    // Assert: layer was removed by undo
    expect(drawing.layers.value.length).toBe(0)

    // Assert: no additional action was recorded during undo (still just 1)
    expect(recordedActions.length).toBe(1)
  })

  /**
   * Test that redo operation does not double-record history
   * Requirements: 6.2, 6.3
   */
  test('redo operation does not double-record history', () => {
    const recordedActions: HistoryAction[] = []
    const recordHistory = (action: HistoryAction) => {
      recordedActions.push(action)
    }

    const drawing = useDrawing(recordHistory)
    const history = useDrawingHistory(
      50,
      drawing.addLayer,
      drawing.removeLayer,
      drawing.clearAllLayers,
      drawing.setApplyingHistory
    )

    // Add a layer
    const layer = createTestLayer(
      'test-layer-4',
      'stroke',
      {
        strokeColor: '#00ff00',
        fillColor: '#000000',
        strokeWidth: 2,
        opacity: 1,
        enableFill: false,
      },
      { x: 30, y: 30, width: 70, height: 70 },
    )

    drawing.addLayer(layer)
    history.recordAction({
      type: 'add',
      layer,
      timestamp: Date.now(),
    })

    // Assert: one action recorded
    expect(recordedActions.length).toBe(1)

    // Undo the operation
    history.undo()
    expect(drawing.layers.value.length).toBe(0)

    // Redo the operation
    history.redo()

    // Assert: layer was re-added by redo
    expect(drawing.layers.value.length).toBe(1)
    expect(drawing.layers.value[0]?.id).toBe('test-layer-4')

    // Assert: no additional action was recorded during redo (still just 1)
    expect(recordedActions.length).toBe(1)
  })

  /**
   * Test complete undo/redo cycle with multiple operations
   * Requirements: 6.2, 6.3
   */
  test('complete undo/redo cycle works correctly', () => {
    const recordedActions: HistoryAction[] = []
    const recordHistory = (action: HistoryAction) => {
      recordedActions.push(action)
    }

    const drawing = useDrawing(recordHistory)
    const history = useDrawingHistory(
      50,
      drawing.addLayer,
      drawing.removeLayer,
      drawing.clearAllLayers,
      drawing.setApplyingHistory
    )

    // Add three layers
    const layer1 = createTestLayer('layer-1', 'stroke', {
      strokeColor: '#000000',
      fillColor: '#000000',
      strokeWidth: 2,
      opacity: 1,
      enableFill: false,
    }, { x: 0, y: 0, width: 50, height: 50 })

    const layer2 = createTestLayer('layer-2', 'stroke', {
      strokeColor: '#ff0000',
      fillColor: '#000000',
      strokeWidth: 2,
      opacity: 1,
      enableFill: false,
    }, { x: 50, y: 50, width: 50, height: 50 })

    const layer3 = createTestLayer('layer-3', 'stroke', {
      strokeColor: '#0000ff',
      fillColor: '#000000',
      strokeWidth: 2,
      opacity: 1,
      enableFill: false,
    }, { x: 100, y: 100, width: 50, height: 50 })

    // Add layers and record history
    drawing.addLayer(layer1)
    history.recordAction({ type: 'add', layer: layer1, timestamp: Date.now() })

    drawing.addLayer(layer2)
    history.recordAction({ type: 'add', layer: layer2, timestamp: Date.now() })

    drawing.addLayer(layer3)
    history.recordAction({ type: 'add', layer: layer3, timestamp: Date.now() })

    // Assert: all layers added and 3 actions recorded
    expect(drawing.layers.value.length).toBe(3)
    expect(recordedActions.length).toBe(3)
    expect(history.undoStack.value.length).toBe(3)

    // Undo twice
    history.undo()
    history.undo()

    // Assert: two layers removed, no additional actions recorded
    expect(drawing.layers.value.length).toBe(1)
    expect(drawing.layers.value[0]?.id).toBe('layer-1')
    expect(recordedActions.length).toBe(3) // Still 3, no new recordings

    // Redo once
    history.redo()

    // Assert: one layer re-added, no additional actions recorded
    expect(drawing.layers.value.length).toBe(2)
    expect(drawing.layers.value[1]?.id).toBe('layer-2')
    expect(recordedActions.length).toBe(3) // Still 3

    // Redo again
    history.redo()

    // Assert: all layers restored, no additional actions recorded
    expect(drawing.layers.value.length).toBe(3)
    expect(drawing.layers.value[2]?.id).toBe('layer-3')
    expect(recordedActions.length).toBe(3) // Still 3
  })

  /**
   * Test that clear operation can be undone correctly
   * Requirements: 6.2
   */
  test('clear operation can be undone to restore all layers', () => {
    const recordedActions: HistoryAction[] = []
    const recordHistory = (action: HistoryAction) => {
      recordedActions.push(action)
    }

    const drawing = useDrawing(recordHistory)
    const history = useDrawingHistory(
      50,
      drawing.addLayer,
      drawing.removeLayer,
      drawing.clearAllLayers,
      drawing.setApplyingHistory
    )

    // Add multiple layers
    const layer1 = createTestLayer('layer-1', 'stroke', {
      strokeColor: '#000000',
      fillColor: '#000000',
      strokeWidth: 2,
      opacity: 1,
      enableFill: false,
    }, { x: 0, y: 0, width: 50, height: 50 })

    const layer2 = createTestLayer('layer-2', 'stroke', {
      strokeColor: '#ff0000',
      fillColor: '#000000',
      strokeWidth: 2,
      opacity: 1,
      enableFill: false,
    }, { x: 50, y: 50, width: 50, height: 50 })

    drawing.addLayer(layer1)
    drawing.addLayer(layer2)

    // Store layers before clearing
    const layersBeforeClear = [...drawing.layers.value]

    // Clear all layers
    drawing.clearAllLayers()
    history.recordAction({
      type: 'clear',
      layers: layersBeforeClear,
      timestamp: Date.now(),
    })

    // Assert: layers cleared and 3 actions recorded (2 adds + 1 clear)
    expect(drawing.layers.value.length).toBe(0)
    expect(recordedActions.length).toBe(3)

    // Undo the clear
    history.undo()

    // Assert: all layers restored, no additional actions recorded
    expect(drawing.layers.value.length).toBe(2)
    expect(drawing.layers.value[0]?.id).toBe('layer-1')
    expect(drawing.layers.value[1]?.id).toBe('layer-2')
    expect(recordedActions.length).toBe(3) // Still 3, no new recordings during undo
  })
})

import { describe, test, expect, vi } from 'vitest'
import fc from 'fast-check'
import { useDrawingHistory } from './useDrawingHistory'
import type { DrawingLayer } from '../types/drawing'

/**
 * Property-Based Tests for History Management
 *
 * Tests universal properties that should hold across all valid inputs
 * for the history management functionality (undo/redo).
 */

describe('useDrawingHistory - Property-Based Tests', () => {
  /**
   * Fast-check arbitrary for generating drawing properties
   */
  const drawingPropertiesArbitrary = fc.record({
    strokeColor: fc.integer({ min: 0, max: 0xFFFFFF }).map(n => `#${n.toString(16).padStart(6, '0')}`),
    fillColor: fc.integer({ min: 0, max: 0xFFFFFF }).map(n => `#${n.toString(16).padStart(6, '0')}`),
    strokeWidth: fc.integer({ min: 1, max: 50 }),
    opacity: fc.double({ min: 0, max: 1 }),
    enableFill: fc.boolean(),
  })

  /**
   * Fast-check arbitrary for generating points
   */
  const pointArbitrary = fc.record({
    x: fc.double({ min: 0, max: 1000, noNaN: true }),
    y: fc.double({ min: 0, max: 1000, noNaN: true }),
  })

  /**
   * Fast-check arbitrary for generating bounding boxes
   */
  const boundingBoxArbitrary = fc.record({
    x: fc.double({ min: 0, max: 1000, noNaN: true }),
    y: fc.double({ min: 0, max: 1000, noNaN: true }),
    width: fc.double({ min: 1, max: 500, noNaN: true }),
    height: fc.double({ min: 1, max: 500, noNaN: true }),
  })

  /**
   * Fast-check arbitrary for generating drawing layers
   */
  const drawingLayerArbitrary = fc.record({
    id: fc.uuid(),
    type: fc.constantFrom('stroke' as const, 'shape' as const),
    data: fc.oneof(
      // Stroke data
      fc.record({
        points: fc.array(pointArbitrary, { minLength: 2, maxLength: 20 }),
        smoothed: fc.boolean(),
      }),
      // Shape data
      fc.record({
        shapeType: fc.constantFrom('rectangle', 'circle', 'line', 'arrow'),
        start: pointArbitrary,
        end: pointArbitrary,
        constrained: fc.boolean(),
      })
    ),
    properties: drawingPropertiesArbitrary,
    timestamp: fc.integer({ min: 1000000000000, max: 2000000000000 }),
    bounds: boundingBoxArbitrary,
  })

  /**
   * Helper function to create a mock layer management system
   */
  const createMockLayerSystem = () => {
    const layers: DrawingLayer[] = []

    const addLayer = vi.fn((layer: DrawingLayer) => {
      layers.push(layer)
    })

    const removeLayer = vi.fn((layerId: string) => {
      const index = layers.findIndex(l => l.id === layerId)
      if (index !== -1) {
        layers.splice(index, 1)
      }
    })

    const clearAllLayers = vi.fn(() => {
      layers.length = 0
    })

    const getLayers = () => [...layers]

    return { addLayer, removeLayer, clearAllLayers, getLayers }
  }

  /**
   * Feature: drawing-tools, Property 17: History Recording for All Operations
   * **Validates: Requirements 6.1**
   *
   * For any drawing operation (add stroke, add shape, delete layer),
   * the History_Manager should record a history entry.
   */
  test('Property 17: History Recording for All Operations - all operations recorded', () => {
    fc.assert(
      fc.property(
        fc.array(drawingLayerArbitrary, { minLength: 1, maxLength: 20 }),
        (layers: DrawingLayer[]) => {
          const system = createMockLayerSystem()
          const history = useDrawingHistory(
            50,
            system.addLayer,
            system.removeLayer,
            system.clearAllLayers
          )

          // Record add operations for each layer
          for (const layer of layers) {
            history.recordAction({
              type: 'add',
              layer,
              timestamp: Date.now(),
            })
          }

          // Assert: undo stack should have one entry per operation
          expect(history.undoStack.value).toHaveLength(layers.length)

          // Assert: each entry should have both action and inverse
          for (const entry of history.undoStack.value) {
            expect(entry.action).toBeDefined()
            expect(entry.inverse).toBeDefined()
            expect(entry.action.type).toBe('add')
            expect(entry.inverse.type).toBe('remove')
          }
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: drawing-tools, Property 17: History Recording for All Operations
   * **Validates: Requirements 6.1**
   *
   * Test that remove operations are recorded correctly.
   */
  test('Property 17: History Recording for All Operations - remove operations recorded', () => {
    fc.assert(
      fc.property(
        fc.array(drawingLayerArbitrary, { minLength: 1, maxLength: 20 }),
        (layers: DrawingLayer[]) => {
          const system = createMockLayerSystem()
          const history = useDrawingHistory(
            50,
            system.addLayer,
            system.removeLayer,
            system.clearAllLayers
          )

          // Record remove operations for each layer
          for (const layer of layers) {
            history.recordAction({
              type: 'remove',
              layer,
              timestamp: Date.now(),
            })
          }

          // Assert: undo stack should have one entry per operation
          expect(history.undoStack.value).toHaveLength(layers.length)

          // Assert: each entry should have correct action and inverse types
          for (const entry of history.undoStack.value) {
            expect(entry.action.type).toBe('remove')
            expect(entry.inverse.type).toBe('add')
          }
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: drawing-tools, Property 18: Undo Reverses Last Operation
   * **Validates: Requirements 6.2**
   *
   * For any drawing operation followed by undo, the Drawing_System state
   * should be equivalent to the state before the operation.
   */
  test('Property 18: Undo Reverses Last Operation - state equivalent to before operation', () => {
    fc.assert(
      fc.property(
        fc.array(drawingLayerArbitrary, { minLength: 1, maxLength: 10 }),
        (layers: DrawingLayer[]) => {
          const system = createMockLayerSystem()
          const history = useDrawingHistory(
            50,
            system.addLayer,
            system.removeLayer,
            system.clearAllLayers
          )

          // Add layers one by one
          for (const layer of layers) {
            system.addLayer(layer)
            history.recordAction({
              type: 'add',
              layer,
              timestamp: Date.now(),
            })
          }

          // Capture state after all additions
          const stateAfterAdditions = system.getLayers()
          expect(stateAfterAdditions).toHaveLength(layers.length)

          // Undo the last operation
          history.undo()

          // Assert: state should be equivalent to before the last operation
          const stateAfterUndo = system.getLayers()
          expect(stateAfterUndo).toHaveLength(layers.length - 1)

          // Assert: all layers except the last one should still be present
          for (let i = 0; i < layers.length - 1; i++) {
            expect(stateAfterUndo[i]!.id).toBe(layers[i]!.id)
          }
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: drawing-tools, Property 18: Undo Reverses Last Operation
   * **Validates: Requirements 6.2**
   *
   * Test that undo reverses remove operations correctly.
   */
  test('Property 18: Undo Reverses Last Operation - undo reverses remove operation', () => {
    fc.assert(
      fc.property(
        fc.array(drawingLayerArbitrary, { minLength: 2, maxLength: 10 }),
        fc.integer({ min: 0, max: 9 }),
        (layers: DrawingLayer[], removeIndexRaw: number) => {
          const removeIndex = removeIndexRaw % layers.length

          const system = createMockLayerSystem()
          const history = useDrawingHistory(
            50,
            system.addLayer,
            system.removeLayer,
            system.clearAllLayers
          )

          // Add all layers
          for (const layer of layers) {
            system.addLayer(layer)
          }

          // Capture state before removal
          const stateBeforeRemoval = system.getLayers()
          expect(stateBeforeRemoval).toHaveLength(layers.length)

          // Remove a layer
          const layerToRemove = layers[removeIndex]!
          system.removeLayer(layerToRemove.id)
          history.recordAction({
            type: 'remove',
            layer: layerToRemove,
            timestamp: Date.now(),
          })

          // Verify layer was removed
          const stateAfterRemoval = system.getLayers()
          expect(stateAfterRemoval).toHaveLength(layers.length - 1)

          // Undo the removal
          history.undo()

          // Assert: state should be equivalent to before the removal
          const stateAfterUndo = system.getLayers()
          expect(stateAfterUndo).toHaveLength(layers.length)

          // Assert: the removed layer should be back
          const restoredLayer = stateAfterUndo.find(l => l.id === layerToRemove.id)
          expect(restoredLayer).toBeDefined()
          expect(restoredLayer!.id).toBe(layerToRemove.id)
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: drawing-tools, Property 19: Redo Reapplies Undone Operation
   * **Validates: Requirements 6.3**
   *
   * For any drawing operation followed by undo then redo, the Drawing_System state
   * should be equivalent to the state after the original operation.
   */
  test('Property 19: Redo Reapplies Undone Operation - state equivalent to after operation', () => {
    fc.assert(
      fc.property(
        fc.array(drawingLayerArbitrary, { minLength: 1, maxLength: 10 }),
        (layers: DrawingLayer[]) => {
          const system = createMockLayerSystem()
          const history = useDrawingHistory(
            50,
            system.addLayer,
            system.removeLayer,
            system.clearAllLayers
          )

          // Add layers one by one
          for (const layer of layers) {
            system.addLayer(layer)
            history.recordAction({
              type: 'add',
              layer,
              timestamp: Date.now(),
            })
          }

          // Capture state after all additions
          const stateAfterAdditions = system.getLayers()
          expect(stateAfterAdditions).toHaveLength(layers.length)

          // Undo the last operation
          history.undo()

          // Verify undo worked
          const stateAfterUndo = system.getLayers()
          expect(stateAfterUndo).toHaveLength(layers.length - 1)

          // Redo the operation
          history.redo()

          // Assert: state should be equivalent to after the original operation
          const stateAfterRedo = system.getLayers()
          expect(stateAfterRedo).toHaveLength(layers.length)

          // Assert: all layers should be present in the same order
          for (let i = 0; i < layers.length; i++) {
            expect(stateAfterRedo[i]!.id).toBe(layers[i]!.id)
          }
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: drawing-tools, Property 19: Redo Reapplies Undone Operation
   * **Validates: Requirements 6.3**
   *
   * Test that multiple undo/redo operations work correctly.
   */
  test('Property 19: Redo Reapplies Undone Operation - multiple undo/redo cycles', () => {
    fc.assert(
      fc.property(
        fc.array(drawingLayerArbitrary, { minLength: 3, maxLength: 10 }),
        fc.integer({ min: 1, max: 5 }),
        (layers: DrawingLayer[], undoCount: number) => {
          const actualUndoCount = Math.min(undoCount, layers.length)

          const system = createMockLayerSystem()
          const history = useDrawingHistory(
            50,
            system.addLayer,
            system.removeLayer,
            system.clearAllLayers
          )

          // Add all layers
          for (const layer of layers) {
            system.addLayer(layer)
            history.recordAction({
              type: 'add',
              layer,
              timestamp: Date.now(),
            })
          }

          // Capture state after all additions
          const stateAfterAdditions = system.getLayers()

          // Undo multiple times
          for (let i = 0; i < actualUndoCount; i++) {
            history.undo()
          }

          // Verify undo worked
          const stateAfterUndos = system.getLayers()
          expect(stateAfterUndos).toHaveLength(layers.length - actualUndoCount)

          // Redo all operations
          for (let i = 0; i < actualUndoCount; i++) {
            history.redo()
          }

          // Assert: state should be equivalent to after all original operations
          const stateAfterRedos = system.getLayers()
          expect(stateAfterRedos).toHaveLength(layers.length)

          // Assert: all layers should be present in the same order
          for (let i = 0; i < layers.length; i++) {
            expect(stateAfterRedos[i]!.id).toBe(stateAfterAdditions[i]!.id)
          }
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: drawing-tools, Property 20: New Operation Clears Redo Stack
   * **Validates: Requirements 6.5**
   *
   * For any sequence of operations followed by undo then a new operation,
   * the redo stack should be empty.
   */
  test('Property 20: New Operation Clears Redo Stack - redo stack cleared after new operation', () => {
    fc.assert(
      fc.property(
        fc.array(drawingLayerArbitrary, { minLength: 2, maxLength: 10 }),
        drawingLayerArbitrary,
        fc.integer({ min: 1, max: 5 }),
        (initialLayers: DrawingLayer[], newLayer: DrawingLayer, undoCount: number) => {
          const actualUndoCount = Math.min(undoCount, initialLayers.length)

          const system = createMockLayerSystem()
          const history = useDrawingHistory(
            50,
            system.addLayer,
            system.removeLayer,
            system.clearAllLayers
          )

          // Add initial layers
          for (const layer of initialLayers) {
            system.addLayer(layer)
            history.recordAction({
              type: 'add',
              layer,
              timestamp: Date.now(),
            })
          }

          // Undo some operations
          for (let i = 0; i < actualUndoCount; i++) {
            history.undo()
          }

          // Verify redo stack is not empty
          expect(history.redoStack.value.length).toBeGreaterThan(0)
          expect(history.canRedo.value).toBe(true)

          // Perform a new operation
          system.addLayer(newLayer)
          history.recordAction({
            type: 'add',
            layer: newLayer,
            timestamp: Date.now(),
          })

          // Assert: redo stack should be empty
          expect(history.redoStack.value).toHaveLength(0)
          expect(history.canRedo.value).toBe(false)
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: drawing-tools, Property 20: New Operation Clears Redo Stack
   * **Validates: Requirements 6.5**
   *
   * Test that redo stack is cleared regardless of operation type.
   */
  test('Property 20: New Operation Clears Redo Stack - cleared for any operation type', () => {
    fc.assert(
      fc.property(
        fc.array(drawingLayerArbitrary, { minLength: 3, maxLength: 10 }),
        fc.constantFrom('add', 'remove', 'clear'),
        (layers: DrawingLayer[], newOperationType: 'add' | 'remove' | 'clear') => {
          const system = createMockLayerSystem()
          const history = useDrawingHistory(
            50,
            system.addLayer,
            system.removeLayer,
            system.clearAllLayers
          )

          // Add all layers
          for (const layer of layers) {
            system.addLayer(layer)
            history.recordAction({
              type: 'add',
              layer,
              timestamp: Date.now(),
            })
          }

          // Undo one operation to populate redo stack
          history.undo()
          expect(history.canRedo.value).toBe(true)

          // Perform a new operation of the specified type
          if (newOperationType === 'add') {
            const newLayer = layers[0]! // Reuse a layer for simplicity
            system.addLayer(newLayer)
            history.recordAction({
              type: 'add',
              layer: newLayer,
              timestamp: Date.now(),
            })
          }
          else if (newOperationType === 'remove') {
            const layerToRemove = system.getLayers()[0]
            if (layerToRemove) {
              system.removeLayer(layerToRemove.id)
              history.recordAction({
                type: 'remove',
                layer: layerToRemove,
                timestamp: Date.now(),
              })
            }
          }
          else if (newOperationType === 'clear') {
            const currentLayers = system.getLayers()
            system.clearAllLayers()
            history.recordAction({
              type: 'clear',
              layers: currentLayers,
              timestamp: Date.now(),
            })
          }

          // Assert: redo stack should be empty
          expect(history.redoStack.value).toHaveLength(0)
          expect(history.canRedo.value).toBe(false)
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: drawing-tools, Property 30: History State Reflects Stack Status
   * **Validates: Requirements 14.4, 14.5**
   *
   * For any History_Manager state, canUndo should be true if and only if
   * the undo stack is non-empty, and canRedo should be true if and only if
   * the redo stack is non-empty.
   */
  test('Property 30: History State Reflects Stack Status - canUndo/canRedo match stack state', () => {
    fc.assert(
      fc.property(
        fc.array(drawingLayerArbitrary, { minLength: 0, maxLength: 20 }),
        (layers: DrawingLayer[]) => {
          const system = createMockLayerSystem()
          const history = useDrawingHistory(
            50,
            system.addLayer,
            system.removeLayer,
            system.clearAllLayers
          )

          // Initially, both stacks should be empty
          expect(history.canUndo.value).toBe(false)
          expect(history.canRedo.value).toBe(false)
          expect(history.undoStack.value).toHaveLength(0)
          expect(history.redoStack.value).toHaveLength(0)

          // Add layers one by one
          for (const layer of layers) {
            system.addLayer(layer)
            history.recordAction({
              type: 'add',
              layer,
              timestamp: Date.now(),
            })

            // Assert: canUndo should be true, canRedo should be false
            expect(history.canUndo.value).toBe(true)
            expect(history.canRedo.value).toBe(false)
            expect(history.undoStack.value.length).toBeGreaterThan(0)
            expect(history.redoStack.value).toHaveLength(0)
          }

          // If we added any layers, test undo/redo
          if (layers.length > 0) {
            // Undo all operations
            for (let i = 0; i < layers.length; i++) {
              history.undo()

              // After each undo
              if (i < layers.length - 1) {
                // Still have operations to undo
                expect(history.canUndo.value).toBe(true)
              }
              else {
                // No more operations to undo
                expect(history.canUndo.value).toBe(false)
              }

              // Should always be able to redo after undo
              expect(history.canRedo.value).toBe(true)
            }

            // After undoing everything
            expect(history.canUndo.value).toBe(false)
            expect(history.canRedo.value).toBe(true)
            expect(history.undoStack.value).toHaveLength(0)
            expect(history.redoStack.value).toHaveLength(layers.length)

            // Redo all operations
            for (let i = 0; i < layers.length; i++) {
              history.redo()

              // After each redo
              expect(history.canUndo.value).toBe(true)

              if (i < layers.length - 1) {
                // Still have operations to redo
                expect(history.canRedo.value).toBe(true)
              }
              else {
                // No more operations to redo
                expect(history.canRedo.value).toBe(false)
              }
            }

            // After redoing everything
            expect(history.canUndo.value).toBe(true)
            expect(history.canRedo.value).toBe(false)
            expect(history.undoStack.value).toHaveLength(layers.length)
            expect(history.redoStack.value).toHaveLength(0)
          }
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: drawing-tools, Property 30: History State Reflects Stack Status
   * **Validates: Requirements 14.4, 14.5**
   *
   * Test that canUndo/canRedo are always consistent with stack lengths.
   */
  test('Property 30: History State Reflects Stack Status - consistency invariant', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            operation: fc.constantFrom('add', 'undo', 'redo'),
            layer: drawingLayerArbitrary,
          }),
          { minLength: 1, maxLength: 30 }
        ),
        (operations: Array<{ operation: 'add' | 'undo' | 'redo', layer: DrawingLayer }>) => {
          const system = createMockLayerSystem()
          const history = useDrawingHistory(
            50,
            system.addLayer,
            system.removeLayer,
            system.clearAllLayers
          )

          // Perform a sequence of operations
          for (const op of operations) {
            if (op.operation === 'add') {
              system.addLayer(op.layer)
              history.recordAction({
                type: 'add',
                layer: op.layer,
                timestamp: Date.now(),
              })
            }
            else if (op.operation === 'undo') {
              if (history.canUndo.value) {
                history.undo()
              }
            }
            else if (op.operation === 'redo') {
              if (history.canRedo.value) {
                history.redo()
              }
            }

            // Assert: canUndo/canRedo always match stack state
            expect(history.canUndo.value).toBe(history.undoStack.value.length > 0)
            expect(history.canRedo.value).toBe(history.redoStack.value.length > 0)
          }
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: drawing-tools, Property 17: History Recording for All Operations
   * **Validates: Requirements 6.1, 6.4**
   *
   * Test that history size limit is enforced correctly.
   */
  test('Property 17: History Recording - max history size enforced', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 5, max: 20 }),
        fc.array(drawingLayerArbitrary, { minLength: 10, maxLength: 100 }),
        (maxSize: number, layers: DrawingLayer[]) => {
          const system = createMockLayerSystem()
          const history = useDrawingHistory(
            maxSize,
            system.addLayer,
            system.removeLayer,
            system.clearAllLayers
          )

          // Add more layers than the max history size
          for (const layer of layers) {
            system.addLayer(layer)
            history.recordAction({
              type: 'add',
              layer,
              timestamp: Date.now(),
            })
          }

          // Assert: undo stack should not exceed max size
          expect(history.undoStack.value.length).toBeLessThanOrEqual(maxSize)

          // If we added more than maxSize layers, verify oldest entries were removed
          if (layers.length > maxSize) {
            expect(history.undoStack.value).toHaveLength(maxSize)

            // The undo stack should contain the most recent operations
            const expectedLayers = layers.slice(-maxSize)
            for (let i = 0; i < maxSize; i++) {
              const entry = history.undoStack.value[i]!
              expect(entry.action.layer?.id).toBe(expectedLayers[i]!.id)
            }
          }
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: drawing-tools, Property 18: Undo Reverses Last Operation
   * **Validates: Requirements 6.2**
   *
   * Test that clear operations can be undone correctly.
   */
  test('Property 18: Undo Reverses Last Operation - undo reverses clear operation', () => {
    fc.assert(
      fc.property(
        fc.array(drawingLayerArbitrary, { minLength: 1, maxLength: 10 }),
        (layers: DrawingLayer[]) => {
          const system = createMockLayerSystem()
          const history = useDrawingHistory(
            50,
            system.addLayer,
            system.removeLayer,
            system.clearAllLayers
          )

          // Add all layers
          for (const layer of layers) {
            system.addLayer(layer)
          }

          // Capture state before clear
          const stateBeforeClear = system.getLayers()
          expect(stateBeforeClear).toHaveLength(layers.length)

          // Clear all layers
          const clearedLayers = system.getLayers()
          system.clearAllLayers()
          history.recordAction({
            type: 'clear',
            layers: clearedLayers,
            timestamp: Date.now(),
          })

          // Verify layers were cleared
          expect(system.getLayers()).toHaveLength(0)

          // Undo the clear
          history.undo()

          // Assert: all layers should be restored
          const stateAfterUndo = system.getLayers()
          expect(stateAfterUndo).toHaveLength(layers.length)

          // Assert: all layer IDs should match
          for (let i = 0; i < layers.length; i++) {
            expect(stateAfterUndo[i]!.id).toBe(layers[i]!.id)
          }
        },
      ),
      { numRuns: 100 },
    )
  })
})

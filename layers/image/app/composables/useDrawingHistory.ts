import { ref, computed, type Ref, type ComputedRef } from 'vue'
import type {
  HistoryAction,
  HistoryEntry,
  DrawingLayer,
} from '../types/drawing'

/**
 * History state interface
 */
export interface HistoryState {
  undoStack: Ref<HistoryEntry[]>
  redoStack: Ref<HistoryEntry[]>
  maxHistorySize: Ref<number>
  canUndo: ComputedRef<boolean>
  canRedo: ComputedRef<boolean>
}

/**
 * Drawing history composable for undo/redo functionality
 *
 * Provides:
 * - History stack management (undo/redo stacks)
 * - Command pattern with inverse operations
 * - History size limit enforcement
 * - Computed properties for undo/redo availability
 */
export function useDrawingHistory(
  maxSize: number = 50,
  addLayer: (layer: DrawingLayer) => void,
  removeLayer: (layerId: string) => void,
  clearAllLayers: () => void,
  setApplyingHistory?: (value: boolean) => void
) {
  // Reactive state
  const undoStack = ref<HistoryEntry[]>([])
  const redoStack = ref<HistoryEntry[]>([])
  const maxHistorySize = ref(maxSize)

  /**
   * Computed property: can undo if undo stack is non-empty
   */
  const canUndo = computed(() => undoStack.value.length > 0)

  /**
   * Computed property: can redo if redo stack is non-empty
   */
  const canRedo = computed(() => redoStack.value.length > 0)

  /**
   * Record a drawing action in the history
   * Creates inverse action for undo support
   * Clears redo stack when new action is recorded
   * Enforces max history size limit
   */
  const recordAction = (action: HistoryAction): void => {
    // Create inverse action for undo
    const inverse = createInverseAction(action)

    // Create history entry
    const entry: HistoryEntry = {
      action,
      inverse,
    }

    // Add to undo stack
    undoStack.value.push(entry)

    // Clear redo stack when new action is recorded
    redoStack.value = []

    // Enforce max history size
    if (undoStack.value.length > maxHistorySize.value) {
      undoStack.value.shift()
    }
  }

  /**
   * Create inverse action for undo support
   * Uses command pattern to reverse operations
   */
  const createInverseAction = (action: HistoryAction): HistoryAction => {
    switch (action.type) {
      case 'add':
        // Inverse of add is remove
        return {
          type: 'remove',
          layer: action.layer,
          timestamp: Date.now(),
        }

      case 'remove':
        // Inverse of remove is add
        return {
          type: 'add',
          layer: action.layer,
          timestamp: Date.now(),
        }

      case 'clear':
        // Inverse of clear is to restore all layers
        // We store the layers in the clear action itself
        // When undoing a clear, we'll add them back one by one
        // This is handled specially in applyAction
        return {
          type: 'clear',
          layers: action.layers,
          timestamp: Date.now(),
        }

      default:
        throw new Error(`Unknown action type: ${(action as HistoryAction).type}`)
    }
  }

  /**
   * Undo the most recent operation
   * Pops from undo stack, applies inverse action, pushes to redo stack
   */
  const undo = (): void => {
    if (!canUndo.value) return

    // Pop from undo stack
    const entry = undoStack.value.pop()
    if (!entry) return

    // Apply inverse action
    applyAction(entry.inverse)

    // Push to redo stack
    redoStack.value.push(entry)
  }

  /**
   * Redo the most recently undone operation
   * Pops from redo stack, applies original action, pushes to undo stack
   */
  const redo = (): void => {
    if (!canRedo.value) return

    // Pop from redo stack
    const entry = redoStack.value.pop()
    if (!entry) return

    // Apply original action
    applyAction(entry.action)

    // Push back to undo stack
    undoStack.value.push(entry)
  }

  /**
   * Apply a history action to the drawing state
   * Handles add, remove, and clear operations
   * For clear with layers (inverse of clear), restores all layers
   * Sets applying history flag to prevent double-recording
   */
  const applyAction = (action: HistoryAction): void => {
    // Set flag to prevent recording history during undo/redo
    if (setApplyingHistory) {
      setApplyingHistory(true)
    }

    try {
      switch (action.type) {
        case 'add':
          if (action.layer) {
            addLayer(action.layer)
          }
          break

        case 'remove':
          if (action.layer) {
            removeLayer(action.layer.id)
          }
          break

        case 'clear':
          // If layers are present, this is the inverse of clear (restore)
          if (action.layers && action.layers.length > 0) {
            // Clear first, then add all layers back
            clearAllLayers()
            for (const layer of action.layers) {
              addLayer(layer)
            }
          }
          else {
            // Normal clear operation
            clearAllLayers()
          }
          break

        default:
          if (import.meta.dev) {
            console.warn('[History] Unknown action type:', (action as HistoryAction).type)
          }
      }
    }
    finally {
      // Always reset the flag
      if (setApplyingHistory) {
        setApplyingHistory(false)
      }
    }
  }

  /**
   * Clear all history (undo and redo stacks)
   */
  const clearHistory = (): void => {
    undoStack.value = []
    redoStack.value = []
  }

  /**
   * Get the current history size (undo stack length)
   */
  const getHistorySize = (): number => {
    return undoStack.value.length
  }

  return {
    // State
    undoStack,
    redoStack,
    maxHistorySize,
    canUndo,
    canRedo,

    // Methods
    recordAction,
    undo,
    redo,
    clearHistory,
    getHistorySize,
  }
}

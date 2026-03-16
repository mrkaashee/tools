import { useEventListener } from '@vueuse/core'

export interface InteractionState<T> {
  isInteracting: Ref<boolean>
  kind: Ref<string | null>
  handle: Ref<string | null>
  startPointer: Ref<{ x: number, y: number }>
  startData: Ref<T | null>
}

/**
 * Reusable composable to manage interaction lifecycle (mousedown -> mousemove -> mouseup)
 * Uses VueUse useEventListener for robust cleanup.
 */
export function useInteraction<T>(
  zoomLevel: Ref<number>,
  onMove: (dx: number, dy: number, p: { clientX: number, clientY: number }) => void,
  onEnd?: () => void
) {
  const isInteracting = ref(false)
  const kind = ref<string | null>(null)
  const handle = ref<string | null>(null)
  const startPointer = ref({ x: 0, y: 0 })
  const startData = ref<T | null>(null) as Ref<T | null>

  // Track stop functions for dynamic listeners
  let stops: (() => void)[] = []

  const cleanup = () => {
    stops.forEach(stop => stop())
    stops = []
  }

  const startInteraction = (
    e: MouseEvent | TouchEvent,
    k: string,
    initialData: T,
    h?: string
  ) => {
    e.preventDefault()
    e.stopPropagation()

    const p = getEventPoint(e)
    if (!p) return

    kind.value = k
    handle.value = h || null
    startPointer.value = { x: p.clientX, y: p.clientY }
    // Shallow-clone initial data (cheap vs. JSON round-trip; sufficient for plain objects)
    startData.value = initialData && typeof initialData === 'object'
      ? Object.assign({}, initialData)
      : initialData
    isInteracting.value = true

    // Setup temporary listeners for the duration of the movement
    stops.push(useEventListener(window, 'mousemove', handlePointerMove))
    stops.push(useEventListener(window, 'mouseup', handlePointerUp))
    stops.push(useEventListener(window, 'touchmove', handlePointerMove, { passive: false }))
    stops.push(useEventListener(window, 'touchend', handlePointerUp))
  }

  const handlePointerMove = (e: MouseEvent | TouchEvent) => {
    if (!isInteracting.value) return
    const p = getEventPoint(e)
    if (!p) return

    const scale = zoomLevel.value || 1
    const dx = (p.clientX - startPointer.value.x) / scale
    const dy = (p.clientY - startPointer.value.y) / scale

    onMove(dx, dy, p)
  }

  const handlePointerUp = () => {
    if (!isInteracting.value) return

    isInteracting.value = false
    kind.value = null
    handle.value = null
    startData.value = null

    cleanup()

    if (onEnd) onEnd()
  }

  return {
    isInteracting,
    kind,
    handle,
    startData,
    startInteraction,
  }
}

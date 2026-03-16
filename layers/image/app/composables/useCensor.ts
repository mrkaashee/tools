import { ref, type Ref } from 'vue'
import { calculateMove, calculateResize, type Rect } from '../utils/interaction'

export function useCensor(zoomLevel: Ref<number> = ref(1)) {
  const mode = ref<'blur' | 'pixelate'>('blur')
  const intensity = ref(10)
  const useArea = ref(true)
  const selection = ref({ x: 0, y: 0, width: 0, height: 0 })

  const kind = ref<'move' | 'resize' | null>(null)
  const handle = ref<string | null>(null)

  const initializeSelection = (imageWidth: number, imageHeight: number) => {
    const w = imageWidth * 0.4
    const h = imageHeight * 0.4
    selection.value = {
      x: (imageWidth - w) / 2,
      y: (imageHeight - h) / 2,
      width: w,
      height: h
    }
  }

  const {
    isInteracting,
    startInteraction,
    startData
  } = useInteraction<Rect>(
    zoomLevel,
    (dx, dy) => {
      const data = startData.value
      if (!data) return

      if (kind.value === 'move') {
        const moved = calculateMove(data, dx, dy)
        selection.value.x = moved.x
        selection.value.y = moved.y
      }
      else if (kind.value === 'resize' && handle.value) {
        const resized = calculateResize(data, dx, dy, handle.value, { minWidth: 20, minHeight: 20 })
        selection.value = resized
      }
    }
  )

  const initiateInteraction = (e: MouseEvent | TouchEvent, k: 'move' | 'resize', h?: string) => {
    kind.value = k
    handle.value = h || null
    startInteraction(e, k, { ...selection.value })
  }

  const getCensoredCanvas = (sourceCanvas: HTMLCanvasElement): HTMLCanvasElement | null => {
    const ctx = sourceCanvas.getContext('2d')
    if (!ctx) return null

    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = sourceCanvas.width
    tempCanvas.height = sourceCanvas.height
    const tempCtx = tempCanvas.getContext('2d')
    if (!tempCtx) return null

    tempCtx.drawImage(sourceCanvas, 0, 0)

    const effectCanvas = document.createElement('canvas')
    effectCanvas.width = sourceCanvas.width
    effectCanvas.height = sourceCanvas.height
    const effectCtx = effectCanvas.getContext('2d')
    if (!effectCtx) return null

    if (mode.value === 'blur') {
      effectCtx.filter = `blur(${intensity.value}px)`
      effectCtx.drawImage(sourceCanvas, 0, 0)
    }
    else {
      const size = Math.max(1, 40 - intensity.value) / 100
      const w = Math.ceil(sourceCanvas.width * size)
      const h = Math.ceil(sourceCanvas.height * size)
      const smallCanvas = document.createElement('canvas')
      smallCanvas.width = w
      smallCanvas.height = h
      const smallCtx = smallCanvas.getContext('2d')
      if (smallCtx) {
        smallCtx.imageSmoothingEnabled = false
        smallCtx.drawImage(sourceCanvas, 0, 0, w, h)
        effectCtx.imageSmoothingEnabled = false
        effectCtx.drawImage(smallCanvas, 0, 0, w, h, 0, 0, sourceCanvas.width, sourceCanvas.height)
      }
    }

    if (useArea.value) {
      const { x, y, width, height } = selection.value
      tempCtx.clearRect(x, y, width, height)
      tempCtx.drawImage(effectCanvas, x, y, width, height, x, y, width, height)
    }
    else {
      tempCtx.drawImage(effectCanvas, 0, 0)
    }

    return tempCanvas
  }

  return {
    // State
    mode,
    intensity,
    useArea,
    selection,
    isInteracting,

    // Actions
    initializeSelection,
    initiateInteraction,
    getCensoredCanvas
  }
}

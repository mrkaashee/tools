import { ref, computed, type Ref } from 'vue'
import type { AnnotationData, RectAnnotation, CircleAnnotation, ArrowAnnotation, TextAnnotation } from '../types/editor'
import { calculateMove, calculateResize } from '../utils/interaction'

export function useAnnotate(zoomLevel: Ref<number> = ref(1)) {
  const activeTool = ref<'rect' | 'circle' | 'arrow' | 'text' | null>(null)
  const annotations = ref<AnnotationData[]>([])
  const selectedId = ref<string | null>(null)

  // Drawing state
  const isDrawing = ref(false)
  const dragStart = ref({ x: 0, y: 0 })
  const currentAnnotation = ref<AnnotationData | null>(null)

  const properties = ref({
    fill: 'color-mix(in srgb, var(--ui-primary) 20%, transparent)',
    stroke: 'var(--ui-primary)',
    strokeWidth: 2,
    fontSize: 24,
    text: 'Double click to edit'
  })

  const selectedAnnotation = computed(() => annotations.value.find(a => a.id === selectedId.value))

  const selectTool = (tool: 'rect' | 'circle' | 'arrow' | 'text' | null) => {
    activeTool.value = tool
  }

  const handlePointerDown = (x: number, y: number) => {
    if (!activeTool.value) {
      selectedId.value = null
      return
    }

    isDrawing.value = true
    dragStart.value = { x, y }

    const id = `ann_${Date.now()}`

    if (activeTool.value === 'rect') {
      currentAnnotation.value = {
        id,
        type: 'rect',
        x,
        y,
        width: 0,
        height: 0,
        fill: properties.value.fill,
        stroke: properties.value.stroke,
        strokeWidth: properties.value.strokeWidth
      } as RectAnnotation
    }
    else if (activeTool.value === 'circle') {
      currentAnnotation.value = {
        id,
        type: 'circle',
        x,
        y,
        radius: 0,
        fill: properties.value.fill,
        stroke: properties.value.stroke,
        strokeWidth: properties.value.strokeWidth
      } as CircleAnnotation
    }
    else if (activeTool.value === 'arrow') {
      currentAnnotation.value = {
        id,
        type: 'arrow',
        x,
        y,
        x2: x,
        y2: y,
        stroke: properties.value.stroke,
        strokeWidth: properties.value.strokeWidth
      } as ArrowAnnotation
    }
    else if (activeTool.value === 'text') {
      currentAnnotation.value = {
        id,
        type: 'text',
        x,
        y,
        text: properties.value.text,
        fontSize: properties.value.fontSize,
        fill: properties.value.stroke
      } as TextAnnotation
      isDrawing.value = false
      annotations.value.push(currentAnnotation.value!)
      selectedId.value = id
      currentAnnotation.value = null
    }
  }

  const handlePointerMove = (x: number, y: number) => {
    if (!isDrawing.value || !currentAnnotation.value) return

    const ann = currentAnnotation.value
    if (ann.type === 'rect') {
      ann.width = Math.abs(x - dragStart.value.x)
      ann.height = Math.abs(y - dragStart.value.y)
      ann.x = Math.min(x, dragStart.value.x)
      ann.y = Math.min(y, dragStart.value.y)
    }
    else if (ann.type === 'circle') {
      ann.radius = Math.sqrt(Math.pow(x - dragStart.value.x, 2) + Math.pow(y - dragStart.value.y, 2))
    }
    else if (ann.type === 'arrow') {
      ann.x2 = x
      ann.y2 = y
    }
  }

  const handlePointerUp = () => {
    if (isDrawing.value && currentAnnotation.value) {
      annotations.value.push(currentAnnotation.value)
      selectedId.value = currentAnnotation.value.id
    }
    isDrawing.value = false
    currentAnnotation.value = null
  }

  const removeAnnotation = (id: string) => {
    annotations.value = annotations.value.filter(a => a.id !== id)
    if (selectedId.value === id) selectedId.value = null
  }

  const clearAll = () => {
    annotations.value = []
    selectedId.value = null
  }

  // Interaction logic
  const interactionMode = ref<'moving' | 'resizing' | null>(null)
  const interactionHandle = ref<string | null>(null)

  const {
    isInteracting,
    startInteraction,
    startData
  } = useInteraction<AnnotationData>(
    zoomLevel,
    (dx, dy) => {
      if (!startData.value || !selectedId.value) return
      const ann = annotations.value.find(a => a.id === selectedId.value)
      if (!ann) return

      if (interactionMode.value === 'moving') {
        const moved = calculateMove(
          { x: startData.value.x, y: startData.value.y, width: 0, height: 0 },
          dx, dy
        )
        ann.x = moved.x
        ann.y = moved.y

        if (ann.type === 'arrow' && startData.value.type === 'arrow') {
          ann.x2 = startData.value.x2 + dx
          ann.y2 = startData.value.y2 + dy
        }
      }
      else if (interactionMode.value === 'resizing') {
        if (ann.type === 'rect' && startData.value.type === 'rect') {
          const resized = calculateResize(startData.value, dx, dy, interactionHandle.value!, { minWidth: 10, minHeight: 10 })
          ann.x = resized.x
          ann.y = resized.y
          ann.width = resized.width
          ann.height = resized.height
        }
        else if (ann.type === 'circle' && startData.value.type === 'circle') {
          ann.radius = Math.max(5, startData.value.radius + dx)
        }
      }
    }
  )

  const initiateMove = (e: MouseEvent, ann: AnnotationData) => {
    interactionMode.value = 'moving'
    selectedId.value = ann.id
    startInteraction(e, 'moving', ann)
  }

  const initiateResize = (e: MouseEvent, ann: AnnotationData, handle: string) => {
    interactionMode.value = 'resizing'
    interactionHandle.value = handle
    selectedId.value = ann.id
    startInteraction(e, 'resizing', ann, handle)
  }

  /**
   * Render annotations to a canvas
   */
  const renderToCanvas = async (canvas: HTMLCanvasElement, svgElement: SVGSVGElement): Promise<void> => {
    if (annotations.value.length === 0) return

    const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement
    clonedSvg.setAttribute('width', canvas.width.toString())
    clonedSvg.setAttribute('height', canvas.height.toString())
    clonedSvg.style.cursor = 'default'

    const svgData = new XMLSerializer().serializeToString(clonedSvg)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    return new Promise(resolve => {
      const img = new Image()
      img.onload = () => {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0)
        }
        URL.revokeObjectURL(url)
        resolve()
      }
      img.src = url
    })
  }

  return {
    // State
    activeTool,
    annotations,
    selectedId,
    selectedAnnotation,
    properties,
    isDrawing,
    currentAnnotation,
    isInteracting,

    // Actions
    selectTool,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    removeAnnotation,
    clearAll,
    initiateMove,
    initiateResize,
    renderToCanvas
  }
}

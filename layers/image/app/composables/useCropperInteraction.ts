import { useEventListener } from '@vueuse/core'

type InteractionKind = 'move-box' | 'resize' | 'resize-circle' | 'pan' | null

export interface InteractionOptions {
  mode: CropperMode
  shape: CropperShape
  minWidth: number
  minHeight: number
  maxWidth: number
  maxHeight: number
  effectiveAspectRatio: number
}

export function useCropperInteraction(
  crop: Ref<CropArea>,
  imagePan: Ref<{ x: number, y: number }>,
  moveImageCropSize: Ref<ImageSize>,
  imgNatural: Ref<ImageSize>,
  display: Ref<DisplayGeometry>,
  isInteracting: Ref<boolean>,
  containerRef: Ref<HTMLElement | null>,
  options: InteractionOptions,
  onUpdate: () => void
) {
  // ─── Circle cursor ──────────────────────────────────────────────────────────
  const circleCursor = ref('nwse-resize')

  const updateCircleCursor = (e: MouseEvent | TouchEvent) => {
    if (options.shape !== 'circle' || options.mode !== 'move-box') return
    const p = 'touches' in e ? e.touches[0] : e
    if (!p || !containerRef.value) return
    const rect = containerRef.value.getBoundingClientRect()
    const scale = display.value.scale || 1
    const { left, top } = display.value
    const cx = left + (crop.value.x + crop.value.width / 2) * scale
    const cy = top + (crop.value.y + crop.value.height / 2) * scale
    const mx = p.clientX - rect.left
    const my = p.clientY - rect.top
    const angle = calculateAngle(mx, my, cx, cy)
    circleCursor.value = cursorForAngle(angle)
  }

  let kind: InteractionKind = null
  let handle: string | null = null
  let pStartX = 0
  let pStartY = 0
  let snapCrop: CropArea = { x: 0, y: 0, width: 0, height: 0 }
  let snapPan = { x: 0, y: 0 }

  let stops: (() => void)[] = []

  const cleanup = () => {
    stops.forEach(stop => stop())
    stops = []
  }

  const getPoint = (e: MouseEvent | TouchEvent) =>
    ('touches' in e ? e.touches[0] : e) as Touch | MouseEvent

  const startInteraction = (e: MouseEvent | TouchEvent, k: InteractionKind, h?: string) => {
    if (options.mode === 'fixed') return
    e.preventDefault()
    e.stopPropagation()
    const p = getPoint(e)
    if (!p) return
    kind = k
    handle = h ?? null
    pStartX = p.clientX
    pStartY = p.clientY
    snapCrop = { ...crop.value }
    snapPan = { ...imagePan.value }
    isInteracting.value = true

    // Update cursor for circle resize
    if (k === 'resize-circle') {
      updateCircleCursor(e)
    }

    stops.push(useEventListener(window, 'mousemove', onMove))
    stops.push(useEventListener(window, 'mouseup', endInteraction))
    stops.push(useEventListener(window, 'touchmove', onMove, { passive: false }))
    stops.push(useEventListener(window, 'touchend', endInteraction))
  }

  const onMove = (e: MouseEvent | TouchEvent) => {
    if (!kind) return
    const p = getPoint(e)
    if (!p) return
    // Use full scale (with zoom) for interaction
    const scale = display.value.scale || 1
    const dx = (p.clientX - pStartX) / scale
    const dy = (p.clientY - pStartY) / scale
    const iw = imgNatural.value.width
    const ih = imgNatural.value.height

    if (kind === 'pan') {
      const nx = Math.max(0, Math.min(snapPan.x - dx, iw - moveImageCropSize.value.width))
      const ny = Math.max(0, Math.min(snapPan.y - dy, ih - moveImageCropSize.value.height))
      imagePan.value = { x: nx, y: ny }
      onUpdate()
      return
    }

    if (kind === 'move-box') {
      crop.value.x = Math.max(0, Math.min(snapCrop.x + dx, iw - snapCrop.width))
      crop.value.y = Math.max(0, Math.min(snapCrop.y + dy, ih - snapCrop.height))
      onUpdate()
      return
    }

    if (kind === 'resize' && handle) {
      let { x, y, width, height } = { ...snapCrop }
      if (handle.includes('r')) width = Math.max(options.minWidth, Math.min(snapCrop.width + dx, options.maxWidth))
      if (handle.includes('b')) height = Math.max(options.minHeight, Math.min(snapCrop.height + dy, options.maxHeight))
      if (handle.includes('l')) {
        const d = Math.min(dx, snapCrop.width - options.minWidth)
        x = snapCrop.x + d
        width = snapCrop.width - d
      }
      if (handle.includes('t')) {
        const d = Math.min(dy, snapCrop.height - options.minHeight)
        y = snapCrop.y + d
        height = snapCrop.height - d
      }
      if (options.effectiveAspectRatio) {
        if (handle === 'l' || handle === 'r') height = width / options.effectiveAspectRatio
        else if (handle === 't' || handle === 'b') width = height * options.effectiveAspectRatio
        else {
          const uw = Math.abs(dx) >= Math.abs(dy)
          width = uw
            ? snapCrop.width + (handle.includes('l') ? -dx : dx)
            : (snapCrop.height + (handle.includes('t') ? -dy : dy)) * options.effectiveAspectRatio
          height = width / options.effectiveAspectRatio
          if (handle.includes('l')) x = snapCrop.x + (snapCrop.width - width)
          if (handle.includes('t')) y = snapCrop.y + (snapCrop.height - height)
        }
      }
      if (width > options.maxWidth) {
        width = options.maxWidth
        if (options.effectiveAspectRatio) height = width / options.effectiveAspectRatio
      }
      if (height > options.maxHeight) {
        height = options.maxHeight
        if (options.effectiveAspectRatio) width = height * options.effectiveAspectRatio
      }
      if (x < 0) { width += x; x = 0 }
      if (y < 0) { height += y; y = 0 }
      if (x + width > iw) width = iw - x
      if (y + height > ih) height = ih - y
      crop.value = {
        x,
        y,
        width: Math.max(options.minWidth, width),
        height: Math.max(options.minHeight, height),
      }
      onUpdate()
    }

    if (kind === 'resize-circle') {
      // Update cursor dynamically
      updateCircleCursor(e)

      const scale = display.value.scale || 1
      const rect = containerRef.value?.getBoundingClientRect()
      if (!rect) return
      const absX = p.clientX - rect.left
      const absY = p.clientY - rect.top
      const { left, top } = display.value
      const centerScreenX = left + (snapCrop.x + snapCrop.width / 2) * scale
      const centerScreenY = top + (snapCrop.y + snapCrop.height / 2) * scale
      const distPx = Math.hypot(absX - centerScreenX, absY - centerScreenY) / scale
      let newDiameter = Math.max(options.minWidth, distPx * 2)

      // Constrain diameter to image bounds and max constraints
      newDiameter = Math.min(newDiameter, options.maxWidth, options.maxHeight, iw, ih)

      const cx = snapCrop.x + snapCrop.width / 2
      const cy = snapCrop.y + snapCrop.height / 2
      let nx = cx - newDiameter / 2
      let ny = cy - newDiameter / 2

      // Ensure circle stays within image bounds
      if (nx < 0) {
        nx = 0
        // Recalculate diameter if circle would extend beyond right edge
        if (cx < newDiameter / 2) {
          newDiameter = Math.min(newDiameter, cx * 2)
        }
      }
      if (ny < 0) {
        ny = 0
        // Recalculate diameter if circle would extend beyond bottom edge
        if (cy < newDiameter / 2) {
          newDiameter = Math.min(newDiameter, cy * 2)
        }
      }
      if (nx + newDiameter > iw) {
        newDiameter = Math.min(newDiameter, (iw - cx) * 2)
        nx = cx - newDiameter / 2
      }
      if (ny + newDiameter > ih) {
        newDiameter = Math.min(newDiameter, (ih - cy) * 2)
        ny = cy - newDiameter / 2
      }

      // Final bounds check
      nx = Math.max(0, Math.min(nx, iw - newDiameter))
      ny = Math.max(0, Math.min(ny, ih - newDiameter))

      crop.value = { x: nx, y: ny, width: newDiameter, height: newDiameter }
      onUpdate()
    }
  }

  const endInteraction = () => {
    kind = null
    handle = null
    isInteracting.value = false
    cleanup()
  }

  return { startInteraction, circleCursor, updateCircleCursor }
}

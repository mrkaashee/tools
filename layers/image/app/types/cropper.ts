export interface CropperProps {
  src?: string | null
  mode?: CropperMode
  shape?: CropperShape
  aspectRatio?: number
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
  initialCropPercent?: number
  borderStyle?: 'solid' | 'dashed'
  enableZoom?: boolean
  minZoom?: number
  maxZoom?: number
  zoomStep?: number
  zoomSpeed?: number
  showZoomControls?: boolean
}

export interface CropperEmits {
  (e: 'change', payload: { x: number, y: number, width: number, height: number }): void
  (e: 'ready'): void
  (e: 'error', error: Error): void
  (e: 'transform-change', payload: {
    type: 'rotate' | 'flip-horizontal' | 'flip-vertical' | 'reset'
    state: { rotation: number, flipHorizontal: boolean, flipVertical: boolean }
  }): void
}

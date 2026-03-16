import type { TransformState } from './editor'

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

export type CropperMode = 'move-box' | 'move-image' | 'fixed'
export type CropperShape = 'rectangle' | 'circle'

export interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

export interface ImageSize {
  width: number
  height: number
}

export interface DisplayGeometry {
  scale: number
  baseScale: number
  zoomScale: number
  left: number
  top: number
  imgW: number
  imgH: number
}

export interface UseCropperOptions {
  mode: CropperMode
  shape: CropperShape
  aspectRatio: number
  minWidth: number
  minHeight: number
  maxWidth: number
  maxHeight: number
  initialCropPercent: number
  enableZoom: boolean
  minZoom: number
  maxZoom: number
  zoomStep: number
  zoomSpeed: number
  // Transform options
  enableRotation?: boolean
  enableFlip?: boolean
  rotationStep?: number
  transformDuration?: number
}

export type { TransformState }

export interface TransformOptions {
  enableRotation?: boolean
  enableFlip?: boolean
  rotationStep?: number
  transformDuration?: number
}

export interface TransformChangeEvent {
  type: 'rotate' | 'flip-horizontal' | 'flip-vertical' | 'reset'
  state: TransformState
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

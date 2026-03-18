export type ImageFormat = 'image/jpeg' | 'image/png' | 'image/webp'

export interface ImageState {
  original: string | null
  current: string | null
  width: number
  height: number
  format: ImageFormat
}

export interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

export interface ChangeEvent {
  coordinates: CropArea | null
  canvas: HTMLCanvasElement | null
  imageState: ImageState
}

export interface AnnotationBase {
  id: string
  type: 'rect' | 'circle' | 'arrow' | 'text'
  x: number
  y: number
  fill?: string
  stroke?: string
  strokeWidth?: number
  opacity?: number
}

export interface RectAnnotation extends AnnotationBase {
  type: 'rect'
  width: number
  height: number
  radius?: number
}

export interface CircleAnnotation extends AnnotationBase {
  type: 'circle'
  radius: number
}

export interface ArrowAnnotation extends AnnotationBase {
  type: 'arrow'
  x2: number
  y2: number
}

export interface TextAnnotation extends AnnotationBase {
  type: 'text'
  text: string
  fontSize: number
  fontWeight?: string
  fontFamily?: string
}

export type AnnotationData = RectAnnotation | CircleAnnotation | ArrowAnnotation | TextAnnotation

export interface Layer {
  id: string
  name: string
  type: 'stencil' | 'annotation' | 'filter'
  visible: boolean
  active: boolean
  data?: Record<string, unknown> | AnnotationData
}

export interface ImageEditorContext {
  imageState: Ref<ImageState>
  canvasRef: Ref<HTMLCanvasElement | null>
  imageRef: Ref<HTMLImageElement | null>
  activeTool: Ref<string | null>
  zoomLevel: Ref<number>
  panX: Ref<number>
  panY: Ref<number>
  fixedOverlayRef?: Ref<HTMLDivElement | null>
  fixedStencil: ComputedRef<boolean | undefined>
  loadImage: (src: string, skipCommit?: boolean, skipFit?: boolean) => Promise<void>
  updateCanvas: (imageData: string | HTMLCanvasElement, skipDataUrl?: boolean) => void
  activateTool: (tool: string) => void
  deactivateTool: () => void
  cancelTool: () => void
  getCanvas: () => HTMLCanvasElement | null
  getImageState: () => ImageState
  commit: (imageData: string | HTMLCanvasElement, tool: string) => void
  overlayRef: Ref<HTMLDivElement | null>
  layers: Ref<Layer[]>
  canvasPreviewStyle: Ref<Record<string, string>>
  aspectRatio: Ref<number | undefined>
  onFileChange: (event: Event) => void
  registerApplyHook: (fn: () => void | Promise<void>) => void
  unregisterApplyHook: (fn: () => void | Promise<void>) => void
  applyAndExport: (filename?: string) => Promise<void>
  panBounds: Ref<{ top: number, left: number, width: number, height: number } | null>
  toolbarTargetRef: Ref<HTMLDivElement | null>
  // Toolbar methods
  undo: () => Promise<void>
  redo: () => Promise<void>
  canUndo: ComputedRef<boolean> | Ref<boolean>
  canRedo: ComputedRef<boolean> | Ref<boolean>
  resetAll: () => Promise<void>
  zoomIn: () => void
  zoomOut: () => void
  zoomTo: (level: number) => void
  resetZoom: () => void
  minZoom: ComputedRef<number> | Ref<number>
  maxZoom: ComputedRef<number> | Ref<number>
  hasImage: ComputedRef<boolean> | Ref<boolean>
  isWorkerProcessing: Ref<boolean>
  processImage: (imageData: ImageData, settings: FilterOptions) => Promise<ImageData>
}

// Global Component State Types
export interface HistoryState {
  image: string
  timestamp: number
  tool: string
}

export interface FilterOptions {
  brightness?: number
  contrast?: number
  saturate?: number
  blur?: number
  grayscale?: number
  sepia?: number
  hueRotate?: number
  exposure?: number
  highlights?: number
  shadows?: number
  vibrance?: number
  clarity?: number
  temperature?: number
  tint?: number
  whites?: number
  blacks?: number
  sharpen?: number
  lastPreset?: string
}

export interface TransformState {
  rotation: number
  flipHorizontal: boolean
  flipVertical: boolean
}

export interface AspectPreset {
  id: string
  name: string
  icon: string
  ratio: number
  platform: 'Instagram' | 'TikTok' | 'YouTube' | 'General'
}

export interface ImgHandlerProps {
  position: 'tl' | 'tr' | 'bl' | 'br' | 't' | 'b' | 'l' | 'r'
  active?: boolean
}

export interface ImgActionButtonsProps {
  filename?: string
}

// Structured Prop Types for ImgStudio/ImgEditor
export interface StudioCanvasProps {
  hide?: boolean
  board?: boolean | Record<string, unknown>
  border?: boolean | Record<string, unknown>
  class?: string
  style?: string | Record<string, string>
}

export interface StudioStencilProps {
  type?: 'rect' | 'circle' | 'none'
  fixed?: boolean
  aspectRatio?: number
  movable?: boolean
  resizable?: boolean
}

export interface StudioDragProps {
  disable?: boolean
  restrict?: boolean
}

export interface StudioZoomProps {
  min?: number
  max?: number
}

export interface StudioToolbarProps {
  hide?: boolean
  position?: 'left' | 'right' | 'top' | 'bottom'
  class?: string
}

export interface StudioUploaderProps {
  hide?: boolean
  hideIfHasImage?: boolean
  variant?: 'area' | 'button'
  label?: string
}

export interface StudioFloatingBarProps {
  hide?: boolean
  position?: 'top' | 'bottom'
  actions?: ('zoom' | 'history' | 'reset' | 'fit')[]
}

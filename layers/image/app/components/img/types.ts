export interface CropResult {
  /** X offset in original image pixels */
  x: number
  /** Y offset in original image pixels */
  y: number
  /** Width of the cropped region in original image pixels */
  width: number
  /** Height of the cropped region in original image pixels */
  height: number
  /** Cropped image as a data URL */
  dataUrl: string
  /** Final output width after scaling */
  outWidth?: number
  /** Final output height after scaling */
  outHeight?: number
}

export interface AspectPreset {
  label: string
  /**
   * Aspect ratio value (width / height).
   * Supports literals: 'aspect-square', 'aspect-video', 'aspect-auto'
   * Or custom ratios: '3/2', '16:9', '1'
   * Or raw numbers. null means free crop.
   */
  value: 'aspect-square' | 'aspect-video' | 'aspect-auto' | (string & {}) | number | null
}

export interface CropConfig {
  aspect?: 'aspect-square' | 'aspect-video' | 'aspect-auto' | (string & {}) | number | null
  presets?: AspectPreset[]
  shape?: 'rect' | 'round'
  fixed?: boolean
  naked?: boolean
  size?: number
  width?: number
  height?: number
  /** Output format, defaults to 'image/png' */
  format?: 'image/jpeg' | 'image/png' | 'image/webp' | (string & {})
  /** Output quality for jpeg/webp between 0 and 1 */
  quality?: number
}

export interface ExportConfig {
  formats?: ('image/jpeg' | 'image/png' | 'image/webp' | (string & {}))[]
  defaultFormat?: string
  quality?: number
}

export interface ZoomConfig {
  /** Min zoom scale. Default is auto (fits crop) */
  min?: number
  /** Max zoom scale. Default is 10 */
  max?: number
  /** Sensitivity of mouse wheel. Default is 0.05 */
  step?: number
}

export interface ResizeConfig {
  width?: number
  height?: number
  quality?: number // 0 to 100
  maintainAspectRatio?: boolean
}

export interface ToolbarConfig {
  show?: boolean
  items?: StudioTool[]
}

export type StudioTool = 'crop' | 'apply' | 'cancel' | 'reset' | 'download' | 'none'
export type CropShape = 'rect' | 'round'

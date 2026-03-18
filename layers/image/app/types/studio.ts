/**
 * Shared AppConfig type for all ImgStudio sub-components.
 * Reflects the flattened structure under ui in app config.
 */
export interface StudioAppConfig {
  ui?: {
    actionButtons?: Record<string, unknown>
    annotate?: Record<string, unknown>
    aspect?: Record<string, unknown>
    censor?: Record<string, unknown>
    circleStencil?: Record<string, unknown>
    compare?: Record<string, unknown>
    cropper?: Record<string, unknown>
    drawing?: Record<string, unknown>
    filter?: Record<string, unknown>
    handler?: Record<string, unknown>
    layers?: Record<string, unknown>
    preview?: Record<string, unknown>
    rectangleStencil?: Record<string, unknown>
    resize?: Record<string, unknown>
    toolbar?: Record<string, unknown>
    transform?: Record<string, unknown>
    upload?: Record<string, unknown>
  }
}

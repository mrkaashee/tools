import { ref, computed } from 'vue'
import { downloadBlob } from '../utils/files'

export interface ProcessorSettings {
  brightness: number
  contrast: number
  saturation: number
  blur: number
  grayscale: number
  sepia: number
  hueRotate: number
  // Advanced adjustments
  exposure: number
  highlights: number
  shadows: number
  vibrance: number
  clarity: number
  temperature: number
  tint: number
  whites: number
  blacks: number
  sharpen: number
}

export const DEFAULT_SETTINGS: ProcessorSettings = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  blur: 0,
  grayscale: 0,
  sepia: 0,
  hueRotate: 0,
  exposure: 0,
  highlights: 0,
  shadows: 0,
  vibrance: 0,
  clarity: 0,
  temperature: 0,
  tint: 0,
  whites: 0,
  blacks: 0,
  sharpen: 0,
}

export const PRESET_FILTERS = [
  { id: 'none', label: 'Original', preset: {} },
  { id: 'vivid', label: 'Vivid', preset: { saturate: 130, exposure: 10, contrast: 110, vibrance: 20 } },
  { id: 'noir', label: 'Noir', preset: { grayscale: 100, saturate: 0, contrast: 140, brightness: 90, blacks: -20, whites: 10, sharpen: 20 } },
  { id: 'vintage', label: 'Vintage', preset: { sepia: 60, contrast: 90, brightness: 105, temperature: 20, tint: 10, vibrance: -10 } },
  { id: 'dramatic', label: 'Dramatic', preset: { contrast: 150, saturation: 70, shadows: -30, highlights: 20, exposure: -10, clarity: 30 } },
  { id: 'cool', label: 'Cool', preset: { temperature: -40, tint: -10, saturation: 110 } },
  { id: 'warm', label: 'Warm', preset: { temperature: 40, tint: 10, saturation: 105 } },
  { id: 'fade', label: 'Fade', preset: { brightness: 115, contrast: 80, saturation: 80, shadows: 20, blacks: 30 } },
  { id: 'crisp', label: 'Crisp', preset: { clarity: 40, sharpen: 30, contrast: 110, saturation: 110 } },
]

export function useImageProcessor() {
  const selectedFilterId = ref('none')

  // Settings as individual refs for direct v-model binding
  const brightness = ref(DEFAULT_SETTINGS.brightness)
  const contrast = ref(DEFAULT_SETTINGS.contrast)
  const saturation = ref(DEFAULT_SETTINGS.saturation)
  const blur = ref(DEFAULT_SETTINGS.blur)
  const grayscale = ref(DEFAULT_SETTINGS.grayscale)
  const sepia = ref(DEFAULT_SETTINGS.sepia)
  const hueRotate = ref(DEFAULT_SETTINGS.hueRotate)

  // Advanced
  const exposure = ref(DEFAULT_SETTINGS.exposure)
  const highlights = ref(DEFAULT_SETTINGS.highlights)
  const shadows = ref(DEFAULT_SETTINGS.shadows)
  const vibrance = ref(DEFAULT_SETTINGS.vibrance)
  const clarity = ref(DEFAULT_SETTINGS.clarity)
  const temperature = ref(DEFAULT_SETTINGS.temperature)
  const tint = ref(DEFAULT_SETTINGS.tint)
  const whites = ref(DEFAULT_SETTINGS.whites)
  const blacks = ref(DEFAULT_SETTINGS.blacks)
  const sharpen = ref(DEFAULT_SETTINGS.sharpen)

  const reset = () => {
    selectedFilterId.value = 'none'
    brightness.value = DEFAULT_SETTINGS.brightness
    contrast.value = DEFAULT_SETTINGS.contrast
    saturation.value = DEFAULT_SETTINGS.saturation
    blur.value = DEFAULT_SETTINGS.blur
    grayscale.value = DEFAULT_SETTINGS.grayscale
    sepia.value = DEFAULT_SETTINGS.sepia
    hueRotate.value = DEFAULT_SETTINGS.hueRotate
    exposure.value = DEFAULT_SETTINGS.exposure
    highlights.value = DEFAULT_SETTINGS.highlights
    shadows.value = DEFAULT_SETTINGS.shadows
    vibrance.value = DEFAULT_SETTINGS.vibrance
    clarity.value = DEFAULT_SETTINGS.clarity
    temperature.value = DEFAULT_SETTINGS.temperature
    tint.value = DEFAULT_SETTINGS.tint
    whites.value = DEFAULT_SETTINGS.whites
    blacks.value = DEFAULT_SETTINGS.blacks
    sharpen.value = DEFAULT_SETTINGS.sharpen
  }

  const applyPreset = (preset: Partial<ProcessorSettings>) => {
    brightness.value = preset.brightness ?? 100
    contrast.value = preset.contrast ?? 100
    saturation.value = preset.saturation ?? 100
    blur.value = preset.blur ?? 0
    grayscale.value = preset.grayscale ?? 0
    sepia.value = preset.sepia ?? 0
    hueRotate.value = preset.hueRotate ?? 0
    // Reset advanced when applying basic presets from filters.vue
    exposure.value = preset.exposure ?? 0
    highlights.value = preset.highlights ?? 0
    shadows.value = preset.shadows ?? 0
    vibrance.value = preset.vibrance ?? 0
    clarity.value = preset.clarity ?? 0
    temperature.value = preset.temperature ?? 0
    tint.value = preset.tint ?? 0
    whites.value = preset.whites ?? 0
    blacks.value = preset.blacks ?? 0
    sharpen.value = preset.sharpen ?? 0
  }

  const selectFilter = (filterId: string) => {
    selectedFilterId.value = filterId
    const filter = PRESET_FILTERS.find(f => f.id === filterId)
    if (filter) {
      applyPreset(filter.preset)
    }
  }

  const processorStyle = computed(() => {
    const filters: string[] = []

    // Basic Filters
    if (grayscale.value > 0) filters.push(`grayscale(${grayscale.value}%)`)
    if (sepia.value > 0) filters.push(`sepia(${sepia.value}%)`)
    if (blur.value > 0) filters.push(`blur(${blur.value}px)`)

    // Brightness calculation (combining basic and exposure)
    const totalBrightness = brightness.value + exposure.value
    if (totalBrightness !== 100) filters.push(`brightness(${totalBrightness}%)`)

    // Contrast calculation (combining basic, highlights/shadows, and clarity)
    const totalContrast = contrast.value + (highlights.value - shadows.value) / 2 + (clarity.value * 0.5)
    if (totalContrast !== 100) filters.push(`contrast(${totalContrast}%)`)

    // Saturation calculation (combining basic and vibrance)
    const totalSaturation = saturation.value + vibrance.value
    if (totalSaturation !== 100) filters.push(`saturate(${totalSaturation}%)`)

    // Hue Calculation (combining basic, temperature, and tint)
    const totalHue = hueRotate.value + (temperature.value * 0.5) + (tint.value * 0.3)
    if (totalHue !== 0) filters.push(`hue-rotate(${totalHue}deg)`)

    return filters.length > 0 ? filters.join(' ') : 'none'
  })

  const getBlob = async (image: HTMLImageElement, format = 'image/png', quality = 0.92): Promise<Blob | null> => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight

    ctx.filter = processorStyle.value
    ctx.drawImage(image, 0, 0)

    return new Promise(resolve => {
      canvas.toBlob(resolve, format, quality)
    })
  }

  const download = async (image: HTMLImageElement, filename = 'processed-image.png') => {
    const blob = await getBlob(image)
    if (blob) {
      downloadBlob(blob, filename)
    }
  }

  return {
    // State
    selectedFilterId,
    brightness,
    contrast,
    saturation,
    blur,
    grayscale,
    sepia,
    hueRotate,
    exposure,
    highlights,
    shadows,
    vibrance,
    clarity,
    temperature,
    tint,
    whites,
    blacks,

    // Computed
    processorStyle,
    filters: PRESET_FILTERS,

    // Actions
    reset,
    applyPreset,
    selectFilter,
    getBlob,
    download,
  }
}

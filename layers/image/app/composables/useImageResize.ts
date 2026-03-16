import { ref, computed } from 'vue'
import { formatBytes } from '../utils/files'

export const RESIZE_PRESETS = [
  { label: 'Instagram Square', width: 1080, height: 1080 },
  { label: 'Instagram Portrait', width: 1080, height: 1350 },
  { label: 'Instagram Landscape', width: 1080, height: 566 },
  { label: 'Facebook Post', width: 1200, height: 630 },
  { label: 'Twitter Post', width: 1200, height: 675 },
  { label: 'YouTube Thumbnail', width: 1280, height: 720 },
  { label: 'HD (1080p)', width: 1920, height: 1080 },
  { label: '4K', width: 3840, height: 2160 },
] as const

export function useImageResize() {
  const originalImage = ref<HTMLImageElement | null>(null)
  const originalWidth = ref(0)
  const originalHeight = ref(0)
  const newWidth = ref(800)
  const newHeight = ref(600)
  const maintainAspectRatio = ref(true)
  const resizeMode = ref<'custom' | 'percentage' | 'preset'>('custom')
  const percentage = ref(100)
  const selectedPreset = ref('')

  const updateWidth = (value: number) => {
    newWidth.value = value
    if (maintainAspectRatio.value && originalWidth.value > 0) {
      const ratio = originalHeight.value / originalWidth.value
      newHeight.value = Math.round(value * ratio)
    }
  }

  const updateHeight = (value: number) => {
    newHeight.value = value
    if (maintainAspectRatio.value && originalHeight.value > 0) {
      const ratio = originalWidth.value / originalHeight.value
      newWidth.value = Math.round(value * ratio)
    }
  }

  const updatePercentage = (value: number) => {
    percentage.value = value
    if (originalWidth.value > 0) {
      newWidth.value = Math.round(originalWidth.value * (value / 100))
      newHeight.value = Math.round(originalHeight.value * (value / 100))
    }
  }

  const applyPreset = (preset: { label: string, width: number, height: number }) => {
    selectedPreset.value = preset.label
    newWidth.value = preset.width
    newHeight.value = preset.height
    maintainAspectRatio.value = false
  }

  const resetSize = () => {
    newWidth.value = originalWidth.value
    newHeight.value = originalHeight.value
    percentage.value = 100
    selectedPreset.value = ''
  }

  const getBlob = async (format = 'image/png', quality = 0.92): Promise<Blob | null> => {
    if (!originalImage.value) return null

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    canvas.width = newWidth.value
    canvas.height = newHeight.value

    ctx.drawImage(originalImage.value, 0, 0, newWidth.value, newHeight.value)

    return new Promise(resolve => {
      canvas.toBlob(resolve, format, quality)
    })
  }

  const setSource = (image: HTMLImageElement) => {
    originalImage.value = image
    originalWidth.value = image.naturalWidth
    originalHeight.value = image.naturalHeight
    newWidth.value = originalWidth.value
    newHeight.value = originalHeight.value
  }

  const fileSizeEstimate = computed(() => {
    const pixels = newWidth.value * newHeight.value
    const bytesPerPixel = 3 // RGB
    return formatBytes(pixels * bytesPerPixel)
  })

  return {
    // State
    originalWidth,
    originalHeight,
    newWidth,
    newHeight,
    maintainAspectRatio,
    resizeMode,
    percentage,
    selectedPreset,

    // Actions
    updateWidth,
    updateHeight,
    updatePercentage,
    applyPreset,
    resetSize,
    getBlob,
    setSource,

    // Computed
    fileSizeEstimate,
    presets: RESIZE_PRESETS,
  }
}

import { ref, watch } from 'vue'
import { useObjectUrl } from '@vueuse/core'

import type { ImageFormat } from '../types/editor'

export const CONVERSION_FORMATS = [
  {
    value: 'image/png',
    label: 'PNG',
    ext: 'png',
    description: 'Lossless compression, supports transparency',
    icon: '🖼️',
  },
  {
    value: 'image/jpeg',
    label: 'JPEG',
    ext: 'jpg',
    description: 'Best for photos, smaller file size',
    icon: '📷',
  },
  {
    value: 'image/webp',
    label: 'WebP',
    ext: 'webp',
    description: 'Modern format, excellent compression',
    icon: '🌐',
  },
] as const

export function useImageConvert() {
  const originalImage = ref<HTMLImageElement | null>(null)
  const outputFormat = ref<ImageFormat>('image/png')
  const quality = ref(92)
  const originalFormat = ref('')
  const convertedBlob = ref<Blob | null>(null)
  const convertedImageUrl = useObjectUrl(convertedBlob)
  const isConverting = ref(false)

  const convert = async () => {
    if (!originalImage.value) return

    isConverting.value = true
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      isConverting.value = false
      return
    }

    const imgEl = originalImage.value
    canvas.width = imgEl.naturalWidth
    canvas.height = imgEl.naturalHeight

    if (outputFormat.value === 'image/png') {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }

    ctx.drawImage(imgEl, 0, 0)

    return new Promise<void>(resolve => {
      canvas.toBlob(blob => {
        if (blob) {
          convertedBlob.value = blob
        }
        isConverting.value = false
        resolve()
      }, outputFormat.value, quality.value / 100)
    })
  }

  const setSource = (image: HTMLImageElement, mimeType: string) => {
    originalImage.value = image
    originalFormat.value = mimeType
    convert()
  }

  const getFormatLabel = (mimeType: string) => {
    const format = CONVERSION_FORMATS.find(f => f.value === mimeType)
    return format?.label || mimeType.split('/')[1]?.toUpperCase() || 'Unknown'
  }

  watch([outputFormat, quality], () => {
    if (originalImage.value) {
      convert()
    }
  })

  return {
    outputFormat,
    quality,
    originalFormat,
    convertedBlob,
    convertedImageUrl,
    isConverting,
    convert,
    setSource,
    getFormatLabel,
    formats: CONVERSION_FORMATS,
  }
}

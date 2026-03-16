import { ref, computed, watch } from 'vue'
import { useObjectUrl } from '@vueuse/core'

import type { ImageFormat } from '../types/editor'

export function useImageCompress() {
  const originalImage = ref<HTMLImageElement | null>(null)
  const quality = ref(92)
  const format = ref<ImageFormat>('image/jpeg')
  const originalSize = ref(0)
  const compressedSize = ref(0)
  const compressedBlob = ref<Blob | null>(null)
  const compressedImageUrl = useObjectUrl(compressedBlob)
  const isCompressing = ref(false)

  const compressionRatio = computed(() => {
    if (originalSize.value === 0 || compressedSize.value === 0) return 0
    return Math.round((1 - compressedSize.value / originalSize.value) * 100)
  })

  const compress = async () => {
    if (!originalImage.value) return

    isCompressing.value = true
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      isCompressing.value = false
      return
    }

    const imgEl = originalImage.value
    canvas.width = imgEl.naturalWidth
    canvas.height = imgEl.naturalHeight
    ctx.drawImage(imgEl, 0, 0)

    return new Promise<void>(resolve => {
      canvas.toBlob(blob => {
        if (blob) {
          compressedBlob.value = blob
          compressedSize.value = blob.size
        }
        isCompressing.value = false
        resolve()
      }, format.value, quality.value / 100)
    })
  }

  const setSource = (image: HTMLImageElement, size: number) => {
    originalImage.value = image
    originalSize.value = size
    compress()
  }

  watch([quality, format], () => {
    if (originalImage.value) {
      compress()
    }
  })

  return {
    // State
    quality,
    format,
    originalSize,
    compressedSize,
    compressedBlob,
    compressedImageUrl,
    isCompressing,

    // Computed
    compressionRatio,

    // Actions
    compress,
    setSource,
  }
}

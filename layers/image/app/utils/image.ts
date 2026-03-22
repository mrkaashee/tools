/**
 * Reads a File object and converts it to a Base64 Data URL string.
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Not an image file'))
      return
    }
    const reader = new FileReader()
    reader.onload = e => resolve(e.target!.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * Loads a remote URL and converts it to a Base64 Data URL using a Canvas.
 * Assumes the server allows Cross-Origin requests.
 */
export function urlToDataUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas context failed'))
        return
      }
      ctx.drawImage(img, 0, 0)
      resolve(canvas.toDataURL())
    }
    img.onerror = () => reject(new Error('Failed to load image from URL'))
    img.src = url
  })
}

/**
 * Converts a Base64 Data URL to a native JavaScript File object.
 * Can optionally re-encode the image to a new format/quality using Canvas.
 */
export function dataUrlToFile(
  dataUrl: string,
  filename: string,
  targetFormat?: string,
  targetQuality?: number
): Promise<File | null> {
  // If no target format specified, or it already matches, decode directly without Canvas
  if (!targetFormat || dataUrl.startsWith(`data:${targetFormat};`)) {
    const parts = dataUrl.split(',')
    const header = parts[0] || ''
    const data = parts[1] || ''
    if (!data) return Promise.resolve(null)

    const mime = header.match(/:(.*?);/)?.[1] ?? 'image/png'
    const bytes = atob(data)
    const buf = new Uint8Array(bytes.length)
    for (let i = 0; i < bytes.length; i++) buf[i] = bytes.charCodeAt(i)

    const ext = mime.split('/')[1] || 'png'
    return Promise.resolve(new File([buf], `${filename}.${ext}`, { type: mime }))
  }

  // Needs format conversion, pipe it through Canvas
  return new Promise(resolve => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = img.naturalWidth
      c.height = img.naturalHeight
      const ctx = c.getContext('2d')
      if (!ctx) return resolve(null)

      ctx.drawImage(img, 0, 0)
      const newDataUrl = c.toDataURL(targetFormat, targetQuality)

      const parts = newDataUrl.split(',')
      const header = parts[0] || ''
      const data = parts[1] || ''
      if (!data) return resolve(null)

      const mime = header.match(/:(.*?);/)?.[1] ?? 'image/png'
      const bytes = atob(data)
      const buf = new Uint8Array(bytes.length)
      for (let i = 0; i < bytes.length; i++) buf[i] = bytes.charCodeAt(i)

      const ext = mime.split('/')[1] || 'png'
      resolve(new File([buf], `${filename}.${ext}`, { type: mime }))
    }
    img.onerror = () => resolve(null)
    img.src = dataUrl
  })
}

/**
 * Triggers a native browser download prompt for a File or Blob object.
 */
export function downloadFile(file: File) {
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

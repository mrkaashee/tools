/**
 * Format bytes into a human-readable string (KB, MB, etc.)
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

/**
 * Trigger a browser download of a blob
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
/**
 * Convert a canvas to a blob
 */
export async function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: string = 'image/png',
  quality: number = 0.92
): Promise<Blob | null> {
  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob), format, quality)
  })
}

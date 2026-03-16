import { ref, onUnmounted } from 'vue'

export interface WorkerSettings {
  brightness: number
  contrast: number
  saturate: number
  grayscale: number
  sepia: number
  hueRotate: number
  exposure: number
  highlights: number
  shadows: number
  vibrance: number
  temperature: number
  tint: number
  clarity: number
  whites: number
  blacks: number
  sharpen: number
}

// The worker code as a string to be used for the inline worker
const WORKER_CODE = `
  self.onmessage = (e) => {
    const { imageData, settings, id } = e.data;
    const { data, width, height } = imageData;
    const pixels = new Uint8ClampedArray(data);

    applyFilters(pixels, settings, width, height);

    self.postMessage({
      processedData: pixels,
      width,
      height,
      id
    }, [pixels.buffer]);
  };

  function applyFilters(data, settings, width, height) {
    const {
      brightness, contrast, saturate, grayscale, sepia, hueRotate,
      exposure, highlights, shadows, vibrance, temperature, tint,
      clarity, whites, blacks, sharpen
    } = settings;

    const b = (brightness + exposure) / 100;
    const c = contrast / 100;
    const s = saturate / 100;
    const v = vibrance / 100;
    const g = grayscale / 100;
    const sep = sepia / 100;

    // Hue Rotate Matrix
    const angle = (hueRotate || 0) * Math.PI / 180;
    const cosVal = Math.cos(angle);
    const sinVal = Math.sin(angle);
    const hMat = [
      0.213 + 0.787 * cosVal - 0.213 * sinVal, 0.715 - 0.715 * cosVal - 0.715 * sinVal, 0.072 - 0.072 * cosVal + 0.928 * sinVal,
      0.213 - 0.213 * cosVal + 0.143 * sinVal, 0.715 + 0.285 * cosVal + 0.140 * sinVal, 0.072 - 0.072 * cosVal - 0.283 * sinVal,
      0.213 - 0.213 * cosVal - 0.787 * sinVal, 0.715 - 0.715 * cosVal + 0.715 * sinVal, 0.072 + 0.928 * cosVal + 0.072 * sinVal
    ];

    const tRed = (temperature > 0 ? temperature * 0.2 : 0) + (tint < 0 ? -tint * 0.1 : 0);
    const tBlue = (temperature < 0 ? -temperature * 0.2 : 0) + (tint < 0 ? -tint * 0.1 : 0);
    const tGreen = tint > 0 ? tint * 0.1 : 0;

    const wFactor = whites / 100;
    const blFactor = blacks / 100;
    const clarityFactor = clarity / 100;

    let sharpData = null;
    if (sharpen > 0) {
      sharpData = new Uint8ClampedArray(data);
    }

    const clamp = (val) => Math.min(255, Math.max(0, val));

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g_val = data[i+1];
      let b_val = data[i+2];

      // 1. Exposure & Brightness
      r *= b; g_val *= b; b_val *= b;

      // 2. Whites & Blacks
      if (wFactor !== 0) {
        const threshold = 200;
        if (r > threshold) r += (r - threshold) * wFactor;
        if (g_val > threshold) g_val += (g_val - threshold) * wFactor;
        if (b_val > threshold) b_val += (b_val - threshold) * wFactor;
      }
      if (blFactor !== 0) {
        const threshold = 55;
        if (r < threshold) r += (r - threshold) * blFactor;
        if (g_val < threshold) g_val += (g_val - threshold) * blFactor;
        if (b_val < threshold) b_val += (b_val - threshold) * blFactor;
      }

      // 3. Contrast
      r = (r - 128) * c + 128;
      g_val = (g_val - 128) * c + 128;
      b_val = (b_val - 128) * c + 128;

      // 4. Hue Rotate
      if (hueRotate !== 0) {
        const tr = r * hMat[0] + g_val * hMat[1] + b_val * hMat[2];
        const tg = r * hMat[3] + g_val * hMat[4] + b_val * hMat[5];
        const tb = r * hMat[6] + g_val * hMat[7] + b_val * hMat[8];
        r = tr; g_val = tg; b_val = tb;
      }

      // 5. Clarity (Midtone Contrast)
      if (clarityFactor !== 0) {
        const m = 128;
        const dr = r - m;
        const dg = g_val - m;
        const db = b_val - m;
        const dist = (Math.abs(dr) + Math.abs(dg) + Math.abs(db)) / 3;
        if (dist < 64) {
          const factor = (1 - dist / 64) * clarityFactor;
          r += dr * factor;
          g_val += dg * factor;
          b_val += db * factor;
        }
      }

      // 6. Highlights & Shadows
      const avg = (r + g_val + b_val) / 3;
      if (avg > 128 && highlights !== 0) {
        const factor = (avg - 128) / 128 * (highlights / 100);
        r += r * factor; g_val += g_val * factor; b_val += b_val * factor;
      } else if (avg <= 128 && shadows !== 0) {
        const factor = (128 - avg) / 128 * (shadows / 100);
        r += r * factor; g_val += g_val * factor; b_val += b_val * factor;
      }

      // 7. Color Balance (Temp/Tint)
      r += tRed; g_val += tGreen; b_val += tBlue;

      // 8. Saturation & Vibrance
      const gray = 0.2989 * r + 0.5870 * g_val + 0.1140 * b_val;
      const max = Math.max(r, g_val, b_val);

      // Saturation
      r = gray + (r - gray) * s;
      g_val = gray + (g_val - gray) * s;
      b_val = gray + (b_val - gray) * s;

      // Vibrance
      const amt = v * (1 - (max - gray) / 128);
      r = r + (r - gray) * amt;
      g_val = g_val + (g_val - gray) * amt;
      b_val = b_val + (b_val - gray) * amt;

      // 9. Grayscale & Sepia
      if (g > 0) {
        const luminance = 0.2989 * r + 0.5870 * g_val + 0.1140 * b_val;
        r = r * (1 - g) + luminance * g;
        g_val = g_val * (1 - g) + luminance * g;
        b_val = b_val * (1 - g) + luminance * g;
      }
      if (sep > 0) {
        const sr = (r * 0.393) + (g_val * 0.769) + (b_val * 0.189);
        const sg = (r * 0.349) + (g_val * 0.686) + (b_val * 0.168);
        const sb = (r * 0.272) + (g_val * 0.534) + (b_val * 0.131);
        r = r * (1 - sep) + sr * sep;
        g_val = g_val * (1 - sep) + sg * sep;
        b_val = b_val * (1 - sep) + sb * sep;
      }

      data[i] = clamp(r);
      data[i+1] = clamp(g_val);
      data[i+2] = clamp(b_val);
    }

    // 10. Sharpening
    if (sharpen > 0 && sharpData) {
      const amount = sharpen / 100;
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          for (let c = 0; c < 3; c++) {
            const i = (y * width + x) * 4 + c;
            const up = ((y - 1) * width + x) * 4 + c;
            const down = ((y + 1) * width + x) * 4 + c;
            const left = (y * width + (x - 1)) * 4 + c;
            const right = (y * width + (x + 1)) * 4 + c;

            const val = sharpData[i] * 5 - (sharpData[up] + sharpData[down] + sharpData[left] + sharpData[right]);
            data[i] = clamp(data[i] * (1 - amount) + val * amount);
          }
        }
      }
    }
  }

`

export function useWorkerProcessor() {
  const isProcessing = ref(false)
  let worker: Worker | null = null
  let messageId = 0
  const pendingRequests = new Map<number, (data: ImageData) => void>()

  const initWorker = () => {
    if (worker) return

    // Create an inline worker from a Blob
    const blob = new Blob([WORKER_CODE], { type: 'application/javascript' })
    const url = URL.createObjectURL(blob)
    worker = new Worker(url)

    worker.onmessage = (e: MessageEvent) => {
      const { processedData, width, height, id } = e.data
      const callback = pendingRequests.get(id)

      if (callback) {
        const imageData = new ImageData(processedData, width, height)
        callback(imageData)
        pendingRequests.delete(id)
      }

      if (pendingRequests.size === 0) {
        isProcessing.value = false
      }
    }

    worker.onerror = err => {
      console.error('Worker error:', err)
      isProcessing.value = false
    }
  }

  const processImage = (imageData: ImageData, settings: WorkerSettings): Promise<ImageData> => {
    initWorker()
    isProcessing.value = true
    const id = ++messageId

    return new Promise(resolve => {
      pendingRequests.set(id, resolve)

      const buffer = imageData.data.buffer
      worker?.postMessage({
        imageData: {
          data: imageData.data,
          width: imageData.width,
          height: imageData.height
        },
        settings,
        id
      }, [buffer] as Transferable[])
    })
  }

  const terminate = () => {
    worker?.terminate()
    worker = null
    pendingRequests.clear()
    isProcessing.value = false
  }

  onUnmounted(terminate)

  return {
    isProcessing,
    processImage,
    terminate
  }
}

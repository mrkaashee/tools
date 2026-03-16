<script lang="ts" setup>
const img = ref('https://images.pexels.com/photos/4323307/pexels-photo-4323307.jpeg')
const imageUrl = ref('')
const fileInputRef = ref<HTMLInputElement>()
const originalImageRef = ref<HTMLImageElement | null>(null)

const {
  exposure, highlights, shadows, whites, blacks,
  temperature, tint, vibrance, clarity,
  processorStyle,
  reset,
  download
} = useImageProcessor()

const handleFileUpload = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file?.type.startsWith('image/')) {
    const reader = new FileReader()
    reader.onload = e => { img.value = e.target?.result as string; reset() }
    reader.readAsDataURL(file)
  }
}

const handleUrlSubmit = async () => {
  if (imageUrl.value.trim()) {
    try {
      const response = await fetch(imageUrl.value.trim())
      const blob = await response.blob()
      img.value = URL.createObjectURL(blob)
      imageUrl.value = ''
      reset()
    }
    catch (error) {
      if (import.meta.dev) {
        console.error('Failed to load image from URL', error)
      }
      img.value = imageUrl.value.trim()
      imageUrl.value = ''
      reset()
    }
  }
}

const triggerFileInput = () => fileInputRef.value?.click()

const downloadImage = () => {
  if (!originalImageRef.value) return
  download(originalImageRef.value, 'adjusted-image.png')
}
</script>

<template>
  <UDashboardPanel>
    <template #body>
      <!-- Header -->
      <div class="mb-8 text-center">
        <h1 class="text-3xl font-bold tracking-tight text-highlighted mb-2">
          Image Adjustments
        </h1>
        <p class="text-muted dark:text-muted text-sm">
          Fine-tune exposure, color temperature, and tonal range
        </p>
      </div>

      <!-- Image Upload Section -->
      <div class="mb-8 p-6 bg-elevated rounded-xl border border-muted shadow-sm">
        <h2 class="text-lg font-semibold text-highlighted mb-4">
          Choose Your Image
        </h2>

        <div class="flex flex-col md:flex-row gap-4">
          <div class="flex-1">
            <input
              ref="fileInputRef"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleFileUpload">
            <UButton
              label="Upload Image"
              icon="i-lucide-upload"
              size="lg"
              color="neutral"
              variant="subtle"
              class="w-full h-14 border-2 border-dashed border-muted hover:border-primary justify-center"
              @click="triggerFileInput" />
          </div>

          <div class="flex-1">
            <div class="flex gap-2">
              <UInput
                v-model="imageUrl"
                type="url"
                placeholder="Or paste image URL..."
                size="lg"
                class="flex-1"
                @keyup.enter="handleUrlSubmit" />
              <UButton
                label="Load"
                color="primary"
                size="lg"
                @click="handleUrlSubmit" />
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Preview -->
        <div class="lg:col-span-2">
          <div class="rounded-xl overflow-hidden border border-muted shadow-sm bg-default">
            <div class="px-4 py-3 bg-muted border-b border-muted">
              <h3 class="text-sm font-semibold text-default">
                Preview
              </h3>
            </div>
            <div class="relative h-125 flex items-center justify-center p-4">
              <img
                ref="originalImageRef"
                :src="img"
                crossorigin="anonymous"
                :style="{ filter: processorStyle }"
                class="max-w-full max-h-full object-contain"
                alt="Preview">
            </div>
          </div>
        </div>

        <!-- Controls -->
        <div class="space-y-6">
          <!-- Light Adjustments -->
          <div
            class="rounded-xl overflow-hidden border border-muted shadow-sm bg-elevated">
            <div class="px-4 py-3 bg-muted border-b border-muted">
              <h3 class="text-sm font-semibold text-default">
                Light
              </h3>
            </div>

            <div class="p-4 space-y-4">
              <!-- Exposure -->
              <div class="space-y-2">
                <div class="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted">
                  <span>Exposure</span>
                  <span>{{ exposure > 0 ? '+' : '' }}{{ exposure }}</span>
                </div>
                <USlider v-model="exposure" :min="-100" :max="100" size="sm" />
              </div>

              <!-- Highlights -->
              <div class="space-y-2">
                <div class="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted">
                  <span>Highlights</span>
                  <span>{{ highlights > 0 ? '+' : '' }}{{ highlights }}</span>
                </div>
                <USlider v-model="highlights" :min="-100" :max="100" size="sm" />
              </div>

              <!-- Shadows -->
              <div class="space-y-2">
                <div class="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted">
                  <span>Shadows</span>
                  <span>{{ shadows > 0 ? '+' : '' }}{{ shadows }}</span>
                </div>
                <USlider v-model="shadows" :min="-100" :max="100" size="sm" />
              </div>

              <!-- Whites -->
              <div class="space-y-2">
                <div class="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted">
                  <span>Whites</span>
                  <span>{{ whites > 0 ? '+' : '' }}{{ whites }}</span>
                </div>
                <USlider v-model="whites" :min="-100" :max="100" size="sm" />
              </div>

              <!-- Blacks -->
              <div class="space-y-2">
                <div class="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted">
                  <span>Blacks</span>
                  <span>{{ blacks > 0 ? '+' : '' }}{{ blacks }}</span>
                </div>
                <USlider v-model="blacks" :min="-100" :max="100" size="sm" />
              </div>
            </div>
          </div>

          <!-- Color Adjustments -->
          <div
            class="rounded-xl overflow-hidden border border-muted shadow-sm bg-elevated">
            <div class="px-4 py-3 bg-muted border-b border-muted">
              <h3 class="text-sm font-semibold text-default">
                Color
              </h3>
            </div>

            <div class="p-4 space-y-4">
              <!-- Temperature -->
              <div class="space-y-2">
                <div class="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted">
                  <span>Temperature</span>
                  <span>{{ temperature > 0 ? '+' : '' }}{{ temperature }}</span>
                </div>
                <USlider v-model="temperature" :min="-100" :max="100" size="sm" />
                <div class="flex justify-between text-[10px] text-muted mt-1">
                  <span>Cool</span>
                  <span>Warm</span>
                </div>
              </div>

              <!-- Tint -->
              <div class="space-y-2">
                <div class="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted">
                  <span>Tint</span>
                  <span>{{ tint > 0 ? '+' : '' }}{{ tint }}</span>
                </div>
                <USlider v-model="tint" :min="-100" :max="100" size="sm" />
                <div class="flex justify-between text-[10px] text-muted mt-1">
                  <span>Green</span>
                  <span>Magenta</span>
                </div>
              </div>

              <!-- Vibrance -->
              <div class="space-y-2">
                <div class="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted">
                  <span>Vibrance</span>
                  <span>{{ vibrance > 0 ? '+' : '' }}{{ vibrance }}</span>
                </div>
                <USlider v-model="vibrance" :min="-100" :max="100" size="sm" />
              </div>
            </div>
          </div>

          <!-- Detail -->
          <div
            class="rounded-xl overflow-hidden border border-muted shadow-sm bg-elevated">
            <div class="px-4 py-3 bg-muted border-b border-muted">
              <h3 class="text-sm font-semibold text-default">
                Detail
              </h3>
            </div>

            <div class="p-4 space-y-4">
              <!-- Clarity -->
              <div class="space-y-2">
                <div class="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted">
                  <span>Clarity</span>
                  <span>{{ clarity > 0 ? '+' : '' }}{{ clarity }}</span>
                </div>
                <USlider v-model="clarity" :min="-100" :max="100" size="sm" />
              </div>

              <!-- Reset -->
              <UButton
                label="Reset All"
                icon="i-lucide-rotate-ccw"
                color="neutral"
                variant="subtle"
                class="w-full justify-center"
                @click="reset" />
            </div>
          </div>

          <!-- Export -->
          <div
            class="rounded-xl overflow-hidden border border-muted shadow-sm bg-elevated">
            <div class="px-4 py-3 bg-muted border-b border-muted">
              <h3 class="text-sm font-semibold text-default">
                Export
              </h3>
            </div>

            <div class="p-4">
              <UButton
                label="Download Image"
                icon="i-lucide-download"
                color="primary"
                size="lg"
                class="w-full justify-center"
                @click="downloadImage" />
            </div>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

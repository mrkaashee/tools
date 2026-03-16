<script lang="ts" setup>
const img = ref('https://images.pexels.com/photos/4323307/pexels-photo-4323307.jpeg')
const imageUrl = ref('')
const fileInputRef = ref<HTMLInputElement>()
const cropperRef = ref<InstanceType<typeof import('./../components/Cropper.vue')['default']> | null>(null)

// Transform state
const currentRotation = ref(0)
const currentFlipH = ref(false)
const currentFlipV = ref(false)

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader()
    reader.onload = e => {
      img.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const handleUrlSubmit = () => {
  if (imageUrl.value.trim()) {
    img.value = imageUrl.value.trim()
    imageUrl.value = ''
  }
}

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

// Transform methods
const rotateLeft = () => {
  cropperRef.value?.rotateLeft()
}

const rotateRight = () => {
  cropperRef.value?.rotateRight()
}

const flipHorizontal = () => {
  cropperRef.value?.flipHorizontal()
}

const flipVertical = () => {
  cropperRef.value?.flipVertical()
}

const resetTransforms = () => {
  cropperRef.value?.resetTransforms()
}

const handleTransformChange = (payload: { state: { rotation: number, flipHorizontal: boolean, flipVertical: boolean } }) => {
  currentRotation.value = payload.state.rotation
  currentFlipH.value = payload.state.flipHorizontal
  currentFlipV.value = payload.state.flipVertical
}

// Export functionality
const exportImage = async () => {
  if (!cropperRef.value) return

  const blob = await cropperRef.value.getBlob({ format: 'image/png' })
  if (blob) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'cropped-image.png'
    a.click()
    URL.revokeObjectURL(url)
  }
}
</script>

<template>
  <UDashboardPanel>
    <template #body>
      <!-- Header -->
      <div class="mb-8 text-center">
        <h1 class="text-3xl font-bold tracking-tight text-highlighted mb-2">
          Image Transformations
        </h1>
        <p class="text-muted text-sm">
          Rotate and flip images with smooth animations
        </p>
      </div>

      <!-- Image Upload Section -->
      <div class="mb-8 p-6 bg-elevated rounded-xl border border-muted shadow-sm">
        <h2 class="text-lg font-semibold text-highlighted mb-4">
          Choose Your Image
        </h2>

        <div class="flex flex-col md:flex-row gap-4">
          <!-- File Upload -->
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
              class="w-full h-14 border-2 border-dashed border-muted hover:border-primary"
              @click="triggerFileInput" />
          </div>

          <!-- URL Input -->
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
        <!-- Cropper -->
        <div class="lg:col-span-2">
          <div class="rounded-xl overflow-hidden border border-muted shadow-sm">
            <div class="px-4 py-3 bg-muted border-b border-muted">
              <h3 class="text-sm font-semibold text-default">
                Preview
              </h3>
            </div>
            <ClientOnly>
              <Cropper
                ref="cropperRef"
                class="h-125 w-full"
                :src="img"
                mode="move-box"
                shape="rectangle"
                :enable-zoom="true"
                :show-zoom-controls="true"
                :enable-rotation="true"
                :enable-flip="true"
                :rotation-step="90"
                :transform-duration="300"
                @transform-change="handleTransformChange" />
            </ClientOnly>
          </div>
        </div>

        <!-- Controls -->
        <div class="space-y-6">
          <!-- Transform Controls -->
          <div class="rounded-xl overflow-hidden border border-muted shadow-sm bg-elevated">
            <div class="px-4 py-3 bg-muted border-b border-muted">
              <h3 class="text-sm font-semibold text-default">
                Transform Controls
              </h3>
            </div>

            <div class="p-4 space-y-4">
              <!-- Rotation -->
              <div>
                <label class="text-xs font-medium text-muted mb-2 block">
                  Rotation
                </label>
                <div class="flex gap-2">
                  <UButton
                    label="Left"
                    icon="i-lucide-rotate-ccw"
                    color="neutral"
                    variant="outline"
                    class="flex-1 justify-center"
                    @click="rotateLeft" />
                  <UButton
                    label="Right"
                    icon="i-lucide-rotate-cw"
                    color="neutral"
                    variant="outline"
                    class="flex-1 justify-center"
                    @click="rotateRight" />
                </div>
              </div>

              <!-- Flip -->
              <div>
                <label class="text-xs font-medium text-muted mb-2 block">
                  Flip
                </label>
                <div class="flex gap-2">
                  <UButton
                    label="Horizontal"
                    icon="i-lucide-flip-horizontal"
                    :color="currentFlipH ? 'primary' : 'neutral'"
                    :variant="currentFlipH ? 'soft' : 'outline'"
                    class="flex-1 justify-center"
                    @click="flipHorizontal" />
                  <UButton
                    label="Vertical"
                    icon="i-lucide-flip-vertical"
                    :color="currentFlipV ? 'primary' : 'neutral'"
                    :variant="currentFlipV ? 'soft' : 'outline'"
                    class="flex-1 justify-center"
                    @click="flipVertical" />
                </div>
              </div>

              <!-- Reset -->
              <div>
                <UButton
                  label="Reset All"
                  icon="i-lucide-rotate-ccw"
                  color="neutral"
                  variant="subtle"
                  class="w-full justify-center"
                  @click="resetTransforms" />
              </div>
            </div>
          </div>

          <!-- Current State -->
          <div class="rounded-xl overflow-hidden border border-muted shadow-sm bg-elevated">
            <div class="px-4 py-3 bg-muted border-b border-muted">
              <h3 class="text-sm font-semibold text-default">
                Current State
              </h3>
            </div>

            <div class="p-4 space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-xs text-muted">Rotation:</span>
                <code class="text-xs font-mono bg-accented px-2 py-1 rounded text-default">
                  {{ currentRotation }}°
                </code>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-xs text-muted">Flip Horizontal:</span>
                <code class="text-xs font-mono bg-accented px-2 py-1 rounded text-default">
                  {{ currentFlipH }}
                </code>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-xs text-muted">Flip Vertical:</span>
                <code class="text-xs font-mono bg-accented px-2 py-1 rounded text-default">
                  {{ currentFlipV }}
                </code>
              </div>
            </div>
          </div>

          <!-- Export -->
          <div class="rounded-xl overflow-hidden border border-muted shadow-sm bg-elevated">
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
                @click="exportImage" />
              <p class="text-xs text-muted mt-2 text-center">
                Exports with all transformations applied
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Feature Info -->
      <div class="mt-8 p-6 bg-info/10 rounded-xl border border-info/30">
        <h3 class="text-sm font-semibold text-info mb-2">
          Features
        </h3>
        <ul class="text-xs text-info space-y-1">
          <li>• Rotate images in 90° increments (configurable via <code class="bg-info/10 px-1 rounded">rotationStep</code> prop)</li>
          <li>• Flip images horizontally or vertically</li>
          <li>• Smooth animations with <code class="bg-info/10 px-1 rounded">prefers-reduced-motion</code> support</li>
          <li>• All transformations are applied to the exported image</li>
          <li>• Enable/disable features via <code class="bg-info/10 px-1 rounded">enableRotation</code> and <code class="bg-info/10 px-1 rounded">enableFlip</code> props</li>
        </ul>
      </div>
    </template>
  </UDashboardPanel>
</template>

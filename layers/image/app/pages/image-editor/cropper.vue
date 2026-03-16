<script lang="ts" setup>
const img = ref('https://images.pexels.com/photos/4323307/pexels-photo-4323307.jpeg')
const imageUrl = ref('')
const fileInputRef = ref<HTMLInputElement>()

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

const examples = [
  {
    mode: 'move-box' as const,
    shape: 'rectangle' as const,
    label: 'Move Box',
    description: 'Drag and resize the crop box',
    badge: 'mode="move-box"',
  },
  {
    mode: 'move-image' as const,
    shape: 'rectangle' as const,
    label: 'Move Image',
    description: 'Fixed box, drag to pan the image',
    badge: 'mode="move-image"',
  },
  {
    mode: 'fixed' as const,
    shape: 'rectangle' as const,
    label: 'Fixed',
    description: 'Static crop preview, no interaction',
    badge: 'mode="fixed"',
  },
  {
    mode: 'move-box' as const,
    shape: 'circle' as const,
    label: 'Circle - Move Box',
    description: 'Round crop box, drag to reposition',
    badge: 'shape="circle" mode="move-box"',
    borderStyle: 'solid' as const,
  },
  {
    mode: 'move-box' as const,
    shape: 'circle' as const,
    label: 'Circle - Dashed Border',
    description: 'Dashed border, resize from any point',
    badge: 'shape="circle" borderStyle="dashed"',
    borderStyle: 'dashed' as const,
  },
  {
    mode: 'move-image' as const,
    shape: 'circle' as const,
    label: 'Circle - Move Image',
    description: 'Fixed round window, image pans behind',
    badge: 'shape="circle" mode="move-image"',
  },
  {
    mode: 'fixed' as const,
    shape: 'circle' as const,
    label: 'Circle - Fixed',
    description: 'Static circular crop preview',
    badge: 'shape="circle" mode="fixed"',
  },
]
</script>

<template>
  <UDashboardPanel>
    <template #body>
      <!-- Header -->
      <div class="mb-8 text-center">
        <h1 class="text-3xl font-bold tracking-tight text-highlighted mb-2">
          Image Cropper Modes
        </h1>
        <p class="text-muted text-sm">
          All behaviour controlled via <code
            class="bg-muted px-1 py-0.5 rounded text-xs font-mono">mode</code> and
          <code class="bg-muted px-1 py-0.5 rounded text-xs font-mono">shape</code> props
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

      <!-- Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          v-for="item in examples"
          :key="`${item.mode}-${item.shape}`"
          class="flex flex-col rounded-xl overflow-hidden border border-muted shadow-sm">
          <!-- Label bar -->
          <div
            class="flex items-center justify-between flex-wrap gap-1 px-4 py-2 bg-muted border-b border-muted">
            <span class="text-sm font-semibold text-default">{{ item.label }}</span>
            <code
              class="text-xs font-mono bg-info/10 text-info px-2 py-0.5 rounded">
              {{ item.badge }}
            </code>
          </div>

          <!-- Cropper -->
          <ClientOnly>
            <Cropper
              class="h-64 w-full"
              :src="img"
              :mode="item.mode"
              :shape="item.shape"
              :border-style="item.borderStyle"
              :enable-zoom="true"
              :show-zoom-controls="true" />
          </ClientOnly>

          <!-- Description -->
          <div
            class="px-4 py-2 text-xs text-muted dark:text-muted bg-elevated border-t border-muted">
            {{ item.description }}
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

<script lang="ts" setup>
import ImgStudio from '#layers/image/app/components/ImgStudio.vue'

const img = ref('https://images.pexels.com/photos/4323307/pexels-photo-4323307.jpeg')
const imageUrl = ref('')
const fileInputRef = ref<HTMLInputElement>()
const editorRef = ref<InstanceType<typeof ImgStudio> | null>(null)
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

const downloadImage = async () => {
  if (!editorRef.value) return

  const blob = await editorRef.value.exportImage('image/png', 0.92)
  if (blob) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'edited-image.png'
    a.click()
    URL.revokeObjectURL(url)
  }
}
</script>

<template>
  <UDashboardPanel grow>
    <template #body>
      <ClientOnly>
        <!-- Header -->
        <div class="mb-4">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-xl font-bold tracking-tight text-highlighted">
                Image Studio
              </h1>
            </div>

            <div class="flex items-center gap-2">
              <UButton
                v-if="editorRef?.isWorkerProcessing"
                label="Worker Processing..."
                variant="soft"
                color="warning"
                loading
                size="sm"
                class="pointer-events-none" />
              <UButton
                label="Reset All"
                icon="i-lucide-rotate-ccw"
                color="neutral"
                variant="subtle"
                size="sm"
                :disabled="!editorRef?.hasImage"
                @click="editorRef?.resetAll()" />
              <UButton
                label="Export"
                icon="i-lucide-download"
                color="primary"
                size="sm"
                @click="downloadImage" />
            </div>
          </div>
        </div>

        <!-- Toolbar / Drop Zone -->
        <div class="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            class="group relative flex items-center justify-center p-3 border border-dashed border-muted rounded-xl hover:border-primary transition-all cursor-pointer bg-muted"
            @click="triggerFileInput">
            <input
              ref="fileInputRef"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleFileUpload">
            <p class="text-xs font-medium text-muted dark:text-muted">
              Upload or drop image
            </p>
          </div>

          <div class="flex gap-2">
            <UInput
              v-model="imageUrl"
              type="url"
              placeholder="Paste image URL..."
              size="sm"
              class="flex-1"
              @keyup.enter="handleUrlSubmit" />
            <UButton
              label="Load"
              color="neutral"
              variant="outline"
              size="sm"
              @click="handleUrlSubmit" />
          </div>
        </div>

        <div class="h-[calc(100vh-180px)]">
          <ImgStudio
            ref="editorRef"
            :src="img"
            preview
            layers
            annotate
            aspect
            censor
            cropper
            transform
            resize
            filter
            restrict-to-bounds>
            <!-- Overlay for drawing/crop -->
            <template #overlay>
              <!-- ImgDrawing removed as per instruction -->
            </template>

            <!-- Custom User Sidebar Content (Tips) -->
            <div class="pt-6 border-t border-default space-y-3">
              <div class="flex items-center gap-2 text-primary-500 px-1">
                <UIcon name="i-lucide-sparkles" class="w-3.5 h-3.5" />
                <span class="text-[10px] font-bold uppercase tracking-widest">
                  Studio Tips
                </span>
              </div>
              <ul class="text-[10px] text-muted space-y-2 leading-tight px-1">
                <li class="flex items-start gap-2 italic">
                  <UIcon name="i-lucide-info" class="w-3 h-3 text-muted mt-0.5" />
                  <span>Non-destructive editing with Stencils</span>
                </li>
              </ul>
            </div>
          </ImgStudio>
        </div>
      </ClientOnly>
    </template>
  </UDashboardPanel>
</template>

<style scoped>
kbd {
    padding: 0.125rem 0.25rem;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 0.25rem;
    font-family: monospace;
    font-size: 0.75rem;
}
</style>

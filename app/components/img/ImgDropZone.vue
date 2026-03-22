<script lang="ts" setup>
const props = withDefaults(defineProps<{
  accept?: string
  disabled?: boolean
}>(), {
  accept: 'image/*',
  disabled: false,
})

const emit = defineEmits<{
  load: [dataUrl: string]
}>()

// --- State ---
const isDragging = ref(false)
const urlInput = ref('')
const urlError = ref('')
const isLoadingUrl = ref(false)
const fileInputRef = ref<HTMLInputElement>()

// --- File reader helper ---
function readFileAsDataUrl(file: File): Promise<string> {
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

// --- Drag events ---
function onDragEnter(e: DragEvent) {
  e.preventDefault()
  if (!props.disabled) isDragging.value = true
}
function onDragOver(e: DragEvent) {
  e.preventDefault()
}
function onDragLeave(e: DragEvent) {
  // Only clear if leaving the zone entirely
  if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
    isDragging.value = false
  }
}
async function onDrop(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false
  if (props.disabled) return
  const file = e.dataTransfer?.files?.[0]
  if (!file) return
  try {
    const dataUrl = await readFileAsDataUrl(file)
    emit('load', dataUrl)
  }
  catch { /* invalid file */ }
}

// --- File input ---
async function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  try {
    const dataUrl = await readFileAsDataUrl(file)
    emit('load', dataUrl)
  }
  catch { /* invalid file */ }
  // Reset so same file can be re-selected
  if (fileInputRef.value) fileInputRef.value.value = ''
}

// --- URL load ---
async function loadFromUrl() {
  urlError.value = ''
  const url = urlInput.value.trim()
  if (!url) return
  isLoadingUrl.value = true
  try {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('Failed to load image from URL'))
      img.src = url
    })
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    canvas.getContext('2d')!.drawImage(img, 0, 0)
    const dataUrl = canvas.toDataURL()
    emit('load', dataUrl)
    urlInput.value = ''
  }
  catch (err: unknown) {
    urlError.value = err instanceof Error ? err.message : 'Failed to load image'
  }
  finally {
    isLoadingUrl.value = false
  }
}
</script>

<template>
  <UCard
    class="relative w-full h-full overflow-hidden transition-colors duration-200 border-2 border-dashed"
    :ui="{ body: 'flex items-center justify-center w-full h-full p-4 sm:p-6' }"
    :class="{
      'border-primary bg-primary/10': isDragging,
      'border-muted': !isDragging,
      'opacity-50 pointer-events-none': disabled,
    }"
    @dragenter="onDragEnter"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop">
    <!-- Hidden real file input -->
    <input
      ref="fileInputRef"
      type="file"
      :accept="accept"
      :disabled="disabled"
      class="sr-only"
      @change="onFileChange">

    <!-- Default slot or built-in drop zone UI -->
    <slot>
      <div class="flex flex-col items-center gap-3 p-8 text-center">
        <div class="w-20 h-20 flex items-center justify-center bg-primary/20 rounded-full">
          <UIcon name="i-lucide-image-up" class="size-12 text-primary" />
        </div>
        <p class="text-lg font-semibold text-default">
          Drop an image here
        </p>
        <p class="text-sm text-muted">
          or
        </p>
        <UButton
          label="Choose File"
          icon="i-lucide-folder-open"
          variant="soft"
          :disabled="disabled"
          @click="fileInputRef?.click()" />

        <!-- URL input -->
        <div class="flex items-center gap-2 w-full max-w-sm">
          <UInput
            v-model="urlInput"
            variant="subtle"
            placeholder="Paste image URL…"
            :disabled="disabled || isLoadingUrl"
            class="w-full"
            @keydown.enter="loadFromUrl">
            <template #trailing>
              <UButton
                v-if="urlInput"
                icon="i-lucide-arrow-right"
                variant="ghost"
                size="xs"
                :loading="isLoadingUrl"
                @click="loadFromUrl" />
            </template>
          </UInput>
        </div>
        <p
          v-if="urlError"
          class="text-xs text-error">
          {{ urlError }}
        </p>
      </div>
    </slot>

    <!-- Drag overlay -->
    <Transition
      enter-active-class="transition-opacity duration-150"
      leave-active-class="transition-opacity duration-150"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0">
      <div
        v-if="isDragging"
        class="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-primary-100/80 dark:bg-primary-900/40 backdrop-blur-sm text-primary-500 text-xl font-semibold rounded-xl pointer-events-none">
        <UIcon name="i-lucide-image-up" class="size-16" />
        <span>Drop to load</span>
      </div>
    </Transition>
  </UCard>
</template>

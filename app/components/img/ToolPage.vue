<script lang="ts" setup>
const props = defineProps<{
  title: string
  description: string
  icon: string
}>()

const emit = defineEmits<{
  (e: 'file-select', file: File): void
}>()

const img = ref<string | null>(null)
const file = ref<File | null>(null)
const fileSize = ref(0)
const fileType = ref('')
const fileInputRef = ref<HTMLInputElement>()

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const selectedFile = target.files?.[0]
  if (selectedFile && selectedFile.type.startsWith('image/')) {
    file.value = selectedFile
    fileSize.value = selectedFile.size
    fileType.value = selectedFile.type
    emit('file-select', selectedFile)

    const reader = new FileReader()
    reader.onload = e => {
      img.value = e.target?.result as string
    }
    reader.readAsDataURL(selectedFile)
  }
}

const triggerFileInput = () => {
  fileInputRef.value?.click()
}
</script>

<template>
  <UMain>
    <UContainer class="py-10 space-y-8">
      <div class="text-center max-w-2xl mx-auto space-y-4">
        <div class="flex items-center justify-center gap-3">
          <UIcon :name="props.icon" class="size-10 text-primary" />
          <h1 class="text-4xl font-bold tracking-tight">
            {{ props.title }}
          </h1>
        </div>
        <p class="text-lg text-muted">
          {{ props.description }}
        </p>
      </div>

      <div v-if="!img" class="flex flex-col items-center justify-center min-h-100 border-2 border-dashed border-muted rounded-2xl bg-elevated/50 p-10 space-y-6">
        <div class="size-20 bg-primary/10 rounded-full flex items-center justify-center text-primary">
          <UIcon name="i-lucide-image-plus" class="size-10" />
        </div>
        <div class="text-center space-y-2">
          <h2 class="text-xl font-semibold">
            Upload an image to start
          </h2>
          <p class="text-muted text-sm">
            PNG, JPG, WebP supported
          </p>
        </div>
        <input
          ref="fileInputRef"
          type="file"
          accept="image/*"
          class="hidden"
          @change="handleFileUpload">
        <UButton
          label="Choose Image"
          icon="i-lucide-upload"
          size="xl"
          @click="triggerFileInput" />
      </div>

      <div v-else class="space-y-6">
        <div class="flex items-center justify-between">
          <UButton
            label="Change Image"
            icon="i-lucide-refresh-cw"
            variant="subtle"
            color="neutral"
            @click="img = null" />
          <slot name="actions" :img="img" />
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div class="lg:col-span-3 bg-black rounded-xl overflow-hidden shadow-2xl relative min-h-150 flex items-center justify-center">
            <slot :img="img" :file="file" :file-size="fileSize" :file-type="fileType" />
          </div>
          <div class="space-y-6">
            <slot name="sidebar" :img="img" :file="file" :file-size="fileSize" :file-type="fileType" />
          </div>
        </div>
      </div>
    </UContainer>
  </UMain>
</template>

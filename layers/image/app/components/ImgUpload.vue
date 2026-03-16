<script setup lang="ts">
import type { ImageEditorContext } from '../types/editor'

const imgEditor = inject<ImageEditorContext>('imgEditor')
const imageUrl = ref('')

const loadFromUrl = () => {
  if (imageUrl.value.trim() && imgEditor) {
    imgEditor.loadImage(imageUrl.value.trim())
    imageUrl.value = ''
  }
}
</script>

<template>
  <UCard>
    <template #header>
      <h3 class="text-lg font-semibold">
        Image Source
      </h3>
    </template>
    <div class="space-y-4">
      <div
        class="group relative flex items-center justify-center p-6 border-2 border-dashed border-muted rounded-xl hover:border-primary transition-all cursor-pointer bg-muted"
        @click="() => imgEditor?.triggerFileInput()">
        <div class="text-center">
          <UIcon name="i-lucide-upload-cloud" class="w-8 h-8 mx-auto text-muted mb-2" />
          <p class="text-sm font-medium text-default">
            Click to upload an image
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <div class="h-px bg-accented flex-1" />
        <span class="text-xs text-muted uppercase font-medium">or</span>
        <div class="h-px bg-accented flex-1" />
      </div>

      <div class="flex gap-2">
        <UInput
          v-model="imageUrl"
          type="url"
          placeholder="Paste image URL..."
          class="flex-1"
          @keyup.enter="loadFromUrl" />
        <UButton
          label="Load"
          color="neutral"
          variant="outline"
          @click="loadFromUrl" />
      </div>
    </div>
  </UCard>
</template>

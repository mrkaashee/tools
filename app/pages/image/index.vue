<script lang="ts" setup>
import { ref } from 'vue'

const img = ref('https://images.pexels.com/photos/4323307/pexels-photo-4323307.jpeg')
const editorRef = ref<any>(null)

const downloadImage = async () => {
  if (editorRef.value) {
    await editorRef.value.applyAndExport('edited-image.png')
  }
}
</script>

<template>
  <div class="h-[calc(100vh-var(--header-top-height,64px))] w-full flex flex-col bg-background">
    <ClientOnly>
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
        restrict-to-bounds
        borderless>
        <template #header>
          <div class="flex items-center justify-between px-4 py-1.5 border-b border-default bg-elevated z-10">
            <div class="flex items-center gap-2">
              <div class="p-1.5 border border-primary/20 bg-primary/10 rounded-lg text-primary">
                <UIcon name="i-lucide-palette" class="size-5" />
              </div>
              <div>
                <h1 class="font-bold tracking-tight text-sm">
                  Image Studio
                </h1>
                <p class="text-[10px] text-muted">
                  Professional all-in-one image editor.
                </p>
              </div>
            </div>

            <div class="flex gap-2">
              <UButton
                v-if="editorRef?.isWorkerProcessing"
                label="Processing..."
                variant="soft"
                color="warning"
                loading
                size="sm" />
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
        </template>
      </ImgStudio>
    </ClientOnly>
  </div>
</template>

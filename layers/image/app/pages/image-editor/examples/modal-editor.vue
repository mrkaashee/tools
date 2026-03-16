<script lang="ts" setup>
import type { ChangeEvent } from '../../types/editor'

const isOpen = ref(false)
const selectedImage = ref<string | null>(null)

const onFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = ev => {
      selectedImage.value = ev.target?.result as string
      isOpen.value = true
      // Reset input so same file can be selected again
      target.value = ''
    }
    reader.readAsDataURL(file)
  }
}

const onChange = (payload: ChangeEvent) => {
  console.log('Modal Editor Changed:', payload)
}

const handleSave = () => {
  isOpen.value = false
  console.log('Modal closed. Final state captured by onChange.')
}
</script>

<template>
  <UMain>
    <UContainer class="py-10">
      <div class="max-w-2xl mx-auto text-center space-y-8">
        <div class="space-y-4">
          <h1 class="text-4xl font-extrabold tracking-tight">
            Modal Profile Editor
          </h1>
          <p class="text-muted text-lg">
            This example demonstrates triggering a DP editor inside a modal only after an image is selected.
          </p>
        </div>

        <!-- Trigger Button -->
        <div class="flex flex-col items-center gap-6 p-12 border-2 border-dashed border-muted rounded-3xl">
          <div class="w-32 h-32 rounded-full bg-elevated flex items-center justify-center shadow-inner border border-default">
            <UIcon name="i-lucide-user" class="w-16 h-16 text-muted" />
          </div>

          <div class="space-y-4">
            <label
              for="avatar-upload"
              class="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl shadow-lg cursor-pointer hover:scale-105 transition-all active:scale-95">
              <UIcon name="i-lucide-upload" class="w-5 h-5" />
              Change Profile Picture
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                class="hidden"
                @change="onFileSelect">
            </label>

            <p class="text-xs text-muted">
              Select an image to open the cropping modal
            </p>
          </div>
        </div>

        <div class="flex justify-center">
          <UButton
            label="← Back to Examples"
            to="/examples"
            variant="ghost"
            color="neutral" />
        </div>

        <UModal v-model:open="isOpen">
          <template #header>
            <!-- Header lives OUTSIDE the canvas box so it doesn't steal canvas height -->
            <div class="w-full flex items-center justify-between shrink-0">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-crop" class="w-5 h-5 text-primary" />
                <h3 class="font-bold">
                  Adjust Avatar
                </h3>
              </div>
              <div class="flex items-center gap-2">
                <UButton
                  label="Cancel"
                  variant="ghost"
                  color="neutral"
                  @click="isOpen = false" />
                <UButton
                  label="Save"
                  color="primary"
                  @click="handleSave" />
              </div>
            </div>
          </template>
          <template #body>
            <div class="flex justify-center items-center bg-black">
              <!-- Exact 400×400 canvas — no header eating into this space -->
              <div class="w-100 h-100 overflow-hidden relative">
                <ImgEditor
                  v-if="selectedImage"
                  :src="selectedImage"
                  fixed-stencil
                  restrict-to-bounds
                  borderless
                  :min-zoom="1"
                  @change="onChange">
                  <template #default="{ editor }">
                    <div class="relative w-full h-full bg-black/95">
                      <CircleStencil
                        v-if="editor.hasImage.value"
                        fixed
                        :crop-percent="100"
                        :output-width="400"
                        :output-height="400" />
                    </div>
                  </template>
                </ImgEditor>
              </div>
            </div>
          </template>
        </UModal>

        <div class="p-4 bg-primary/5 rounded-xl border border-primary/20 text-left">
          <h4 class="font-bold text-sm text-primary mb-2 flex items-center gap-2">
            <UIcon name="i-lucide-info" />
            Developer Note:
          </h4>
          <p class="text-xs text-muted leading-relaxed">
            Upon clicking "Save & Close", the modal is dismissed. The current crop state (canvas, coordinates, etc.) is continuously emitted via <code>@change</code>. Check your browser console to see the logged payloads!
          </p>
        </div>
      </div>
    </UContainer>
  </UMain>
</template>

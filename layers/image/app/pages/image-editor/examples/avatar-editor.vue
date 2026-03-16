<script lang="ts" setup>
import type { ChangeEvent } from '../../types/editor'

const onChange = (payload: ChangeEvent) => {
  console.log('Editor changed:', payload)
}
</script>

<template>
  <UMain>
    <UContainer class="py-10">
      <div class="max-w-4xl mx-auto space-y-6">
        <div class="aspect-square h-160 mx-auto border border-muted rounded-xl overflow-hidden shadow-2xl mb-10 bg-black/5">
          <ImgEditor
            fixed-stencil
            restrict-to-bounds
            :min-zoom="1"
            @change="onChange">
            <!-- Using the new header slot for direct API access -->
            <template #header="{ editor }">
              <div class="flex items-center justify-between p-6">
                <div>
                  <h1 class="text-3xl font-bold text-highlighted mb-2">
                    Avatar Editor
                  </h1>
                  <p class="text-muted text-sm">
                    A high-end avatar cropping experience with strict 256x256 output.
                  </p>
                </div>
                <div class="flex items-center gap-3">
                  <UButton
                    v-if="!editor.hasImage.value"
                    label="Upload Image"
                    icon="i-lucide-upload"
                    color="neutral"
                    variant="subtle"
                    @click="editor.triggerFileInput()" />
                  <UButton
                    v-if="editor.hasImage.value"
                    label="Reset"
                    variant="ghost"
                    color="neutral"
                    @click="editor.resetAll()" />
                  <UButton
                    v-if="editor.hasImage.value"
                    label="Export Avatar"
                    icon="i-lucide-download"
                    color="primary"
                    @click="editor.applyAndExport('avatar.png')" />
                  <UButton label="← Back" to="/examples" variant="ghost" />
                </div>
              </div>
            </template>

            <!-- Fixed center circle mask (fixedStencil) -->
            <template #default="{ editor }">
              <CircleStencil v-if="editor.hasImage.value" fixed :crop-percent="100" :output-width="256" :output-height="256" />
            </template>
          </ImgEditor>
        </div>

        <div class="p-4 bg-info/10 rounded-lg border border-info/30">
          <h4 class="font-medium text-info mb-2">
            Strict Output Dimensions:
          </h4>
          <p class="text-xs text-info/80">
            This page utilizes the `output-width` and `output-height` props on `CircleStencil` to ensure the final exported `avatar.png` is exactly 256x256 pixels, regardless of the uploaded image size or zoom level.
          </p>
        </div>
      </div>
    </UContainer>
  </UMain>
</template>

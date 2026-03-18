<script lang="ts">
import { ref, inject, computed } from 'vue'
import type { AppConfig } from '@nuxt/schema'
import theme from '../utils/themes/img-upload'
import type { ComponentConfig } from '../types/tv'
import type { ImageEditorContext } from '../types/editor'
import { tv } from '../utils/tv'
import { useAppConfig } from '#imports'

export type StudioUpload = ComponentConfig<typeof theme, AppConfig, 'upload'>

export interface StudioUploadProps {
  ui?: StudioUpload['slots']
}
</script>

<script setup lang="ts">
const appConfig = useAppConfig() as StudioUpload['AppConfig']

const props = defineProps<StudioUploadProps>()

const imgStudio = inject<ImageEditorContext>('imgStudio')

const resUI = computed(() => tv({ extend: tv(theme), ...(appConfig.ui?.upload || {}) })({
  ...props.ui,
}))

const imageUrl = ref('')

const loadFromUrl = () => {
  if (imageUrl.value.trim() && imgStudio) {
    imgStudio.loadImage(imageUrl.value.trim())
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
    <div :class="resUI.root()">
      <div
        :class="resUI.dropzone()"
        @click="() => imgStudio?.triggerFileInput()">
        <div :class="resUI.dropzoneContent()">
          <UIcon name="i-lucide-upload-cloud" :class="resUI.dropzoneIcon()" />
          <p :class="resUI.dropzoneText()">
            Click to upload an image
          </p>
        </div>
      </div>

      <div :class="resUI.divider()">
        <div :class="resUI.dividerLine()" />
        <span :class="resUI.dividerText()">or</span>
        <div :class="resUI.dividerLine()" />
      </div>

      <div :class="resUI.urlInputWrapper()">
        <UInput
          v-model="imageUrl"
          type="url"
          placeholder="Paste image URL..."
          :class="resUI.urlInput()"
          @keyup.enter="loadFromUrl" />
        <UButton
          label="Load"
          color="neutral"
          variant="outline"
          :class="resUI.urlButton()"
          @click="loadFromUrl" />
      </div>
    </div>
  </UCard>
</template>

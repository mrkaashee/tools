<script lang="ts" setup>
import { ref, computed } from 'vue'
import type { AspectPreset, CropResult, StudioTool, CropConfig } from '~/components/img/types'
import ImgStudio from '~/components/img/ImgStudio.vue'

// 0. Playground State
const playgroundSrc = ref('https://picsum.photos/id/10/800/600')
const playgroundActiveTool = ref<StudioTool>('crop')
const playgroundCropEnabled = ref(true)
const playgroundCropShape = ref<'rect' | 'round'>('rect')
const playgroundCropFixed = ref(false)
const playgroundCropAspect = ref<string | number | null>(null)
const playgroundZoomEnabled = ref(true)
const playgroundToolbarShow = ref(true)

const aspectOptions = [
  { label: 'Free (null)', value: null },
  { label: 'Square (1:1)', value: 1 },
  { label: 'Video (16:9)', value: 16 / 9 },
  { label: 'Portrait (9:16)', value: 9 / 16 },
  { label: 'Tailwind (aspect-video)', value: 'aspect-video' },
  { label: 'String (3/2)', value: '3/2' }
]

const playgroundCropConfig = computed<CropConfig | boolean>(() =>
  playgroundCropEnabled.value
    ? {
        shape: playgroundCropShape.value,
        fixed: playgroundCropFixed.value,
        aspect: playgroundCropAspect.value,
        presets: presets
      }
    : false
)

const activeTool2 = ref<StudioTool>('crop')
const activeTool3 = ref<StudioTool>('crop')
const activeTool4 = ref<StudioTool>('crop')
const activeTool5 = ref<StudioTool>('crop')
const activeTool6 = ref<StudioTool>('crop')

const src1 = ref('https://picsum.photos/id/237/800/600')
const src2 = ref('https://picsum.photos/id/1015/800/600')
const src3 = ref('https://picsum.photos/id/1025/800/600')
const src4 = ref('https://picsum.photos/id/1035/800/600')
const src6 = ref('https://picsum.photos/id/1045/800/600')

const studio1Ref = ref<InstanceType<typeof ImgStudio>>()

const avatarResult = ref('https://avatars.githubusercontent.com/u/739984?v=4')
const tempAvatarSrc = ref('')
const isAvatarModalOpen = ref(false)
const avatarStudioRef = ref<InstanceType<typeof ImgStudio>>()

const presets: AspectPreset[] = [
  { label: 'Free', value: null },
  { label: 'Square (1:1)', value: 1 },
  { label: 'Video (16:9)', value: 16 / 9 },
  { label: 'Portrait (9:16)', value: 9 / 16 },
  { label: 'Photo (4:3)', value: 4 / 3 }
]

function onCropApply(res: CropResult) {
  console.log('Crop applied')
  console.log('Output data URL:', res.dataUrl.substring(0, 30) + '...')
  console.log('Source Coordinates:', { x: Math.round(res.x), y: Math.round(res.y), width: Math.round(res.width), height: Math.round(res.height) })
}

function onAvatarCropApply(res: CropResult) {
  avatarResult.value = res.dataUrl
  isAvatarModalOpen.value = false
  tempAvatarSrc.value = ''

  console.log('Avatar Crop applied')
  console.log('Source Coordinates:', { x: Math.round(res.x), y: Math.round(res.y), width: Math.round(res.width), height: Math.round(res.height) })
}

function onCropCancel() {
  console.log('Crop cancelled')
}

function onReset() {
  console.log('Studio reset')
}
</script>

<template>
  <UMain>
    <UContainer class="py-10 space-y-6">
      <div>
        <h1 class="text-2xl font-bold mb-2">
          Image Studio Component
        </h1>
        <p class="text-gray-500 mb-6">
          Testing the fresh ImgStudio component root with props, emits, and slots.
        </p>
      </div>
      <!-- 0. Interactive Playground -->
      <UCard :ui="{ body: 'space-y-4' }">
        <h2 class="text-xl font-semibold flex items-center gap-2">
          <UIcon name="i-lucide-flask-conical" class="w-6 h-6 text-primary" />
          0. Interactive Playground
        </h2>

        <UCard :ui="{ body: 'grid grid-cols-2 md:grid-cols-4 gap-4 mb-4' }">
          <UFormGroup label="Enable Cropper">
            <UCheckbox v-model="playgroundCropEnabled" label="Crop Tool" />
          </UFormGroup>
          <UFormGroup label="Shape">
            <USelect v-model="playgroundCropShape" :items="['rect', 'round']" />
          </UFormGroup>
          <UFormGroup label="Fixed Cropper">
            <UCheckbox v-model="playgroundCropFixed" label="Fixed Mode" />
          </UFormGroup>
          <UFormGroup label="Aspect Ratio">
            <USelect v-model="playgroundCropAspect" :items="aspectOptions" value-key="value" />
          </UFormGroup>
          <UFormGroup label="Enable Zoom">
            <UCheckbox v-model="playgroundZoomEnabled" label="Zoom Config" />
          </UFormGroup>
          <UFormGroup label="Show Toolbar">
            <UCheckbox v-model="playgroundToolbarShow" label="Sidebar" />
          </UFormGroup>
        </UCard>

        <ImgStudio
          v-model:src="playgroundSrc"
          v-model:active-tool="playgroundActiveTool"
          :crop="playgroundCropConfig"
          :zoom="playgroundZoomEnabled ? { step: 0.1, max: 5 } : false"
          :toolbar="{ show: playgroundToolbarShow, items: ['crop', 'reset'] }"
          @crop:apply="onCropApply"
          @crop:cancel="onCropCancel"
          @reset="onReset" />
      </UCard>
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <!-- 1. Standard Instance -->
        <div class="space-y-4">
          <h2 class="text-xl font-semibold">
            1. Standard Studio
          </h2>
          <ImgStudio
            ref="studio1Ref"
            v-model:src="src1"
            :crop="{ presets }"
            :zoom="{ step: 0.1, max: 5 }"
            :toolbar="{ show: true, items: ['crop'] }"
            @crop:apply="onCropApply"
            @crop:cancel="onCropCancel"
            @reset="onReset">
            <template #toolbar>
              <div class="text-[0.6rem] text-center text-gray-500 mt-2 mb-1">
                Extras
              </div>
              <UButton icon="i-lucide-wand-2" color="neutral" variant="ghost" square />
              <UButton icon="i-lucide-download" color="neutral" variant="ghost" square @click="studio1Ref?.downloadImage()" />
            </template>
            <template #actions>
              <UButton
                label="Save Standard"
                color="primary"
                variant="solid"
                :disabled="!src1"
                icon="i-lucide-save" />
            </template>
          </ImgStudio>
        </div>

        <!-- 2. Fixed Cropper Instance -->
        <div class="space-y-4">
          <h2 class="text-xl font-semibold">
            2. Fixed 16:9 Cropper
          </h2>
          <ImgStudio
            v-model:src="src2"
            v-model:active-tool="activeTool2"
            :crop="{ aspect: 16 / 9 }"
            :toolbar="{ show: true, items: ['crop'] }"
            @crop:apply="onCropApply"
            @crop:cancel="onCropCancel"
            @reset="onReset">
            <template #actions>
              <UButton
                label="Apply & Save"
                color="primary"
                variant="solid"
                :disabled="!src2"
                icon="i-lucide-check" />
            </template>
          </ImgStudio>
        </div>

        <!-- 3. WhatsApp Profile Picture Style (Draggable) -->
        <div class="space-y-4">
          <h2 class="text-xl font-semibold">
            3. Profile Picture (Draggable)
          </h2>
          <ImgStudio
            v-model:src="src3"
            v-model:active-tool="activeTool3"
            :crop="{ shape: 'round' }"
            :toolbar="{ show: true, items: ['crop'] }"
            @crop:apply="onCropApply"
            @crop:cancel="onCropCancel"
            @reset="onReset">
            <template #actions>
              <UButton
                label="Set Profile Picture"
                color="primary"
                variant="solid"
                :disabled="!src3"
                icon="i-lucide-user" />
            </template>
          </ImgStudio>
        </div>

        <!-- 4. Fixed Circular Cropper (WhatsApp Style) -->
        <div class="space-y-4">
          <h2 class="text-xl font-semibold">
            4. Fixed DP Cropper (WhatsApp)
          </h2>
          <ImgStudio
            v-model:src="src4"
            v-model:active-tool="activeTool4"
            :crop="{ shape: 'round', fixed: true }"
            :toolbar="{ show: true, items: ['crop'] }"
            @crop:apply="onCropApply"
            @crop:cancel="onCropCancel"
            @reset="onReset">
            <template #actions>
              <UButton
                label="Apply Fixed DP"
                color="primary"
                variant="solid"
                :disabled="!src4"
                icon="i-lucide-check-circle" />
            </template>
          </ImgStudio>
        </div>
        <!-- 6. Fixed Square Cropper -->
        <div class="space-y-4">
          <h2 class="text-xl font-semibold">
            6. Fixed Square Cropper
          </h2>
          <ImgStudio
            v-model:src="src6"
            v-model:active-tool="activeTool6"
            :crop="{ aspect: 1, shape: 'rect', fixed: true }"
            :toolbar="{ show: true, items: ['crop'] }"
            @crop:apply="onCropApply"
            @crop:cancel="onCropCancel"
            @reset="onReset" />
        </div>

        <!-- 5. Avatar Uploader (Modal) -->
        <div class="space-y-4 xl:col-span-2 max-w-2xl mx-auto w-full">
          <h2 class="text-xl font-semibold">
            5. Avatar Uploader (Modal)
          </h2>
          <ImgDropZone
            class="min-h-30! border-dashed!"
            @load="file => { tempAvatarSrc = file; isAvatarModalOpen = true }" />

          <UModal v-model:open="isAvatarModalOpen" title="Crop Profile Picture">
            <template #body>
              <ImgStudio
                ref="avatarStudioRef"
                v-model:src="tempAvatarSrc"
                v-model:active-tool="activeTool5"
                class="h-auto! min-h-0! aspect-square w-full"
                :crop="{ shape: 'round', fixed: true, size: 512 }"
                :toolbar="{ show: false, items: ['crop', 'apply', 'cancel', 'reset'] }"
                @crop:apply="onAvatarCropApply"
                @crop:cancel="isAvatarModalOpen = false"
                @reset="onReset" />
            </template>
            <template #footer>
              <div class="flex justify-end gap-3">
                <UButton label="Cancel" color="neutral" variant="ghost" @click="isAvatarModalOpen = false" />
                <UButton
                  label="Apply Avatar"
                  color="primary"
                  variant="solid"
                  :disabled="!tempAvatarSrc"
                  icon="i-lucide-check-circle"
                  @click="avatarStudioRef?.applyCrop()" />
              </div>
            </template>
          </UModal>
        </div>
      </div>
    </UContainer>
  </UMain>
</template>

<script lang="ts" setup>
import ImgEditor from '../../components/ImgEditor.vue'
import CircleStencil from '../../components/CircleStencil.vue'

const fileInput = ref<HTMLInputElement | null>(null)
const imageUrl = ref<string | null>(null)
const editorRef = ref<InstanceType<typeof ImgEditor> | null>(null)
const stencilRef = ref<InstanceType<typeof CircleStencil> | null>(null)

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader()
    reader.onload = e => {
      imageUrl.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

async function handleSave() {
  if (!imageUrl.value || !editorRef.value || !stencilRef.value) return

  // Apply the fixed circular crop to the canvas
  await stencilRef.value.applyFixed()

  // Export the committed canvas as PNG
  const blob = await editorRef.value.exportImage('image/png', 1)
  if (blob) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'avatar.png'
    a.click()
    URL.revokeObjectURL(url)
  }

  // Undo the commit so the user can continue editing their avatar seamlessly
  await editorRef.value.undo()
}
</script>

<template>
  <UMain>
    <UContainer class="py-10">
      <div class="max-w-4xl mx-auto space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-highlighted mb-2">
              Avatar Upload
            </h1>
            <p class="text-muted">
              Upload and position your profile picture
            </p>
          </div>
          <UButton label="← Back" to="/examples" variant="ghost" />
        </div>

        <!-- Main Content -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Editor Section -->
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold">
                Edit Avatar
              </h3>
            </template>

            <div class="space-y-4">
              <!-- Upload Button -->
              <div v-if="!imageUrl" class="text-center py-10">
                <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="handleFileSelect">
                <UButton label="Upload Image" icon="i-heroicons-photo" size="lg" @click="fileInput?.click()" />
                <p class="text-sm text-muted mt-2">
                  Click to select an image
                </p>
              </div>

              <!-- Modular Nuxt-Cropper Editor -->
              <div v-else class="space-y-4">
                <div class="relative bg-muted rounded-lg overflow-hidden border border-default shadow-inner" style="height: 400px;">
                  <ImgEditor ref="editorRef" fixed-stencil :src="imageUrl">
                    <CircleStencil ref="stencilRef" fixed :crop-percent="90" />

                    <!-- Teleport the previews out of the hidden slot! -->
                    <Teleport v-if="editorRef?.hasImage" to="#avatar-previews">
                      <!-- Large Preview -->
                      <div class="flex items-center gap-4 p-4 bg-muted rounded-lg border border-default shadow-sm">
                        <ImgPreview avatar-mode :size="80" />
                        <div>
                          <p class="font-medium text-highlighted">
                            Your Name
                          </p>
                          <p class="text-sm text-muted">
                            Large (80x80)
                          </p>
                        </div>
                      </div>

                      <!-- Medium Preview -->
                      <div class="flex items-center gap-3 p-3 bg-muted rounded-lg mt-3 border border-default shadow-sm">
                        <ImgPreview avatar-mode :size="48" />
                        <div>
                          <p class="text-sm font-medium text-highlighted">
                            Your Name
                          </p>
                          <p class="text-xs text-dimmed">
                            Medium (48x48)
                          </p>
                        </div>
                      </div>

                      <!-- Small Preview -->
                      <div class="flex items-center gap-2 p-2 bg-muted rounded-lg mt-3 border border-default shadow-sm">
                        <ImgPreview avatar-mode :size="32" />
                        <div>
                          <p class="text-xs font-medium text-highlighted">
                            Your Name
                          </p>
                          <p class="text-xs text-dimmed">
                            Small (32x32)
                          </p>
                        </div>
                      </div>
                    </Teleport>
                  </ImgEditor>
                </div>

                <!-- Controls -->
                <div class="flex gap-2">
                  <UButton icon="i-heroicons-magnifying-glass-plus" variant="outline" @click="editorRef?.zoomIn()" />
                  <UButton icon="i-heroicons-magnifying-glass-minus" variant="outline" @click="editorRef?.zoomOut()" />
                  <UButton
                    label="Reset"
                    icon="i-heroicons-arrow-path"
                    variant="outline"
                    class="flex-1"
                    @click="editorRef?.resetZoom()" />
                  <UButton label="Change Image" variant="outline" @click="fileInput?.click()" />
                </div>

                <!-- Action Buttons -->
                <div class="flex gap-2 pt-2">
                  <UButton
                    label="Save Avatar"
                    icon="i-heroicons-check"
                    color="primary"
                    size="lg"
                    block
                    class="shadow-md"
                    @click="handleSave" />
                </div>
              </div>
            </div>
          </UCard>

          <!-- Preview Section -->
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold">
                Preview
              </h3>
            </template>

            <div class="space-y-6">
              <div>
                <p class="text-sm text-muted mb-4">
                  This is how your avatar will appear in different sizes:
                </p>

                <!-- This is where the real-time exact previews teleport to -->
                <div id="avatar-previews">
                  <div v-if="!imageUrl" class="space-y-3">
                    <div class="flex items-center gap-4 p-4 bg-muted rounded-lg">
                      <div class="w-20 h-20 rounded-full bg-inverted/10 flex items-center justify-center shrink-0">
                        <UIcon name="i-heroicons-user" class="w-10 h-10 text-muted" />
                      </div>
                      <div>
                        <p class="font-medium text-highlighted">
                          Your Name
                        </p>
                        <p class="text-sm text-muted">
                          Large (80x80)
                        </p>
                      </div>
                    </div>

                    <div class="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <div class="w-12 h-12 rounded-full bg-inverted/10 flex items-center justify-center shrink-0">
                        <UIcon name="i-heroicons-user" class="w-6 h-6 text-muted" />
                      </div>
                      <div>
                        <p class="text-sm font-medium text-highlighted">
                          Your Name
                        </p>
                        <p class="text-xs text-dimmed">
                          Medium (48x48)
                        </p>
                      </div>
                    </div>

                    <div class="flex items-center gap-2 p-2 bg-muted rounded-lg">
                      <div class="w-8 h-8 rounded-full bg-inverted/10 flex items-center justify-center shrink-0">
                        <UIcon name="i-heroicons-user" class="w-4 h-4 text-muted" />
                      </div>
                      <div>
                        <p class="text-xs font-medium text-highlighted">
                          Your Name
                        </p>
                        <p class="text-xs text-dimmed">
                          Small (32x32)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Instructions -->
              <div class="p-4 bg-info/10 rounded-lg border border-info/30">
                <h4 class="font-medium text-info mb-2">
                  How to use:
                </h4>
                <ul class="text-sm text-info/80 space-y-1">
                  <li>• Upload an image using the button</li>
                  <li>• Drag the image to reposition it</li>
                  <li>• Scroll or use zoom buttons to resize</li>
                  <li>• Only the area inside the circle will be saved</li>
                  <li>• Click "Save Avatar" to download</li>
                </ul>
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </UContainer>
  </UMain>
</template>

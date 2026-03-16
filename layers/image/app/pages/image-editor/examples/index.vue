<script lang="ts" setup>
</script>

<template>
  <UMain>
    <UContainer class="py-10">
      <div class="space-y-8">
        <div class="text-center">
          <h1 class="text-4xl font-bold text-highlighted mb-2">
            Examples
          </h1>
          <p class="text-muted">
            Real-world examples and use cases for the image editor
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <UCard class="border-2 border-primary">
            <template #header>
              <div class="flex items-center gap-2">
                <span class="text-2xl">👤</span>
                <div class="flex-1">
                  <h3 class="text-lg font-semibold">
                    Avatar Upload (Custom)
                  </h3>
                </div>
              </div>
            </template>
            <p class="text-sm text-muted mb-4">
              WhatsApp-style avatar editor built with raw HTML Canvas and drag-to-reposition functionality.
            </p>
            <UButton label="Try Example" to="/examples/avatar" color="neutral" variant="soft" block />
          </UCard>

          <UCard class="border-2 border-accented">
            <template #header>
              <div class="flex items-center gap-2">
                <span class="text-2xl">✨</span>
                <div class="flex-1">
                  <h3 class="text-lg font-semibold">
                    Avatar Editor (ImgEditor)
                  </h3>
                  <span class="text-xs bg-accented/10 text-primary px-2 py-0.5 rounded-full">New Framework</span>
                </div>
              </div>
            </template>
            <p class="text-sm text-muted mb-4">
              A streamlined avatar creation workflow utilizing the built-in <code>ImgEditor</code> and <code>Stencil</code> layer system.
            </p>
            <UButton label="Try Editor Mode" to="/examples/avatar-editor" color="primary" block />
          </UCard>

          <UCard class="border-2 border-accented">
            <template #header>
              <div class="flex items-center gap-2">
                <span class="text-2xl">🖼️</span>
                <div class="flex-1">
                  <h3 class="text-lg font-semibold">
                    Banner / Slider Editor
                  </h3>
                  <span class="text-xs bg-accented/10 text-primary px-2 py-0.5 rounded-full">New</span>
                </div>
              </div>
            </template>
            <p class="text-sm text-muted mb-4">
              Drag-to-reposition a banner image inside a fixed 16:9 (or custom) ratio crop window — perfect for covers and sliders.
            </p>
            <UButton label="Try Banner Editor" to="/examples/banner-editor" color="primary" block />
          </UCard>

          <UCard class="border-2 border-accented">
            <template #header>
              <div class="flex items-center gap-2">
                <span class="text-2xl">📦</span>
                <div class="flex-1">
                  <h3 class="text-lg font-semibold">
                    Modal DP Editor
                  </h3>
                  <span class="text-xs bg-accented/10 text-primary px-2 py-0.5 rounded-full">New</span>
                </div>
              </div>
            </template>
            <p class="text-sm text-muted mb-4">
              Profile picture cropping inside a modal workflow — triggered only after image selection.
            </p>
            <UButton label="Try Modal Editor" to="/examples/modal-editor" color="primary" block />
          </UCard>

          <UCard class="opacity-50">
            <template #header>
              <div class="flex items-center gap-2">
                <span class="text-2xl">📸</span>
                <div class="flex-1">
                  <h3 class="text-lg font-semibold">
                    Photo Collage
                  </h3>
                  <span
                    class="text-xs bg-muted text-dimmed px-2 py-0.5 rounded-full">Coming
                    Soon</span>
                </div>
              </div>
            </template>
            <p class="text-sm text-muted mb-4">
              Combine multiple images into beautiful collages with various layouts.
            </p>
            <UButton label="Coming Soon" disabled block />
          </UCard>
        </div>

        <div class="flex justify-center mt-8">
          <UButton label="← Back to Home" to="/" variant="ghost" />
        </div>
      </div>
    </UContainer>
  </UMain>
</template>

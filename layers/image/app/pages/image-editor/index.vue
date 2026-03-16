<script lang="ts" setup>
definePageMeta({ layout: false })
</script>

<template>
  <UMain>
    <UContainer class="py-10">
      <div class="space-y-8">
        <div class="text-center">
          <h1 class="text-4xl font-bold text-highlighted mb-2">
            Image Editor Tools
          </h1>
          <p class="text-muted">
            Professional image editing tools built with Vue 3 and Nuxt
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <UCard class="border-2 border-primary">
            <template #header>
              <div class="flex items-center gap-2">
                <span class="text-2xl">🎨</span>
                <div class="flex-1">
                  <h3 class="text-lg font-semibold">
                    Unified Editor
                  </h3>
                  <span
                    class="text-xs bg-info/10 text-info px-2 py-0.5 rounded-full">New</span>
                </div>
              </div>
            </template>
            <p class="text-sm text-muted mb-4">
              All-in-one editor with undo/redo, history, and multiple tools in a unified interface.
            </p>
            <UButton label="Open Editor" to="/editor" color="primary" block />
          </UCard>

          <UCard>
            <template #header>
              <div class="flex items-center gap-2">
                <span class="text-2xl">✂️</span>
                <h3 class="text-lg font-semibold">
                  Cropper
                </h3>
              </div>
            </template>
            <p class="text-sm text-muted mb-4">
              Crop images with multiple modes: move-box, move-image, fixed, and circle shapes with zoom support.
            </p>
            <UButton label="Open Tool" to="/cropper" block />
          </UCard>

          <UCard>
            <template #header>
              <div class="flex items-center gap-2">
                <span class="text-2xl">🔄</span>
                <h3 class="text-lg font-semibold">
                  Transformations
                </h3>
              </div>
            </template>
            <p class="text-sm text-muted mb-4">
              Rotate and flip images with smooth animations. All transformations are applied to exports.
            </p>
            <UButton label="Open Tool" to="/transformations" block />
          </UCard>

          <UCard>
            <template #header>
              <div class="flex items-center gap-2">
                <span class="text-2xl">✨</span>
                <h3 class="text-lg font-semibold">
                  Filters
                </h3>
              </div>
            </template>
            <p class="text-sm text-muted mb-4">
              Apply professional filters like grayscale, sepia, vintage, and more with manual adjustments.
            </p>
            <UButton label="Open Tool" to="/filters" block />
          </UCard>

          <UCard>
            <template #header>
              <div class="flex items-center gap-2">
                <span class="text-2xl">🎨</span>
                <h3 class="text-lg font-semibold">
                  Adjustments
                </h3>
              </div>
            </template>
            <p class="text-sm text-muted mb-4">
              Fine-tune exposure, highlights, shadows, temperature, tint, and vibrance for perfect results.
            </p>
            <UButton label="Open Tool" to="/adjustments" block />
          </UCard>

          <UCard>
            <template #header>
              <div class="flex items-center gap-2">
                <span class="text-2xl">📐</span>
                <h3 class="text-lg font-semibold">
                  Resize
                </h3>
              </div>
            </template>
            <p class="text-sm text-muted mb-4">
              Scale images to custom dimensions, percentages, or popular social media presets.
            </p>
            <UButton label="Open Tool" to="/resize" block />
          </UCard>

          <UCard>
            <template #header>
              <div class="flex items-center gap-2">
                <span class="text-2xl">🗜️</span>
                <h3 class="text-lg font-semibold">
                  Compress
                </h3>
              </div>
            </template>
            <p class="text-sm text-muted mb-4">
              Reduce file size while maintaining quality. Choose format and compression level.
            </p>
            <UButton label="Open Tool" to="/compress" block />
          </UCard>

          <UCard>
            <template #header>
              <div class="flex items-center gap-2">
                <span class="text-2xl">🔀</span>
                <h3 class="text-lg font-semibold">
                  Convert
                </h3>
              </div>
            </template>
            <p class="text-sm text-muted mb-4">
              Convert images between PNG, JPEG, and WebP formats with quality control.
            </p>
            <UButton label="Open Tool" to="/convert" block />
          </UCard>

          <UCard class="border-2 border-success">
            <template #header>
              <div class="flex items-center gap-2">
                <span class="text-2xl">💡</span>
                <div class="flex-1">
                  <h3 class="text-lg font-semibold">
                    Examples
                  </h3>
                  <span
                    class="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full">New</span>
                </div>
              </div>
            </template>
            <p class="text-sm text-muted mb-4">
              Real-world examples like avatar upload, social media posts, and more use cases.
            </p>
            <UButton label="View Examples" to="/examples" color="success" block />
          </UCard>
        </div>

        <!-- Features Section -->
        <div
          class="mt-12 p-8 bg-info/5 rounded-2xl border border-info/30">
          <h2 class="text-2xl font-bold text-highlighted mb-4">
            Features
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-default">
            <div class="flex items-start gap-2">
              <span class="text-success">✓</span>
              <span>Client-side processing - your images never leave your browser</span>
            </div>
            <div class="flex items-start gap-2">
              <span class="text-success">✓</span>
              <span>Real-time preview with smooth animations</span>
            </div>
            <div class="flex items-start gap-2">
              <span class="text-success">✓</span>
              <span>Dark mode support throughout</span>
            </div>
            <div class="flex items-start gap-2">
              <span class="text-success">✓</span>
              <span>Responsive design for all devices</span>
            </div>
            <div class="flex items-start gap-2">
              <span class="text-success">✓</span>
              <span>High-quality exports with all edits applied</span>
            </div>
            <div class="flex items-start gap-2">
              <span class="text-success">✓</span>
              <span>Built with Vue 3, Nuxt, and TypeScript</span>
            </div>
          </div>
        </div>
      </div>
    </UContainer>
  </UMain>
</template>

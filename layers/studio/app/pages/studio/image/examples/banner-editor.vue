<script lang="ts" setup>
</script>

<template>
  <UMain>
    <UContainer class="py-10">
      <div class="max-w-5xl mx-auto space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-highlighted mb-2">
              Banner / Slider Editor
            </h1>
            <p class="text-muted">
              Drag and zoom your image behind a fixed 16:9 crop window — like setting a cover photo.
            </p>
          </div>
          <UButton label="← Back" to="/studio/image/examples" variant="ghost" />
        </div>

        <!-- Editor: tall enough to give the 16:9 mask room to breathe -->
        <div class="h-120 border border-muted rounded-xl overflow-hidden shadow-2xl">
          <ImgStudio
            fixed-stencil
            src="https://images.pexels.com/photos/3183153/pexels-photo-3183153.jpeg"
            :cropper="{ shape: 'rect', aspectRatio: 16 / 9, cropPercent: 88 }">
            <ImgStudioToolbar>
              <template #right>
                <ImgActionButtons filename="banner.png" />
              </template>
            </ImgStudioToolbar>

            <!-- Upload from file / URL -->
            <ImgUpload />
          </ImgStudio>
        </div>

        <!-- Common ratios quick-reference -->
        <div class="grid grid-cols-3 gap-4 text-center text-sm">
          <div class="p-3 rounded-lg bg-muted/50">
            <p class="font-semibold text-highlighted">
              16 : 9
            </p>
            <p class="text-xs text-muted mt-1">
              YouTube / Desktop Banner
            </p>
          </div>
          <div class="p-3 rounded-lg bg-muted/50">
            <p class="font-semibold text-highlighted">
              2.67 : 1
            </p>
            <p class="text-xs text-muted mt-1">
              Slider (1280×480)
            </p>
          </div>
          <div class="p-3 rounded-lg bg-muted/50">
            <p class="font-semibold text-highlighted">
              3 : 1
            </p>
            <p class="text-xs text-muted mt-1">
              Twitter Header
            </p>
          </div>
        </div>

        <div class="p-4 bg-info/10 rounded-lg border border-info/30">
          <h4 class="font-medium text-info mb-2">
            Zero-Logic Page:
          </h4>
          <p class="text-xs text-info/80">
            Pass <code>fixed shape="rect"</code> and <code>:aspect-ratio="16/9"</code> to
            <code>CircleStencil</code> — the mask auto-fits to your viewport and the
            crop math handles the rest.
          </p>
        </div>
      </div>
    </UContainer>
  </UMain>
</template>

<script lang="ts" setup>
const img = 'https://images.pexels.com/photos/4323307/pexels-photo-4323307.jpeg'

const examples = [
  {
    title: 'Standard Controls',
    description: 'Full rotation and flip functionality.',
    props: { }
  },
  {
    title: 'Headless Preview',
    description: 'Using custom triggers for rotation.',
    headless: true
  }
]
</script>

<template>
  <UDashboardPanel grow>
    <template #body>
      <div class="mb-8">
        <h1 class="text-3xl font-bold tracking-tight text-highlighted mb-2">
          Transformations
        </h1>
        <p class="text-muted text-sm">
          Rotate and flip images with precision.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <UCard
          class="overflow-hidden border-muted shadow-sm">
          <template #header>
            <h3 class="text-base font-semibold text-highlighted">
              Default Transform UI
            </h3>
          </template>

          <div class="aspect-video relative rounded-lg overflow-hidden border border-muted bg-default mb-4">
            <ClientOnly>
              <ImgStudio
                :src="img"
                mode="canvas"
                :active-tool="'transform'"
                class="w-full h-full">
                <template #toolbar>
                  <div class="p-4">
                    <ImgTransform />
                  </div>
                </template>
              </ImgStudio>
            </ClientOnly>
          </div>

          <p class="text-xs text-muted">
            The standard UI provides 90-degree rotations and horizontal/vertical mirroring.
          </p>
        </UCard>

        <UCard
          class="overflow-hidden border-muted shadow-sm">
          <template #header>
            <h3 class="text-base font-semibold text-highlighted">
              Custom/Headless Implementation
            </h3>
          </template>

          <div class="aspect-video relative rounded-lg overflow-hidden border border-muted bg-default mb-4">
            <ClientOnly>
              <ImgStudio
                ref="studio"
                :src="img"
                mode="canvas"
                class="w-full h-full">
                <template #toolbar>
                  <ImgTransform v-slot="{ rotate, flipHorizontal }" headless>
                    <div class="p-4 flex gap-2">
                      <UButton label="Rotate Left" icon="i-lucide-rotate-ccw" size="xs" @click="rotate(-90)" />
                      <UButton label="Flip X" icon="i-lucide-flip-horizontal" size="xs" @click="flipHorizontal" />
                    </div>
                  </ImgTransform>
                </template>
              </ImgStudio>
            </ClientOnly>
          </div>

          <p class="text-xs text-muted">
            Using the <code>headless</code> prop to build custom transformation controls via slots.
          </p>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>

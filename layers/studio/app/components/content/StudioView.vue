<script setup lang="ts">
const props = defineProps<{
  name?: 'grid' | 'editor' | 'cropper' | 'transform' | 'transformations' | 'filters' | 'adjustments' | 'resize' | 'compress' | 'convert' | 'zoom-demo' | 'example-grid' | 'avatar-custom' | 'avatar-editor' | 'banner-editor' | 'modal-editor' | 'img-studio' | 'img-cropper' | ''
  src?: string
  // For grids
  tools?: any[]
  examples?: any[]
  // For specific tool overrides
  props?: any
}>()

const { tools: allTools } = useToolsList()

// Filter tools for the 'Image' category if name is 'grid'
const imageTools = computed(() => {
  return allTools.filter(t => t.category.label === 'Image')
})

// Specific ImgStudio prop sets based on 'name'
const resolvedProps = computed(() => {
  const base = {
    src: props.src || 'https://images.pexels.com/photos/4323307/pexels-photo-4323307.jpeg',
    ...props.props
  }

  const toolConfigs: Record<string, any> = {
    editor: {
      censor: true,
      annotate: true,
      aspect: true,
      layers: true,
      cropper: true,
      filter: true,
      transform: true,
      resize: true,
      preview: true
    },
    cropper: {
      cropper: true,
      activeTool: 'cropper'
    },
    transform: {
      transform: true,
      activeTool: 'transform'
    },
    transformations: {
      transform: true,
      activeTool: 'transform'
    },
    filters: {
      filter: true,
      activeTool: 'filter'
    },
    adjustments: {
      filter: true, // Adjustments are part of filters in the current ImgStudio
      activeTool: 'filter'
    },
    resize: {
      resize: true,
      activeTool: 'resize'
    },
    compress: {
      resize: true, // Currently handled by resize/export in ImgStudio
      activeTool: 'resize'
    },
    convert: {
      resize: true,
      activeTool: 'resize'
    },
    'zoom-demo': {
      cropper: true,
      activeTool: 'cropper'
    },
    'avatar-editor': {
      cropper: { shape: 'circle', initialCropPercent: 100 },
      stencil: { fixed: true },
      activeTool: 'cropper'
    },
    'banner-editor': {
      cropper: { aspectRatio: 16 / 9, initialCropPercent: 88 },
      stencil: { fixed: true },
      activeTool: 'cropper'
    },
    'img-studio': {
      censor: true,
      annotate: true,
      aspect: true,
      layers: true,
      cropper: true,
      filter: true,
      transform: true,
      resize: true,
      preview: true
    },
    'img-cropper': {
      cropper: true,
      activeTool: 'cropper'
    }
  }

  return { ...(toolConfigs[props.name || ''] || {}), ...base }
})
</script>

<template>
  <div class="studio-view w-full h-full min-w-0 overflow-hidden">
    <!-- Tools Grid -->
    <div v-if="name === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-6">
      <UCard v-for="tool in (tools || imageTools)" :key="tool.label" class="hover:ring-2 hover:ring-primary-500/50 transition-all cursor-pointer" @click="navigateTo(tool.to)">
        <template #header>
          <div class="flex items-center gap-3">
            <UIcon :name="tool.icon" class="w-6 h-6 text-primary" />
            <span class="font-bold">{{ tool.label }}</span>
          </div>
        </template>
        <p class="text-sm text-muted">
          {{ tool.description }}
        </p>
      </UCard>
    </div>

    <!-- Examples Grid -->
    <div v-else-if="name === 'example-grid'" class="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
      <UCard v-for="example in examples" :key="example.title" class="hover:ring-2 hover:ring-primary-500/50 transition-all cursor-pointer" @click="navigateTo(example.to)">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="text-2xl">{{ example.icon }}</span>
              <span class="font-bold">{{ example.title }}</span>
            </div>
            <UBadge v-if="example.badge" size="xs" variant="subtle">
              {{ example.badge }}
            </UBadge>
          </div>
        </template>
        <p class="text-sm text-muted">
          {{ example.description }}
        </p>
      </UCard>
    </div>

    <!-- Actual Tool (ImgStudio) -->
    <div v-else class="relative w-full aspect-square max-h-160 border border-muted rounded-xl overflow-hidden shadow-2xl bg-black/5">
      <ImgStudio v-bind="{ ...resolvedProps, ...$attrs }" class="absolute inset-0 w-full h-full" />
    </div>
  </div>
</template>

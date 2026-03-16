<script lang="ts" setup>
const { tools } = useToolsList()

const categories = computed(() => {
  const map = new Map<string, typeof tools>()
  for (const tool of tools) {
    const cat = tool.category.label
    if (!map.has(cat)) map.set(cat, [])
    map.get(cat)!.push(tool)
  }
  return map
})

const selectedCategory = ref<string | null>(null)

const filteredCategories = computed(() => {
  if (!selectedCategory.value) return categories.value
  const entry = categories.value.get(selectedCategory.value)
  return entry ? new Map([[selectedCategory.value, entry]]) : categories.value
})

const statusConfig = {
  active: { color: 'success' as const, label: 'Active' },
  pending: { color: 'warning' as const, label: 'Pending' },
  planned: { color: 'info' as const, label: 'Planned' },
  proposed: { color: 'neutral' as const, label: 'Proposed' },
}
</script>

<template>
  <UMain>
    <UContainer class="py-10 space-y-12">
      <div class="flex flex-wrap justify-center gap-4">
        <UButton
          label="All"
          icon="i-lucide-layout-grid"
          color="neutral"
          :variant="selectedCategory === null ? 'solid' : 'subtle'"
          @click="selectedCategory = null" />
        <UButton
          v-for="[category, categoryTools] in categories"
          :key="category"
          :icon="categoryTools[0]!.category.icon"
          :label="category"
          color="neutral"
          :variant="selectedCategory === category ? 'solid' : 'subtle'"
          @click="selectedCategory = category" />
      </div>
      <div v-for="[category, categoryTools] in filteredCategories" :key="category">
        <div class="flex items-center gap-2 mb-6">
          <UIcon :name="categoryTools[0]!.category.icon" class="size-5 text-primary" />
          <h2 class="text-lg font-semibold">
            {{ category }}
          </h2>
          <UBadge :label="categoryTools.length.toString()" variant="soft" size="sm" />
        </div>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <UPageCard
            v-for="tool in categoryTools"
            :key="tool.label"
            :icon="tool.icon"
            :title="tool.label"
            :description="tool.description"
            :to="tool.to"
            variant="subtle">
            <template #footer>
              <div class="flex items-center gap-2">
                <UBadge :label="category" color="neutral" variant="subtle" />
                <UBadge
                  :label="statusConfig[tool.status].label"
                  :color="statusConfig[tool.status].color"
                  variant="subtle" />
              </div>
            </template>
          </UPageCard>
        </div>
      </div>
    </UContainer>
  </UMain>
</template>

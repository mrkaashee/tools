<script lang="ts" setup>
const { tools } = useToolsList()
</script>

<template>
  <UMain>
    <UContainer class="py-4 sm:py-6 lg:py-8">
      <UPageGrid>
        <UPageCard
          v-for="(tool, index) in tools"
          :key="index"
          :icon="tool.icon"
          :title="tool.label"
          :description="tool.description" />
      </UPageGrid>
    </UContainer>
  </UMain>
</template>

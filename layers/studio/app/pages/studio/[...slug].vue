<script setup lang="ts">
const route = useRoute()
const { data: page } = await useAsyncData(route.path, () => {
  return queryCollection('content').path(route.path).first()
})
</script>

<template>
  <UDashboardPanel grow>
    <template #body>
      <ContentRenderer v-if="page" :value="page" />
      <div v-else class="flex flex-col items-center justify-center h-full space-y-4">
        <UIcon name="i-lucide-file-warning" class="w-12 h-12 text-muted" />
        <h2 class="text-xl font-semibold text-highlighted">
          Page Not Found
        </h2>
        <p class="text-muted text-sm">
          The requested path <code>{{ route.path }}</code> does not exist.
        </p>
        <UButton label="Go to Image Studio" to="/studio/image" color="primary" variant="soft" />
      </div>
    </template>
  </UDashboardPanel>
</template>

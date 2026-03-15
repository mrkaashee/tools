<script lang="ts" setup>
const { links } = useNavigation()
</script>

<template>
  <UHeader title="Tools">
    <UNavigationMenu :items="links" />
    <template #right>
      <UColorModeButton />
    </template>
    <template #bottom>
      <USeparator class="hidden lg:flex" />
      <UContainer class="hidden lg:flex items-center justify-between">
        <!-- <UNavigationMenu :items="links" class="-mx-2.5 -mb-px" /> -->
      </UContainer>
    </template>
  </UHeader>
</template>

<script lang="ts" setup>
const { links } = useNavigation()
</script>

<template>
  <UHeader title="Tools">
    <UNavigationMenu :items="links" />
    <template #right>
      <UColorModeButton />
    </template>
  </UHeader>
</template>

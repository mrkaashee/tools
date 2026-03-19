<script setup lang="ts">
const route = useRoute()

const { data: navigation } = await useAsyncData('navigation', () => queryCollectionNavigation('content'))
console.log('navigation', navigation.value)

const rootNavigation = computed(() =>
  navigation.value
    ?.find(ni => ni.path.startsWith('/studio'))
    ?.children?.filter(ni => ni.path != '/studio')
)
console.log('rootNavigation', rootNavigation.value)
</script>

<template>
  <UMain>
    <AppHeader />
    <UContainer>
      <UPage>
        <template #left>
          <UPageAside>
            <UContentNavigation
              :key="route.path"
              :collapsible="false"
              :navigation="rootNavigation"
              highlight
              :ui="{ linkTrailingBadge: 'font-semibold uppercase' }" />
          </UPageAside>
        </template>
        <slot />
      </UPage>
    </UContainer>
  </UMain>
</template>

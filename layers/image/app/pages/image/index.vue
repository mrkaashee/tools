<script lang="ts" setup>
import { useToolsList } from '~/composables/useToolsList'

const { tools } = useToolsList()
const imageTools = computed(() => tools.filter(t => t.category.label === 'Image'))
</script>

<template>
  <UMain>
    <div class="relative py-16 mb-10 overflow-hidden bg-neutral-900 ring-1 ring-white/10">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(var(--color-primary-500),0.15),transparent)] pointer-events-none" />
      <UContainer>
        <div class="max-w-2xl">
          <UBadge
            label="Image Tools"
            variant="subtle"
            color="primary"
            class="mb-4" />
          <h1 class="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
            Image <span class="text-primary-500">Tools</span>
          </h1>
          <p class="text-lg text-neutral-400 leading-relaxed">
            A professional suite of browser-based image tools — no uploads, no servers, fully private.
          </p>
        </div>
      </UContainer>
    </div>

    <UContainer class="pb-20">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <template
          v-for="tool in imageTools"
          :key="tool.label">
          <NuxtLink
            v-if="tool.to"
            :to="tool.to"
            class="group block">
            <UCard class="h-full transition-all duration-200 group-hover:scale-[1.02] group-hover:shadow-lg border-neutral-200/60 dark:border-neutral-800">
              <div class="flex items-start gap-4">
                <div class="p-2.5 rounded-xl bg-primary-100 dark:bg-primary-900/40 text-primary shrink-0">
                  <UIcon
                    :name="tool.icon"
                    class="w-5 h-5" />
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="font-bold text-sm truncate">{{ tool.label }}</span>
                    <UBadge
                      label="Live"
                      color="primary"
                      variant="subtle"
                      size="sm" />
                  </div>
                  <p class="text-xs text-neutral-500 leading-relaxed line-clamp-2">
                    {{ tool.description }}
                  </p>
                </div>
              </div>
            </UCard>
          </NuxtLink>

          <div
            v-else
            class="block opacity-60 cursor-not-allowed">
            <UCard class="h-full border-neutral-200/40 dark:border-neutral-800/40 bg-neutral-50/50 dark:bg-neutral-900/20">
              <div class="flex items-start gap-4">
                <div class="p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/50 text-neutral-400 shrink-0">
                  <UIcon
                    :name="tool.icon"
                    class="w-5 h-5" />
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="font-bold text-sm truncate text-neutral-500">{{ tool.label }}</span>
                    <UBadge
                      label="Proposed"
                      color="neutral"
                      variant="subtle"
                      size="sm" />
                  </div>
                  <p class="text-xs text-neutral-400 leading-relaxed line-clamp-2">
                    {{ tool.description }}
                  </p>
                </div>
              </div>
            </UCard>
          </div>
        </template>
      </div>
    </UContainer>
  </UMain>
</template>

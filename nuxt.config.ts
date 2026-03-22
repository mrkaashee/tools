// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  extends: [
    './layers/image',
  ],
  modules: [
    '@nuxt/ui',
    '@nuxt/eslint',
    '@nuxt/hints',
    '@nuxt/image'
  ],
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  ui: {
    content: true,
    experimental: { componentDetection: true }
  },
  compatibilityDate: '2026-03-15',
  eslint: { config: { stylistic: true } },
})

import type { NavigationMenuItem } from '@nuxt/ui'

export const useNavigation = () => {
  const links: NavigationMenuItem[] = [
    {
      icon: 'i-lucide-newspaper',
      label: 'Docs',
      to: '/docs',
    },
  ]
  return { links }
}

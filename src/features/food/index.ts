import type { ExperienceDefinition } from '@/engine'
import { coveringRadius } from '@/engine'
import { FoodLogo } from './brand/FoodLogo'
import { FoodDishCard } from './components/DishCard'
import { foodDomain } from './domain'
import { manifest } from './manifest'
import { FoodShell } from './shell/FoodShell'

export const definition: ExperienceDefinition = {
  id: manifest.id,
  brand: { ...manifest, Logo: FoodLogo },
  theme: { themeColor: '#fff6e9' },
  fonts: [
    {
      href: 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=DM+Sans:opsz,wght@9..40,400..700&display=swap',
    },
  ],
  capabilities: new Set(['customization', 'nutritionInfo', 'fulfillmentMode', 'openingHours']),
  shell: FoodShell,
  slots: { ProductCard: FoodDishCard },
  routes: [
    {
      index: true,
      lazy: { Component: async () => (await import('./pages/HomePage')).HomePage },
    },
    {
      path: 'menu',
      lazy: { Component: async () => (await import('./pages/MenuPage')).MenuPage },
    },
    {
      path: 'plato/:id',
      lazy: { Component: async () => (await import('./pages/DishPage')).DishPage },
    },
    {
      path: 'checkout',
      lazy: { Component: async () => (await import('./pages/CheckoutPage')).CheckoutPage },
    },
    {
      path: 'pedido/:orderId',
      lazy: {
        Component: async () => (await import('./pages/ConfirmationPage')).ConfirmationPage,
      },
    },
  ],
  domain: foodDomain,
  motion: {
    // A round "plate" of the new brand bursts from the pointer with a springy overshoot.
    switchIn: {
      duration: 700,
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      enter: (origin, viewport) => [
        { clipPath: `circle(0px at ${String(origin.x)}px ${String(origin.y)}px)` },
        {
          clipPath: `circle(${String(coveringRadius(origin, viewport))}px at ${String(origin.x)}px ${String(origin.y)}px)`,
        },
      ],
    },
  },
}

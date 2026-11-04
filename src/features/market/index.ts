import type { ExperienceDefinition } from '@/engine'
import { MarketLogo } from './brand/MarketLogo'
import { MarketProductCard } from './components/ProductCard'
import { marketDomain } from './domain'
import { manifest } from './manifest'
import { MarketShell } from './shell/MarketShell'

export const definition: ExperienceDefinition = {
  id: manifest.id,
  brand: { ...manifest, Logo: MarketLogo },
  theme: { themeColor: '#f5f7fa' },
  fonts: [
    {
      href: 'https://fonts.googleapis.com/css2?family=Archivo:wght@400..800&family=JetBrains+Mono:wght@400;600&display=swap',
    },
  ],
  capabilities: new Set(['facetedFilters', 'compare', 'reviews', 'deals', 'wishlist']),
  shell: MarketShell,
  slots: { ProductCard: MarketProductCard },
  routes: [
    {
      index: true,
      lazy: { Component: async () => (await import('./pages/HomePage')).HomePage },
    },
    {
      path: 'buscar',
      lazy: { Component: async () => (await import('./pages/ListingPage')).ListingPage },
    },
    {
      path: 'departamento/:departmentId',
      lazy: { Component: async () => (await import('./pages/ListingPage')).ListingPage },
    },
    {
      path: 'producto/:id',
      lazy: { Component: async () => (await import('./pages/ProductPage')).ProductPage },
    },
    {
      path: 'comparar',
      lazy: { Component: async () => (await import('./pages/ComparePage')).ComparePage },
    },
    {
      path: 'favoritos',
      lazy: { Component: async () => (await import('./pages/WishlistPage')).WishlistPage },
    },
    {
      path: 'carrito',
      lazy: { Component: async () => (await import('./pages/CartPage')).CartPage },
    },
    {
      path: 'checkout',
      lazy: { Component: async () => (await import('./pages/CheckoutPage')).CheckoutPage },
    },
    {
      path: 'confirmacion/:orderId',
      lazy: { Component: async () => (await import('./pages/ConfirmationPage')).ConfirmationPage },
    },
  ],
  domain: marketDomain,
  motion: {
    // A crisp shelf-wipe from the right; the old page slides out. Fast, no flourish.
    switchIn: {
      duration: 280,
      easing: 'cubic-bezier(0.2, 0, 0, 1)',
      enter: () => [{ clipPath: 'inset(0 0 0 100%)' }, { clipPath: 'inset(0 0 0 0)' }],
      exit: () => [{ transform: 'translateX(0)' }, { transform: 'translateX(-12%)' }],
    },
  },
}

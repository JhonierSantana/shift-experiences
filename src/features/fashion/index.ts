import type { ExperienceDefinition } from '@/engine'
import { FashionLogo } from './brand/FashionLogo'
import { FashionNotFound } from './components/FashionNotFound'
import { FashionProductCard } from './components/ProductCard'
import { fashionDomain } from './domain'
import { manifest } from './manifest'
import { FashionShell } from './shell/FashionShell'

export const definition: ExperienceDefinition = {
  id: manifest.id,
  brand: { ...manifest, Logo: FashionLogo },
  theme: { themeColor: '#f4f0e8' },
  fonts: [
    {
      href: 'https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400..600&family=Instrument+Serif:ital@0;1&display=swap',
    },
  ],
  capabilities: new Set(['sizeGuide', 'shopTheLook', 'quickZoom', 'wishlist']),
  shell: FashionShell,
  slots: { NotFound: FashionNotFound, ProductCard: FashionProductCard },
  routes: [
    {
      index: true,
      lazy: { Component: async () => (await import('./pages/HomePage')).HomePage },
    },
    {
      path: 'catalogo',
      lazy: { Component: async () => (await import('./pages/CatalogPage')).CatalogPage },
    },
    {
      path: 'producto/:id',
      lazy: { Component: async () => (await import('./pages/ProductPage')).ProductPage },
    },
    {
      path: 'favoritos',
      lazy: { Component: async () => (await import('./pages/WishlistPage')).WishlistPage },
    },
    {
      path: 'checkout',
      lazy: { Component: async () => (await import('./pages/CheckoutPage')).CheckoutPage },
    },
    {
      path: 'confirmacion/:orderId',
      lazy: {
        Component: async () => (await import('./pages/ConfirmationPage')).ConfirmationPage,
      },
    },
  ],
  domain: fashionDomain,
  motion: {
    // A curtain rising from the floor, slow and weighted; the previous page recedes upward.
    switchIn: {
      duration: 900,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      enter: () => [{ clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0 0 0 0)' }],
      exit: () => [
        { transform: 'translateY(0)', opacity: 1 },
        { transform: 'translateY(-8%)', opacity: 0.5 },
      ],
    },
  },
}

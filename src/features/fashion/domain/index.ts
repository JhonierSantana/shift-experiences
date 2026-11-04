import { createCart } from '@/core/cart'
import type { DomainAdapter } from '@/core/domain'
import {
  MockBackend,
  createMockLookRepository,
  createMockOrderRepository,
  createMockProductRepository,
  defaultBackendOptions,
} from '@/infra/mock'
import { fashionRules, matchesFashionFilters } from './rules'

// Mock data is a separate chunk, fetched on the first repository call.
const loadCatalog = () => import('../data/catalog')

/** Fake network for this experience (tweak latency / inject failures from devtools or tests). */
export const fashionBackend = new MockBackend(defaultBackendOptions())

export const fashionDomain: DomainAdapter<'fashion'> = {
  ...fashionRules,
  repositories: {
    products: createMockProductRepository({
      backend: fashionBackend,
      load: loadCatalog,
      matchesFilters: matchesFashionFilters,
      searchText: (p) => `${p.composition} ${p.colors.map((c) => c.name).join(' ')}`,
    }),
    looks: createMockLookRepository({ backend: fashionBackend, load: loadCatalog }),
    orders: createMockOrderRepository({
      backend: fashionBackend,
      kind: 'fashion',
      pricing: fashionRules,
    }),
  },
}

/** Query-layer data source: `useProductList(fashionData, {...})`. */
export const fashionData = { scope: 'fashion', repositories: fashionDomain.repositories } as const

export const fashionCart = createCart({ scope: 'fashion', adapter: fashionDomain })
export { findVariant } from './rules'

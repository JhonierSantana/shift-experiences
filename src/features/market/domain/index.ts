import { createCart } from '@/core/cart'
import type { DomainAdapter } from '@/core/domain'
import {
  MockBackend,
  createMockOrderRepository,
  createMockProductRepository,
  createMockReviewRepository,
  defaultBackendOptions,
} from '@/infra/mock'
import { effectivePrice, marketRules, matchesMarketFilters } from './rules'

// Mock data is a separate chunk, fetched on the first repository call.
const loadCatalog = () => import('../data/catalog')

export const marketBackend = new MockBackend(defaultBackendOptions())

export const marketDomain: DomainAdapter<'market'> = {
  ...marketRules,
  repositories: {
    products: createMockProductRepository({
      backend: marketBackend,
      load: loadCatalog,
      matchesFilters: matchesMarketFilters,
      sortPrice: effectivePrice,
      searchText: (p) => `${p.brand} ${p.seller.name}`,
    }),
    reviews: createMockReviewRepository({
      backend: marketBackend,
      load: async () => (await loadCatalog()).reviews,
    }),
    orders: createMockOrderRepository({
      backend: marketBackend,
      kind: 'market',
      pricing: marketRules,
    }),
  },
}

export const marketData = { scope: 'market', repositories: marketDomain.repositories } as const

export const marketCart = createCart({ scope: 'market', adapter: marketDomain })
export { effectivePrice } from './rules'

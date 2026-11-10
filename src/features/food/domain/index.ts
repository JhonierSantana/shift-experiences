import { createCart } from '@/core/cart'
import type { DomainAdapter } from '@/core/domain'
import {
  MockBackend,
  createMockOrderRepository,
  createMockProductRepository,
  defaultBackendOptions,
} from '@/infra/mock'
import { foodRules, matchesFoodFilters } from './rules'

// Mock data is a separate chunk, fetched on the first repository call.
const loadCatalog = () => import('../data/catalog')

export const foodBackend = new MockBackend(defaultBackendOptions())

export const foodDomain: DomainAdapter<'food'> = {
  ...foodRules,
  repositories: {
    products: createMockProductRepository({
      backend: foodBackend,
      load: loadCatalog,
      matchesFilters: matchesFoodFilters,
      searchText: (item) => item.ingredients.join(' '),
    }),
    orders: createMockOrderRepository({ backend: foodBackend, kind: 'food', pricing: foodRules }),
  },
}

export const foodData = { scope: 'food', repositories: foodDomain.repositories } as const

export const foodCart = createCart({ scope: 'food', adapter: foodDomain })
export { MAX_NOTE_LENGTH, selectionAllergens } from './rules'

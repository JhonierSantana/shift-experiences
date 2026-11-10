import type { ProductQuery, ReviewQuery } from '@/core/repositories'

/**
 * Hierarchical query keys, always rooted at the experience scope so caches
 * never collide across experiences and one scope can be invalidated at once:
 * queryClient.invalidateQueries({ queryKey: queryKeys.scope('market') }).
 */
export const queryKeys = {
  scope: (scope: string) => ['shift', scope] as const,

  products: (scope: string) => [...queryKeys.scope(scope), 'products'] as const,
  productLists: (scope: string) => [...queryKeys.products(scope), 'list'] as const,
  productList: <F>(scope: string, query: ProductQuery<F>) =>
    [...queryKeys.productLists(scope), query] as const,
  product: (scope: string, id: string) => [...queryKeys.products(scope), 'detail', id] as const,
  productsByIds: (scope: string, ids: readonly string[]) =>
    [...queryKeys.products(scope), 'many', ids] as const,
  categories: (scope: string) => [...queryKeys.products(scope), 'categories'] as const,

  looks: (scope: string) => [...queryKeys.scope(scope), 'looks'] as const,
  look: (scope: string, id: string) => [...queryKeys.looks(scope), 'detail', id] as const,
  collections: (scope: string) => [...queryKeys.looks(scope), 'collections'] as const,

  reviews: (scope: string, productId: string, query: ReviewQuery = {}) =>
    [...queryKeys.scope(scope), 'reviews', productId, query] as const,

  orders: (scope: string) => [...queryKeys.scope(scope), 'orders'] as const,
  order: (scope: string, id: string) => [...queryKeys.orders(scope), 'detail', id] as const,
}

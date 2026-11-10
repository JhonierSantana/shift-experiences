import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import type { DomainKind, OrderOf, PlaceOrderInput } from '@/core/domain'
import type {
  LookRepository,
  OrderRepository,
  ProductQuery,
  ProductRepository,
  ReviewQuery,
  ReviewRepository,
} from '@/core/repositories'
import { queryKeys } from './keys'

/**
 * Where a query reads from: the experience scope (cache namespace) plus the
 * repositories it needs. Experiences pass `{ scope, repositories }` from their
 * domain adapter; hooks stay domain-agnostic and fully typed.
 */
export interface DataSource<R> {
  readonly scope: string
  readonly repositories: R
}

type WithProducts<P, F> = DataSource<{ readonly products: ProductRepository<P, F> }>

// ---------------------------------------------------------------- option factories
// Exported so route loaders can prefetch with queryClient.ensureQueryData(...).

export function productListOptions<P, F>(source: WithProducts<P, F>, query: ProductQuery<F> = {}) {
  return queryOptions({
    queryKey: queryKeys.productList(source.scope, query),
    queryFn: ({ signal }) => source.repositories.products.list(query, { signal }),
  })
}

export function productOptions<P, F>(source: WithProducts<P, F>, id: string) {
  return queryOptions({
    queryKey: queryKeys.product(source.scope, id),
    queryFn: ({ signal }) => source.repositories.products.getById(id, { signal }),
  })
}

export function categoriesOptions<P, F>(source: WithProducts<P, F>) {
  return queryOptions({
    queryKey: queryKeys.categories(source.scope),
    queryFn: ({ signal }) => source.repositories.products.listCategories({ signal }),
    staleTime: Infinity,
  })
}

// ---------------------------------------------------------------- products

/** Keeps the previous page on screen while the next page/filter loads. */
export function useProductList<P, F>(source: WithProducts<P, F>, query: ProductQuery<F> = {}) {
  return useQuery({ ...productListOptions(source, query), placeholderData: keepPreviousData })
}

export function useProduct<P, F>(source: WithProducts<P, F>, id: string) {
  return useQuery(productOptions(source, id))
}

export function useProductsByIds<P, F>(source: WithProducts<P, F>, ids: readonly string[]) {
  return useQuery({
    queryKey: queryKeys.productsByIds(source.scope, ids),
    queryFn: ({ signal }) => source.repositories.products.getMany(ids, { signal }),
    enabled: ids.length > 0,
  })
}

export function useCategories<P, F>(source: WithProducts<P, F>) {
  return useQuery(categoriesOptions(source))
}

// ---------------------------------------------------------------- looks (fashion)

type WithLooks = DataSource<{ readonly looks: LookRepository }>

export function useLooks(source: WithLooks) {
  return useQuery({
    queryKey: queryKeys.looks(source.scope),
    queryFn: ({ signal }) => source.repositories.looks.list({ signal }),
  })
}

export function useLook(source: WithLooks, id: string) {
  return useQuery({
    queryKey: queryKeys.look(source.scope, id),
    queryFn: ({ signal }) => source.repositories.looks.getById(id, { signal }),
  })
}

export function useCollections(source: WithLooks) {
  return useQuery({
    queryKey: queryKeys.collections(source.scope),
    queryFn: ({ signal }) => source.repositories.looks.listCollections({ signal }),
    staleTime: Infinity,
  })
}

// ---------------------------------------------------------------- reviews (market)

export function useReviews(
  source: DataSource<{ readonly reviews: ReviewRepository }>,
  productId: string,
  query: ReviewQuery = {},
) {
  return useQuery({
    queryKey: queryKeys.reviews(source.scope, productId, query),
    queryFn: ({ signal }) =>
      source.repositories.reviews.listByProduct(productId, query, { signal }),
    placeholderData: keepPreviousData,
  })
}

// ---------------------------------------------------------------- orders

type WithOrders<K extends DomainKind> = DataSource<{ readonly orders: OrderRepository<K> }>

export function useOrders<K extends DomainKind>(source: WithOrders<K>) {
  return useQuery({
    queryKey: queryKeys.orders(source.scope),
    queryFn: ({ signal }) => source.repositories.orders.list({ signal }),
  })
}

export function useOrder<K extends DomainKind>(source: WithOrders<K>, id: string) {
  return useQuery({
    queryKey: queryKeys.order(source.scope, id),
    queryFn: ({ signal }) => source.repositories.orders.getById(id, { signal }),
  })
}

/** Places an order, seeds its detail cache and refreshes the order list. Clearing the cart is the caller's call. */
export function usePlaceOrder<K extends DomainKind>(source: WithOrders<K>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: PlaceOrderInput<K>) => source.repositories.orders.place(input),
    onSuccess: async (order: OrderOf<K>) => {
      queryClient.setQueryData(queryKeys.order(source.scope, order.id), order)
      await queryClient.invalidateQueries({ queryKey: queryKeys.orders(source.scope) })
    },
  })
}

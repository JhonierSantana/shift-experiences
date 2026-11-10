// Repository contracts. UI talks to these through the query layer (src/infra/query);
// implementations (mock today, REST later) live in src/infra.
import type {
  Allergen,
  Category,
  DomainKind,
  FashionCollection,
  FashionFit,
  FashionProduct,
  FoodItem,
  Look,
  MarketProduct,
  OrderOf,
  PlaceOrderInput,
  Review,
} from '@/core/domain'

export { RepositoryError, isRepositoryError, type RepositoryErrorCode } from './errors'

export interface RequestOptions {
  /** Cancels the request (TanStack Query passes one per query). */
  readonly signal?: AbortSignal
}

export interface Page<T> {
  readonly items: readonly T[]
  /** 1-based. */
  readonly page: number
  readonly pageSize: number
  readonly total: number
  readonly pageCount: number
}

export type ProductSort = 'relevance' | 'price-asc' | 'price-desc' | 'newest'

export interface ProductQuery<F> {
  readonly categoryId?: string
  /** Free text, matched accent- and case-insensitively. */
  readonly search?: string
  readonly tag?: string
  readonly sort?: ProductSort
  readonly page?: number
  readonly pageSize?: number
  /** Domain-specific facets. */
  readonly filters?: F
}

export interface ProductRepository<P, F> {
  list(query?: ProductQuery<F>, options?: RequestOptions): Promise<Page<P>>
  /** Rejects with RepositoryError('not-found'). */
  getById(id: string, options?: RequestOptions): Promise<P>
  /** Missing ids are skipped; order follows `ids`. */
  getMany(ids: readonly string[], options?: RequestOptions): Promise<readonly P[]>
  listCategories(options?: RequestOptions): Promise<readonly Category[]>
}

export interface OrderRepository<K extends DomainKind> {
  place(input: PlaceOrderInput<K>, options?: RequestOptions): Promise<OrderOf<K>>
  getById(id: string, options?: RequestOptions): Promise<OrderOf<K>>
  /** Newest first. */
  list(options?: RequestOptions): Promise<readonly OrderOf<K>[]>
}

export interface LookRepository {
  list(options?: RequestOptions): Promise<readonly Look[]>
  getById(id: string, options?: RequestOptions): Promise<Look>
  listCollections(options?: RequestOptions): Promise<readonly FashionCollection[]>
}

export type ReviewSort = 'newest' | 'highest' | 'lowest'

export interface ReviewQuery {
  readonly page?: number
  readonly pageSize?: number
  readonly sort?: ReviewSort
}

export interface ReviewRepository {
  listByProduct(
    productId: string,
    query?: ReviewQuery,
    options?: RequestOptions,
  ): Promise<Page<Review>>
}

// ---------------------------------------------------------------- facets per domain

export interface FashionFilters {
  readonly collectionId?: string
  readonly sizes?: readonly string[]
  readonly colorIds?: readonly string[]
  readonly fits?: readonly FashionFit[]
}

export interface FoodFilters {
  /** Hide items that contain any of these. */
  readonly excludeAllergens?: readonly Allergen[]
  readonly maxSpiceLevel?: 0 | 1 | 2 | 3
  readonly availableOnly?: boolean
}

export interface MarketFilters {
  readonly brands?: readonly string[]
  /** Minor units, applied to the discounted price. */
  readonly minPrice?: number
  readonly maxPrice?: number
  readonly minRating?: number
  readonly inStockOnly?: boolean
  readonly onSale?: boolean
  readonly freeShipping?: boolean
}

// ---------------------------------------------------------------- bundles per domain

export interface RepositoriesByKind {
  readonly fashion: {
    readonly products: ProductRepository<FashionProduct, FashionFilters>
    readonly looks: LookRepository
    readonly orders: OrderRepository<'fashion'>
  }
  readonly food: {
    readonly products: ProductRepository<FoodItem, FoodFilters>
    readonly orders: OrderRepository<'food'>
  }
  readonly market: {
    readonly products: ProductRepository<MarketProduct, MarketFilters>
    readonly reviews: ReviewRepository
    readonly orders: OrderRepository<'market'>
  }
}

export type RepositoriesOf<K extends DomainKind> = RepositoriesByKind[K]

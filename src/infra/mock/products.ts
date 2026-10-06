import {
  compare,
  type BaseProduct,
  type Category,
  type DomainKind,
  type Money,
} from '@/core/domain'
import {
  RepositoryError,
  type Page,
  type ProductQuery,
  type ProductRepository,
  type ProductSort,
} from '@/core/repositories'
import type { MockBackend } from './backend'

export interface MockCatalog<P> {
  readonly products: readonly P[]
  readonly categories: readonly Category[]
}

export interface MockProductRepositoryOptions<P, F> {
  readonly backend: MockBackend
  /** Dynamic import of the catalog module, so mock data is its own lazy chunk. */
  readonly load: () => Promise<MockCatalog<P>>
  /** Domain facets. Products pass when absent. */
  readonly matchesFilters?: (product: P, filters: F) => boolean
  /** Price used for sorting (e.g. after discount). Defaults to `product.price`. */
  readonly sortPrice?: (product: P) => Money
  /** Extra searchable text beyond title/description/tags (brand, ingredients...). */
  readonly searchText?: (product: P) => string
}

export const DEFAULT_PAGE_SIZE = 12
const MAX_PAGE_SIZE = 60

export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

export function paginate<T>(items: readonly T[], page = 1, pageSize = DEFAULT_PAGE_SIZE): Page<T> {
  const size = Math.min(Math.max(1, Math.floor(pageSize)), MAX_PAGE_SIZE)
  const pageCount = Math.max(1, Math.ceil(items.length / size))
  const current = Math.min(Math.max(1, Math.floor(page)), pageCount)
  const start = (current - 1) * size
  return {
    items: items.slice(start, start + size),
    page: current,
    pageSize: size,
    total: items.length,
    pageCount,
  }
}

/** Memoizes a lazy loader; a failed import is retried on the next call. */
export function once<T>(load: () => Promise<T>): () => Promise<T> {
  let pending: Promise<T> | undefined
  return () => {
    pending ??= load().catch((error: unknown) => {
      pending = undefined
      throw error
    })
    return pending
  }
}

export function createMockProductRepository<P extends BaseProduct<DomainKind>, F>(
  options: MockProductRepositoryOptions<P, F>,
): ProductRepository<P, F> {
  const { backend, matchesFilters, sortPrice = (p: P) => p.price, searchText } = options
  const load = once(options.load)

  const haystack = new WeakMap<P, string>()
  const textOf = (product: P) => {
    let text = haystack.get(product)
    if (text === undefined) {
      text = normalizeText(
        [product.title, product.description, ...product.tags, searchText?.(product) ?? ''].join(
          ' ',
        ),
      )
      haystack.set(product, text)
    }
    return text
  }

  const sorters: Record<Exclude<ProductSort, 'relevance'>, (a: P, b: P) => number> = {
    'price-asc': (a, b) => compare(sortPrice(a), sortPrice(b)),
    'price-desc': (a, b) => compare(sortPrice(b), sortPrice(a)),
    newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  }

  return {
    list(query: ProductQuery<F> = {}, requestOptions) {
      return backend.request(
        'products.list',
        async () => {
          const { products } = await load()
          const terms = query.search ? normalizeText(query.search).split(/\s+/).filter(Boolean) : []
          let result = products.filter(
            (p) =>
              (query.categoryId === undefined || p.categoryId === query.categoryId) &&
              (query.tag === undefined || p.tags.includes(query.tag)) &&
              terms.every((term) => textOf(p).includes(term)) &&
              (query.filters === undefined ||
                matchesFilters === undefined ||
                matchesFilters(p, query.filters)),
          )
          const sort = query.sort ?? 'relevance'
          if (sort === 'relevance') {
            if (terms.length > 0) {
              // Title hits first; Array#sort is stable, so catalog order breaks ties.
              const inTitle = (p: P) =>
                terms.every((t) => normalizeText(p.title).includes(t)) ? 0 : 1
              result = [...result].sort((a, b) => inTitle(a) - inTitle(b))
            }
          } else {
            result = [...result].sort(sorters[sort])
          }
          return paginate(result, query.page, query.pageSize)
        },
        requestOptions,
      )
    },

    getById(id, requestOptions) {
      return backend.request(
        'products.getById',
        async () => {
          const { products } = await load()
          const product = products.find((p) => p.id === id)
          if (!product) throw new RepositoryError('not-found', `Producto "${id}" no encontrado.`)
          return product
        },
        requestOptions,
      )
    },

    getMany(ids, requestOptions) {
      return backend.request(
        'products.getMany',
        async () => {
          const { products } = await load()
          const byId = new Map(products.map((p) => [p.id, p]))
          return ids.flatMap((id) => {
            const product = byId.get(id)
            return product ? [product] : []
          })
        },
        requestOptions,
      )
    },

    listCategories(requestOptions) {
      return backend.request(
        'products.listCategories',
        async () => (await load()).categories,
        requestOptions,
      )
    },
  }
}

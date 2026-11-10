import type { MarketProduct } from '@/core/domain'
import type { MarketFilters, ProductQuery, ProductSort } from '@/core/repositories'
import { effectivePrice } from './rules'
import { matchesSpecSelection, specFacetsFor } from './specFacets'

export type ListingSort = ProductSort | 'rating' | 'discount'

export const SORT_OPTIONS: readonly { readonly value: ListingSort; readonly label: string }[] = [
  { value: 'relevance', label: 'Más relevantes' },
  { value: 'price-asc', label: 'Menor precio' },
  { value: 'price-desc', label: 'Mayor precio' },
  { value: 'rating', label: 'Mejor calificados' },
  { value: 'discount', label: 'Mayor descuento' },
  { value: 'newest', label: 'Más recientes' },
]

export const RATING_STEPS = [4, 3] as const
export const DISCOUNT_STEPS = [10, 20, 30] as const

/** Everything the listing URL can say. Department comes from the route, not from here. */
export interface ListingState {
  readonly search: string
  readonly brands: readonly string[]
  /** Pesos, applied to the discounted price. */
  readonly minPrice: number | undefined
  readonly maxPrice: number | undefined
  readonly minRating: number | undefined
  readonly minDiscount: number | undefined
  readonly inStockOnly: boolean
  readonly onSale: boolean
  readonly freeShipping: boolean
  /** `facet.option` ids from specFacets. */
  readonly specs: readonly string[]
  readonly sort: ListingSort
}

export const EMPTY_LISTING: ListingState = {
  search: '',
  brands: [],
  minPrice: undefined,
  maxPrice: undefined,
  minRating: undefined,
  minDiscount: undefined,
  inStockOnly: false,
  onSale: false,
  freeShipping: false,
  specs: [],
  sort: 'relevance',
}

function positiveInt(value: string | null): number | undefined {
  if (value === null || !/^\d{1,9}$/.test(value)) return undefined
  const n = Number(value)
  return n > 0 ? n : undefined
}

export function parseListing(params: URLSearchParams): ListingState {
  const sort = SORT_OPTIONS.find((o) => o.value === params.get('sort'))?.value ?? 'relevance'
  return {
    search: (params.get('q') ?? '').trim(),
    brands: params.getAll('brand'),
    minPrice: positiveInt(params.get('min')),
    maxPrice: positiveInt(params.get('max')),
    minRating: positiveInt(params.get('rating')),
    minDiscount: positiveInt(params.get('discount')),
    inStockOnly: params.get('stock') === '1',
    onSale: params.get('sale') === '1',
    freeShipping: params.get('free') === '1',
    specs: params.getAll('spec'),
    sort,
  }
}

export function serializeListing(state: ListingState): URLSearchParams {
  const params = new URLSearchParams()
  if (state.search) params.set('q', state.search)
  for (const brand of state.brands) params.append('brand', brand)
  if (state.minPrice !== undefined) params.set('min', String(state.minPrice))
  if (state.maxPrice !== undefined) params.set('max', String(state.maxPrice))
  if (state.minRating !== undefined) params.set('rating', String(state.minRating))
  if (state.minDiscount !== undefined) params.set('discount', String(state.minDiscount))
  if (state.inStockOnly) params.set('stock', '1')
  if (state.onSale) params.set('sale', '1')
  if (state.freeShipping) params.set('free', '1')
  for (const spec of state.specs) params.append('spec', spec)
  if (state.sort !== 'relevance') params.set('sort', state.sort)
  return params
}

const REPOSITORY_SORTS: readonly ProductSort[] = ['relevance', 'price-asc', 'price-desc', 'newest']

function repositorySort(sort: ListingSort): ProductSort | undefined {
  return REPOSITORY_SORTS.find((s) => s === sort)
}

export function toProductQuery(
  state: ListingState,
  departmentId: string | undefined,
): ProductQuery<MarketFilters> {
  const filters: MarketFilters = {
    ...(state.brands.length > 0 ? { brands: state.brands } : {}),
    ...(state.minPrice === undefined ? {} : { minPrice: state.minPrice }),
    ...(state.maxPrice === undefined ? {} : { maxPrice: state.maxPrice }),
    ...(state.minRating === undefined ? {} : { minRating: state.minRating }),
    ...(state.inStockOnly ? { inStockOnly: true } : {}),
    ...(state.onSale ? { onSale: true } : {}),
    ...(state.freeShipping ? { freeShipping: true } : {}),
  }
  const sort = repositorySort(state.sort)
  return {
    pageSize: 60,
    ...(departmentId ? { categoryId: departmentId } : {}),
    ...(state.search ? { search: state.search } : {}),
    ...(sort ? { sort } : {}),
    ...(Object.keys(filters).length > 0 ? { filters } : {}),
  }
}

/** Facets the repository cannot express (discount threshold, department specs) and the extra sorts. */
export function applyClientRules(
  items: readonly MarketProduct[],
  state: ListingState,
  departmentId: string | undefined,
): MarketProduct[] {
  const kept = items.filter(
    (p) =>
      (state.minDiscount === undefined || (p.discount?.percent ?? 0) >= state.minDiscount) &&
      matchesSpecSelection(p, departmentId, state.specs),
  )
  if (state.sort === 'rating') {
    return kept.sort(
      (a, b) => b.rating.average - a.rating.average || b.rating.count - a.rating.count,
    )
  }
  if (state.sort === 'discount') {
    return kept.sort((a, b) => (b.discount?.percent ?? 0) - (a.discount?.percent ?? 0))
  }
  return kept
}

export interface ListingFacets {
  readonly brands: readonly { readonly name: string; readonly count: number }[]
  readonly priceRange: { readonly min: number; readonly max: number } | null
}

/** Facet options come from the unfiltered base list (department + search), so they never vanish as you filter. */
export function facetsOf(items: readonly MarketProduct[]): ListingFacets {
  const counts = new Map<string, number>()
  let min = Infinity
  let max = 0
  for (const p of items) {
    counts.set(p.brand, (counts.get(p.brand) ?? 0) + 1)
    const price = effectivePrice(p).amount
    min = Math.min(min, price)
    max = Math.max(max, price)
  }
  return {
    brands: [...counts]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'es')),
    priceRange: items.length > 0 ? { min, max } : null,
  }
}

export interface FilterChip {
  readonly key: string
  readonly label: string
  readonly without: ListingState
}

const pesos = new Intl.NumberFormat('es-CO')

export function activeChips(state: ListingState, departmentId: string | undefined): FilterChip[] {
  const chips: FilterChip[] = []
  for (const brand of state.brands) {
    chips.push({
      key: `brand:${brand}`,
      label: brand,
      without: { ...state, brands: state.brands.filter((b) => b !== brand) },
    })
  }
  if (state.minPrice !== undefined || state.maxPrice !== undefined) {
    const from = state.minPrice === undefined ? '' : `$${pesos.format(state.minPrice)}`
    const to = state.maxPrice === undefined ? '' : `$${pesos.format(state.maxPrice)}`
    const label = from && to ? `${from} – ${to}` : from ? `Desde ${from}` : `Hasta ${to}`
    chips.push({
      key: 'price',
      label,
      without: { ...state, minPrice: undefined, maxPrice: undefined },
    })
  }
  if (state.minRating !== undefined) {
    chips.push({
      key: 'rating',
      label: `${String(state.minRating)}★ o más`,
      without: { ...state, minRating: undefined },
    })
  }
  if (state.minDiscount !== undefined) {
    chips.push({
      key: 'discount',
      label: `${String(state.minDiscount)} % dto. o más`,
      without: { ...state, minDiscount: undefined },
    })
  }
  if (state.onSale)
    chips.push({ key: 'sale', label: 'En oferta', without: { ...state, onSale: false } })
  if (state.inStockOnly)
    chips.push({
      key: 'stock',
      label: 'Solo disponibles',
      without: { ...state, inStockOnly: false },
    })
  if (state.freeShipping)
    chips.push({ key: 'free', label: 'Envío gratis', without: { ...state, freeShipping: false } })
  for (const facet of specFacetsFor(departmentId)) {
    for (const option of facet.options) {
      const id = `${facet.id}.${option.id}`
      if (state.specs.includes(id)) {
        chips.push({
          key: `spec:${id}`,
          label: option.label,
          without: { ...state, specs: state.specs.filter((s) => s !== id) },
        })
      }
    }
  }
  return chips
}

/** Drops every facet but keeps the search text and the sort. */
export function clearFilters(state: ListingState): ListingState {
  return { ...EMPTY_LISTING, search: state.search, sort: state.sort }
}

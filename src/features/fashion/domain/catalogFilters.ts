import type { FashionCollection, FashionColor, FashionProduct } from '@/core/domain'
import type { FashionFilters, ProductQuery, ProductSort } from '@/core/repositories'

export const SORT_OPTIONS: readonly { readonly value: ProductSort; readonly label: string }[] = [
  { value: 'relevance', label: 'Destacados' },
  { value: 'newest', label: 'Novedades' },
  { value: 'price-asc', label: 'Precio: menor a mayor' },
  { value: 'price-desc', label: 'Precio: mayor a menor' },
]

/** Amounts in pesos (COP minor unit = 1 peso). `max` is inclusive, `min` exclusive. */
export interface PriceBand {
  readonly id: string
  readonly label: string
  readonly min?: number
  readonly max?: number
}

export const PRICE_BANDS: readonly PriceBand[] = [
  { id: 'hasta-500', label: 'Hasta $500.000', max: 500_000 },
  { id: '500-900', label: '$500.000 – $900.000', min: 500_000, max: 900_000 },
  { id: 'mas-900', label: 'Más de $900.000', min: 900_000 },
]

export interface CatalogFilters {
  readonly collectionId?: string
  readonly sizes: readonly string[]
  readonly colorIds: readonly string[]
  readonly priceBandId?: string
  readonly sort: ProductSort
}

export const EMPTY_FILTERS: CatalogFilters = { sizes: [], colorIds: [], sort: 'relevance' }

const SORTS: ReadonlySet<string> = new Set(SORT_OPTIONS.map((o) => o.value))

function unique(values: readonly string[]): string[] {
  return [...new Set(values.filter(Boolean))]
}

function isSort(value: string | null): value is ProductSort {
  return value !== null && SORTS.has(value)
}

/** URL is the source of truth for filters, so links are shareable and back/forward work. */
export function parseFilters(params: URLSearchParams): CatalogFilters {
  const sort = params.get('orden')
  const collectionId = params.get('coleccion')
  const band = params.get('precio')
  return {
    ...(collectionId ? { collectionId } : {}),
    sizes: unique(params.getAll('talla')),
    colorIds: unique(params.getAll('color')),
    ...(band && PRICE_BANDS.some((b) => b.id === band) ? { priceBandId: band } : {}),
    sort: isSort(sort) ? sort : 'relevance',
  }
}

export function serializeFilters(filters: CatalogFilters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.collectionId) params.set('coleccion', filters.collectionId)
  for (const size of filters.sizes) params.append('talla', size)
  for (const color of filters.colorIds) params.append('color', color)
  if (filters.priceBandId) params.set('precio', filters.priceBandId)
  if (filters.sort !== 'relevance') params.set('orden', filters.sort)
  return params
}

/** Everything the repository understands; price is applied client-side (see applyPriceBand). */
export function toProductQuery(filters: CatalogFilters): ProductQuery<FashionFilters> {
  const facets: FashionFilters = {
    ...(filters.collectionId ? { collectionId: filters.collectionId } : {}),
    ...(filters.sizes.length ? { sizes: filters.sizes } : {}),
    ...(filters.colorIds.length ? { colorIds: filters.colorIds } : {}),
  }
  return { sort: filters.sort, pageSize: 60, filters: facets }
}

export function applyPriceBand(
  products: readonly FashionProduct[],
  bandId: string | undefined,
): readonly FashionProduct[] {
  const band = PRICE_BANDS.find((b) => b.id === bandId)
  if (!band) return products
  return products.filter(
    ({ price }) =>
      (band.min === undefined || price.amount > band.min) &&
      (band.max === undefined || price.amount <= band.max),
  )
}

export interface FilterChip {
  readonly key: string
  readonly label: string
  /** Filters with just this facet value removed. */
  readonly without: CatalogFilters
}

interface FilterChanges {
  readonly collectionId?: string | undefined
  readonly sizes?: readonly string[]
  readonly colorIds?: readonly string[]
  readonly priceBandId?: string | undefined
  readonly sort?: ProductSort
}

/** Merges changes; a key explicitly set to undefined removes that optional facet. */
export function withFilters(filters: CatalogFilters, changes: FilterChanges): CatalogFilters {
  const collectionId = 'collectionId' in changes ? changes.collectionId : filters.collectionId
  const priceBandId = 'priceBandId' in changes ? changes.priceBandId : filters.priceBandId
  return {
    ...(collectionId ? { collectionId } : {}),
    sizes: changes.sizes ?? filters.sizes,
    colorIds: changes.colorIds ?? filters.colorIds,
    ...(priceBandId ? { priceBandId } : {}),
    sort: changes.sort ?? filters.sort,
  }
}

export function activeChips(
  filters: CatalogFilters,
  collections: readonly FashionCollection[],
  colors: readonly FashionColor[],
): FilterChip[] {
  const chips: FilterChip[] = []
  if (filters.collectionId) {
    const name =
      collections.find((c) => c.id === filters.collectionId)?.name ?? filters.collectionId
    chips.push({
      key: 'coleccion',
      label: name,
      without: withFilters(filters, { collectionId: undefined }),
    })
  }
  for (const size of filters.sizes) {
    chips.push({
      key: `talla:${size}`,
      label: `Talla ${size}`,
      without: withFilters(filters, { sizes: filters.sizes.filter((s) => s !== size) }),
    })
  }
  for (const id of filters.colorIds) {
    chips.push({
      key: `color:${id}`,
      label: colors.find((c) => c.id === id)?.name ?? id,
      without: withFilters(filters, { colorIds: filters.colorIds.filter((c) => c !== id) }),
    })
  }
  const band = PRICE_BANDS.find((b) => b.id === filters.priceBandId)
  if (band) {
    chips.push({
      key: 'precio',
      label: band.label,
      without: withFilters(filters, { priceBandId: undefined }),
    })
  }
  return chips
}

export function clearFilters(filters: CatalogFilters): CatalogFilters {
  return { ...EMPTY_FILTERS, sort: filters.sort }
}

export function toggleIn(values: readonly string[], value: string): string[] {
  return values.includes(value) ? values.filter((v) => v !== value) : [...values, value]
}

/** Unique facet values across a catalog: sizes by first appearance, colors by name. */
export function facetsOf(products: readonly FashionProduct[]) {
  const sizes = unique(products.flatMap((p) => p.sizes))
  const colors = new Map<string, FashionColor>()
  for (const p of products) for (const c of p.colors) colors.set(c.id, c)
  return {
    sizes,
    colors: [...colors.values()].sort((a, b) => a.name.localeCompare(b.name, 'es')),
  }
}

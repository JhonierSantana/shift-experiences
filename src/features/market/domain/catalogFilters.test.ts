import { products } from '../data/catalog'
import {
  EMPTY_LISTING,
  activeChips,
  applyClientRules,
  clearFilters,
  facetsOf,
  parseListing,
  serializeListing,
  toProductQuery,
  type ListingState,
} from './catalogFilters'
import { effectivePrice, matchesMarketFilters } from './rules'
import { specFacetsFor } from './specFacets'

const state = (patch: Partial<ListingState>): ListingState => ({ ...EMPTY_LISTING, ...patch })

describe('listing URL state', () => {
  it('round-trips every facet through the query string', () => {
    const original = state({
      search: 'audífonos',
      brands: ['Nimbo', 'Vórtice'],
      minPrice: 100_000,
      maxPrice: 900_000,
      minRating: 4,
      minDiscount: 20,
      inStockOnly: true,
      onSale: true,
      freeShipping: true,
      specs: ['conexion.bluetooth'],
      sort: 'rating',
    })
    expect(parseListing(serializeListing(original))).toEqual(original)
  })

  it('ignores junk params instead of throwing', () => {
    const parsed = parseListing(new URLSearchParams('min=abc&max=-4&sort=hax&rating=99999999999'))
    expect(parsed).toEqual(EMPTY_LISTING)
  })

  it('clearing keeps the search text and the sort', () => {
    const cleared = clearFilters(state({ search: 'tv', sort: 'price-asc', brands: ['Nimbo'] }))
    expect(cleared).toEqual(state({ search: 'tv', sort: 'price-asc' }))
  })
})

describe('faceted filtering (repository query + client rules)', () => {
  it('sends only the facets the repository understands', () => {
    const query = toProductQuery(
      state({ brands: ['Nimbo'], minDiscount: 20, sort: 'rating', minRating: 4 }),
      'tecnologia',
    )
    expect(query.categoryId).toBe('tecnologia')
    expect(query.filters).toEqual({ brands: ['Nimbo'], minRating: 4 })
    expect(query.sort).toBeUndefined()
  })

  it('price range applies to the discounted price', () => {
    const inRange = products.filter((p) =>
      matchesMarketFilters(p, { minPrice: 100_000, maxPrice: 200_000 }),
    )
    expect(inRange.length).toBeGreaterThan(0)
    for (const p of inRange) {
      expect(effectivePrice(p).amount).toBeGreaterThanOrEqual(100_000)
      expect(effectivePrice(p).amount).toBeLessThanOrEqual(200_000)
    }
  })

  it('discount threshold and department specs narrow the list', () => {
    const tech = products.filter((p) => p.categoryId === 'tecnologia')
    const deep = applyClientRules(tech, state({ minDiscount: 15 }), 'tecnologia')
    expect(deep.length).toBeGreaterThan(0)
    expect(deep.every((p) => (p.discount?.percent ?? 0) >= 15)).toBe(true)

    const bluetooth = applyClientRules(tech, state({ specs: ['conexion.bluetooth'] }), 'tecnologia')
    expect(bluetooth.length).toBeGreaterThan(0)
    expect(bluetooth.length).toBeLessThan(tech.length)
    expect(bluetooth.every((p) => p.specs.some((s) => /bluetooth/i.test(s.value)))).toBe(true)
  })

  it('spec facets only exist for the departments that define them', () => {
    expect(specFacetsFor('tecnologia').length).toBeGreaterThan(0)
    expect(specFacetsFor('juguetes')).toEqual([])
    expect(specFacetsFor(undefined)).toEqual([])
  })

  it('sorts by rating and by discount', () => {
    const byRating = applyClientRules([...products], state({ sort: 'rating' }), undefined)
    for (let i = 1; i < byRating.length; i += 1) {
      expect(byRating[i - 1]?.rating.average ?? 0).toBeGreaterThanOrEqual(
        byRating[i]?.rating.average ?? 0,
      )
    }
    const byDiscount = applyClientRules([...products], state({ sort: 'discount' }), undefined)
    expect(byDiscount[0]?.discount?.percent).toBe(
      Math.max(...products.map((p) => p.discount?.percent ?? 0)),
    )
  })

  it('derives brand counts and the price range from the base list', () => {
    const facets = facetsOf(products)
    expect(facets.brands.reduce((n, b) => n + b.count, 0)).toBe(products.length)
    expect(facets.priceRange?.min).toBeLessThan(facets.priceRange?.max ?? 0)
    expect(facetsOf([]).priceRange).toBeNull()
  })

  it('builds one removable chip per active facet', () => {
    const active = state({ brands: ['Nimbo'], minPrice: 50_000, specs: ['conexion.usbc'] })
    const chips = activeChips(active, 'tecnologia')
    expect(chips.map((c) => c.key)).toEqual(['brand:Nimbo', 'price', 'spec:conexion.usbc'])
    const brandChip = chips[0]
    expect(brandChip?.without.brands).toEqual([])
    expect(brandChip?.without.minPrice).toBe(50_000)
  })
})

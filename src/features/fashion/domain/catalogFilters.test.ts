import { money, type FashionCollection, type FashionProduct } from '@/core/domain'
import { products } from '../data/catalog'
import {
  EMPTY_FILTERS,
  PRICE_BANDS,
  activeChips,
  applyPriceBand,
  clearFilters,
  facetsOf,
  parseFilters,
  serializeFilters,
  toProductQuery,
  toggleIn,
  type CatalogFilters,
} from './catalogFilters'

describe('catalog filters and the URL', () => {
  it('round-trips every facet', () => {
    const filters: CatalogFilters = {
      collectionId: 'lino-crudo',
      sizes: ['M', 'L'],
      colorIds: ['camel'],
      priceBandId: '500-900',
      sort: 'price-asc',
    }
    expect(parseFilters(serializeFilters(filters))).toEqual(filters)
  })

  it('keeps the URL clean for defaults', () => {
    expect(serializeFilters(EMPTY_FILTERS).toString()).toBe('')
  })

  it('ignores invalid sort and unknown price bands, dedupes repeated values', () => {
    const params = new URLSearchParams('orden=chaos&precio=gratis&talla=M&talla=M&talla=')
    expect(parseFilters(params)).toEqual({ sizes: ['M'], colorIds: [], sort: 'relevance' })
  })

  it('maps to repository facets and leaves price to the client', () => {
    const query = toProductQuery({
      ...EMPTY_FILTERS,
      collectionId: 'x',
      sizes: ['S'],
      priceBandId: 'mas-900',
      sort: 'newest',
    })
    expect(query.filters).toEqual({ collectionId: 'x', sizes: ['S'] })
    expect(query.sort).toBe('newest')
  })
})

describe('price bands', () => {
  const template = products[0] as FashionProduct
  const at = (amount: number): FashionProduct => ({ ...template, price: money(amount, 'COP') })

  it('uses inclusive upper and exclusive lower bounds so bands never overlap', () => {
    const list = [at(500_000), at(500_001), at(900_000), at(900_001)]
    const amounts = (band: string) => applyPriceBand(list, band).map((p) => p.price.amount)
    expect(amounts('hasta-500')).toEqual([500_000])
    expect(amounts('500-900')).toEqual([500_001, 900_000])
    expect(amounts('mas-900')).toEqual([900_001])
    expect(applyPriceBand(list, undefined)).toBe(list)
  })

  it('places every catalog product in exactly one band', () => {
    for (const product of products) {
      const hits = PRICE_BANDS.filter((band) => applyPriceBand([product], band.id).length === 1)
      expect(hits).toHaveLength(1)
    }
  })
})

describe('active chips', () => {
  const collections: FashionCollection[] = [
    { id: 'lino-crudo', name: 'Lino crudo', season: 's', statement: 's' },
  ]
  const { colors } = facetsOf(products)

  it('creates one chip per facet value and each removes only itself', () => {
    const color = colors[0]
    if (!color) throw new Error('fixture missing')
    const filters: CatalogFilters = {
      collectionId: 'lino-crudo',
      sizes: ['M', 'L'],
      colorIds: [color.id],
      priceBandId: 'hasta-500',
      sort: 'newest',
    }
    const chips = activeChips(filters, collections, colors)
    expect(chips.map((c) => c.label)).toEqual([
      'Lino crudo',
      'Talla M',
      'Talla L',
      color.name,
      'Hasta $500.000',
    ])
    expect(chips[1]?.without.sizes).toEqual(['L'])
    expect(chips[0]?.without.collectionId).toBeUndefined()
    expect(chips[4]?.without.priceBandId).toBeUndefined()
    expect(chips[4]?.without.sort).toBe('newest')
  })

  it('clearing keeps the sort', () => {
    expect(clearFilters({ ...EMPTY_FILTERS, sizes: ['S'], sort: 'price-desc' })).toEqual({
      ...EMPTY_FILTERS,
      sort: 'price-desc',
    })
  })

  it('toggles values in and out', () => {
    expect(toggleIn(['a'], 'b')).toEqual(['a', 'b'])
    expect(toggleIn(['a', 'b'], 'a')).toEqual(['b'])
  })
})

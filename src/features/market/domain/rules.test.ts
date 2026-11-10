import { money, type CartLineOf, type MarketProduct } from '@/core/domain'
import { categories, products, reviews } from '../data/catalog'
import { marketRules, matchesMarketFilters } from './rules'

function byId(id: string): MarketProduct {
  const product = products.find((p) => p.id === id)
  if (!product) throw new Error(`fixture ${id} missing`)
  return product
}

function line(product: MarketProduct, quantity = 1): CartLineOf<'market'> {
  return { id: 'l', product, selection: { kind: 'market' }, quantity, addedAt: '2026-09-24' }
}

describe('market catalog integrity', () => {
  it('has a coherent, sizeable catalog', () => {
    expect(products.length).toBeGreaterThanOrEqual(20)
    expect(products.length).toBeLessThanOrEqual(30)
    expect(new Set(products.map((p) => p.id)).size).toBe(products.length)
    for (const p of products) {
      expect(categories.some((c) => c.id === p.categoryId)).toBe(true)
      expect(p.rating.average).toBeGreaterThanOrEqual(1)
      expect(p.rating.average).toBeLessThanOrEqual(5)
    }
    for (const r of reviews) expect(products.some((p) => p.id === r.productId)).toBe(true)
  })
})

describe('market rules', () => {
  it('applies the discount and reports the compare-at total', () => {
    const headphones = byId('pz-audifonos-q5') // 459.900, -25 %
    expect(marketRules.priceLine(line(headphones, 2))).toEqual({
      unit: money(344_925, 'COP'),
      total: money(689_850, 'COP'),
      compareAtTotal: money(919_800, 'COP'),
    })
    const speaker = byId('pz-parlante-roca')
    expect(marketRules.priceLine(line(speaker))).toEqual({
      unit: speaker.price,
      total: speaker.price,
    })
  })

  it('describes seller, deal and shipping', () => {
    expect(marketRules.describeLine(line(byId('pz-audifonos-q5'))).details).toEqual([
      'Vendido por TecnoAndes',
      'Oferta relámpago: −25 %',
      'Envío gratis',
    ])
  })

  it('validates stock', () => {
    const check = (p: MarketProduct, qty: number) =>
      marketRules.validateSelection(p, { kind: 'market' }, qty)
    expect(check(byId('pz-cargador-gan65'), 1)).toMatchObject({
      ok: false,
      issues: [{ code: 'out-of-stock' }],
    })
    expect(check(byId('pz-bicicleta-alba'), 4)).toMatchObject({
      ok: false,
      issues: [{ code: 'insufficient-stock' }],
    })
    expect(check(byId('pz-bicicleta-alba'), 3)).toEqual({ ok: true, selection: { kind: 'market' } })
  })

  it('filters on the discounted price', () => {
    const headphones = byId('pz-audifonos-q5')
    expect(matchesMarketFilters(headphones, { maxPrice: 350_000 })).toBe(true)
    expect(matchesMarketFilters(headphones, { onSale: true, brands: ['Vórtice'] })).toBe(true)
    expect(matchesMarketFilters(byId('pz-cargador-gan65'), { inStockOnly: true })).toBe(false)
  })
})

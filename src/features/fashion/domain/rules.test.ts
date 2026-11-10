import { money, type CartLineOf, type FashionProduct } from '@/core/domain'
import { categories, collections, looks, products } from '../data/catalog'
import { fashionRules, matchesFashionFilters } from './rules'

function byId(id: string): FashionProduct {
  const product = products.find((p) => p.id === id)
  if (!product) throw new Error(`fixture ${id} missing`)
  return product
}

function line(product: FashionProduct, sku: string, quantity = 1): CartLineOf<'fashion'> {
  return { id: 'l', product, selection: { kind: 'fashion', sku }, quantity, addedAt: '2026-09-24' }
}

describe('fashion catalog integrity', () => {
  it('has a coherent, sizeable catalog', () => {
    expect(products.length).toBeGreaterThanOrEqual(20)
    expect(products.length).toBeLessThanOrEqual(30)
    expect(new Set(products.map((p) => p.id)).size).toBe(products.length)
    const skus = products.flatMap((p) => p.variants.map((v) => v.sku))
    expect(new Set(skus).size).toBe(skus.length)

    for (const p of products) {
      expect(categories.some((c) => c.id === p.categoryId)).toBe(true)
      expect(collections.some((c) => c.id === p.collectionId)).toBe(true)
      expect(p.variants).toHaveLength(p.sizes.length * p.colors.length)
      for (const v of p.variants) {
        expect(p.sizes).toContain(v.size)
        expect(p.colors.map((c) => c.id)).toContain(v.colorId)
      }
      for (const lookId of p.lookIds) {
        expect(looks.find((l) => l.id === lookId)?.productIds).toContain(p.id)
      }
      expect(p.media.every((m) => m.alt.length > 0)).toBe(true)
    }
    for (const look of looks) {
      for (const id of look.productIds) expect(byId(id).lookIds).toContain(look.id)
    }
  })
})

describe('fashion rules', () => {
  const capa = byId('fv-capa-alpaca')

  it('prices by variant, falling back to the product price', () => {
    const crudo = capa.variants.find((v) => v.colorId === 'crudo')
    const chocolate = capa.variants.find((v) => v.colorId === 'chocolate')
    if (!crudo || !chocolate) throw new Error('fixture variants missing')

    expect(fashionRules.priceLine(line(capa, crudo.sku, 2))).toEqual({
      unit: money(980_000, 'COP'),
      total: money(1_960_000, 'COP'),
    })
    expect(fashionRules.priceLine(line(capa, chocolate.sku)).unit).toEqual(money(1_040_000, 'COP'))
  })

  it('describes size and color', () => {
    const variant = capa.variants.find((v) => v.colorId === 'chocolate' && v.size === 'L/XL')
    if (!variant) throw new Error('fixture variant missing')
    expect(fashionRules.describeLine(line(capa, variant.sku))).toEqual({
      title: 'Capa de alpaca cepillada',
      details: ['Talla L/XL', 'Chocolate'],
    })
    const tote = byId('fv-tote-cuero')
    expect(fashionRules.describeLine(line(tote, tote.variants[0]?.sku ?? '')).details[0]).toBe(
      'Talla única',
    )
  })

  it('validates variant existence and stock', () => {
    const product = products.find((p) => p.variants.some((v) => v.stock === 0))
    const soldOut = product?.variants.find((v) => v.stock === 0)
    const inStock = product?.variants.find((v) => v.stock > 1)
    if (!product || !soldOut || !inStock)
      throw new Error('catalog should include sold-out variants')

    const check = (sku: string, qty: number) =>
      fashionRules.validateSelection(product, { kind: 'fashion', sku }, qty)
    expect(check('NOPE', 1)).toMatchObject({ ok: false, issues: [{ code: 'unknown-variant' }] })
    expect(check(soldOut.sku, 1)).toMatchObject({ ok: false, issues: [{ code: 'out-of-stock' }] })
    expect(check(inStock.sku, inStock.stock + 1)).toMatchObject({
      ok: false,
      issues: [{ code: 'insufficient-stock' }],
    })
    expect(check(inStock.sku, inStock.stock)).toEqual({
      ok: true,
      selection: { kind: 'fashion', sku: inStock.sku },
    })
  })

  it('filters by in-stock size and color together', () => {
    const variant = capa.variants.find((v) => v.stock > 0)
    if (!variant) throw new Error('fixture variant missing')
    expect(
      matchesFashionFilters(capa, { sizes: [variant.size], colorIds: [variant.colorId] }),
    ).toBe(true)
    expect(matchesFashionFilters(capa, { sizes: ['XXS'] })).toBe(false)
    expect(matchesFashionFilters(capa, { collectionId: 'lino-crudo' })).toBe(false)
  })
})

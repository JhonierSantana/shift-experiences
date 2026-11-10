import { formatMoney, type MarketProduct } from '@/core/domain'
import { products } from '../data/catalog'
import { buildCompareRows } from './compare'
import { priceDisplay } from './pricing'
import { LOW_STOCK_AT, maxAddable, stockLabel, stockLevel } from './stock'

function byId(id: string): MarketProduct {
  const product = products.find((p) => p.id === id)
  if (!product) throw new Error(`fixture ${id} missing`)
  return product
}

describe('discount math display', () => {
  it('shows regular price, savings and percent that add up', () => {
    const headphones = byId('pz-audifonos-q5') // 459.900 with 25 % off
    const { current, regular, savings, percent } = priceDisplay(headphones)
    expect(percent).toBe(25)
    expect(regular?.amount).toBe(459_900)
    expect(current.amount).toBe(344_925)
    expect(savings?.amount).toBe(114_975)
    expect(current.amount + (savings?.amount ?? 0)).toBe(regular?.amount)
    expect(formatMoney(current)).toMatch(/344\.925/)
  })

  it('has no regular price or savings without a discount', () => {
    const full = byId('pz-parlante-roca')
    expect(priceDisplay(full)).toEqual({
      current: full.price,
      regular: null,
      savings: null,
      percent: null,
    })
  })
})

describe('stock display and limits', () => {
  it('classifies stock levels and labels them', () => {
    expect(stockLevel(0)).toBe('out')
    expect(stockLevel(LOW_STOCK_AT)).toBe('low')
    expect(stockLevel(LOW_STOCK_AT + 1)).toBe('in')
    expect(stockLabel(0)).toBe('Agotado')
    expect(stockLabel(1)).toBe('Última unidad')
    expect(stockLabel(3)).toBe('Últimas 3 unidades')
  })

  it('limits the addable quantity by stock minus what the cart already holds', () => {
    const scarce = byId('pz-bicicleta-alba') // stock 3
    expect(maxAddable(scarce, 0)).toBe(3)
    expect(maxAddable(scarce, 2)).toBe(1)
    expect(maxAddable(scarce, 3)).toBe(0)
    expect(maxAddable(byId('pz-cargador-gan65'), 0)).toBe(0)
  })
})

describe('compare table', () => {
  it('marks the best value per row only when products differ', () => {
    const rows = buildCompareRows([byId('pz-audifonos-q5'), byId('pz-parlante-roca')])
    const price = rows.find((r) => r.id === 'price')
    // Headphones: 344.925 after discount; speaker: 219.900.
    expect(price?.cells.map((c) => c.best)).toEqual([false, true])
    const rating = rows.find((r) => r.id === 'rating')
    expect(rating?.cells.filter((c) => c.best)).toHaveLength(1)

    const same = buildCompareRows([byId('pz-parlante-roca'), byId('pz-parlante-roca')])
    expect(same.find((r) => r.id === 'price')?.cells.some((c) => c.best)).toBe(false)
  })

  it('unions specs and fills the gaps with a dash', () => {
    const rows = buildCompareRows([byId('pz-portatil-air14'), byId('pz-parlante-roca')])
    const memory = rows.find((r) => r.label === 'Memoria')
    expect(memory?.cells.map((c) => c.text)).toEqual(['16 GB LPDDR5X', '—'])
    expect(memory?.differs).toBe(true)
  })
})

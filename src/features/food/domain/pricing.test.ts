import { money } from '@/core/domain'
import { DELIVERY_FEE, FREE_DELIVERY_FROM, MIN_DELIVERY_ORDER, quote } from './pricing'

const cop = (amount: number) => money(amount, 'COP')
const base = { mode: 'delivery', tip: 0, promoCode: null } as const

const feeOf = (q: ReturnType<typeof quote>, label: string) =>
  q.fees.find((f) => f.label === label)?.amount.amount

describe('food order quote', () => {
  it('adds delivery, service and tip on top of the subtotal', () => {
    const q = quote({ ...base, subtotal: cop(50_000), tip: 4_000 })
    expect(feeOf(q, 'Domicilio')).toBe(DELIVERY_FEE)
    expect(feeOf(q, 'Servicio')).toBe(2_000) // 4 %
    expect(feeOf(q, 'Propina')).toBe(4_000)
    expect(q.total).toEqual(cop(50_000 + DELIVERY_FEE + 2_000 + 4_000))
  })

  it('has no delivery fee for pickup and no tip line for zero tip', () => {
    const q = quote({ ...base, mode: 'pickup', subtotal: cop(50_000) })
    expect(q.fees.map((f) => f.label)).toEqual(['Servicio'])
    expect(q.shortfall).toBe(0)
  })

  it('makes delivery free from the threshold, or with the free-delivery code', () => {
    expect(feeOf(quote({ ...base, subtotal: cop(FREE_DELIVERY_FROM) }), 'Domicilio')).toBe(0)
    expect(
      feeOf(quote({ ...base, subtotal: cop(30_000), promoCode: 'enviogratis' }), 'Domicilio'),
    ).toBe(0)
  })

  it('applies a percentage promo as a negative fee, case-insensitively', () => {
    const q = quote({ ...base, subtotal: cop(40_000), promoCode: 'brasa10' })
    expect(q.discount).toEqual(cop(4_000))
    expect(feeOf(q, 'Promo BRASA10')).toBe(-4_000)
    expect(q.total).toEqual(cop(40_000 + DELIVERY_FEE + 1_600 - 4_000))
  })

  it('ignores unknown codes', () => {
    const q = quote({ ...base, subtotal: cop(40_000), promoCode: 'NOEXISTE' })
    expect(q.discount).toEqual(cop(0))
    expect(q.fees.some((f) => f.label.startsWith('Promo'))).toBe(false)
  })

  it('reports the delivery minimum shortfall only for delivery with items', () => {
    expect(quote({ ...base, subtotal: cop(20_000) }).shortfall).toBe(MIN_DELIVERY_ORDER - 20_000)
    expect(quote({ ...base, subtotal: cop(MIN_DELIVERY_ORDER) }).shortfall).toBe(0)
    expect(quote({ ...base, subtotal: cop(0) }).shortfall).toBe(0)
    expect(quote({ ...base, mode: 'pickup', subtotal: cop(5_000) }).shortfall).toBe(0)
  })
})

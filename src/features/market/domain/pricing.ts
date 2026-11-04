import { subtract, type MarketProduct, type Money } from '@/core/domain'
import { effectivePrice } from './rules'

export interface PriceDisplay {
  /** What the customer pays per unit today. */
  readonly current: Money
  /** Struck-through regular price; present only while a discount applies. */
  readonly regular: Money | null
  readonly savings: Money | null
  readonly percent: number | null
}

/** Everything a price block needs, derived once so cards, PDP, cart and compare agree. */
export function priceDisplay(product: MarketProduct): PriceDisplay {
  const current = effectivePrice(product)
  if (!product.discount || current.amount >= product.price.amount) {
    return { current, regular: null, savings: null, percent: null }
  }
  return {
    current,
    regular: product.price,
    savings: subtract(product.price, current),
    percent: product.discount.percent,
  }
}

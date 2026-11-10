import { MAX_LINE_QUANTITY } from '@/core/cart'
import type { MarketProduct } from '@/core/domain'

/** At or below this many units the product is shown as "last units". */
export const LOW_STOCK_AT = 5

export type StockLevel = 'out' | 'low' | 'in'

export function stockLevel(stock: number): StockLevel {
  return stock <= 0 ? 'out' : stock <= LOW_STOCK_AT ? 'low' : 'in'
}

export function stockLabel(stock: number): string {
  const level = stockLevel(stock)
  if (level === 'out') return 'Agotado'
  if (level === 'low') return stock === 1 ? 'Última unidad' : `Últimas ${String(stock)} unidades`
  return 'Disponible'
}

/** Units still addable: stock minus what the cart already holds, capped by the cart's line limit. */
export function maxAddable(product: MarketProduct, inCart: number): number {
  return Math.max(0, Math.min(product.stock, MAX_LINE_QUANTITY) - inCart)
}

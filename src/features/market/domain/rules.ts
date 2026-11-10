import {
  discountBy,
  multiply,
  type DomainAdapter,
  type MarketProduct,
  type Money,
} from '@/core/domain'
import type { MarketFilters } from '@/core/repositories'

type Rules = Omit<DomainAdapter<'market'>, 'repositories'>

/** Price the customer pays per unit today. */
export function effectivePrice(product: MarketProduct): Money {
  return product.discount ? discountBy(product.price, product.discount.percent) : product.price
}

export const marketRules: Rules = {
  kind: 'market',
  currency: 'COP',

  priceLine({ product, quantity }) {
    const unit = effectivePrice(product)
    const total = multiply(unit, quantity)
    return product.discount
      ? { unit, total, compareAtTotal: multiply(product.price, quantity) }
      : { unit, total }
  },

  describeLine({ product }) {
    const details = [`Vendido por ${product.seller.name}`]
    if (product.discount)
      details.push(`${product.discount.label}: −${String(product.discount.percent)} %`)
    if (product.freeShipping) details.push('Envío gratis')
    return { title: product.title, details }
  },

  validateSelection(product, _selection, quantity) {
    if (product.stock <= 0) {
      return { ok: false, issues: [{ code: 'out-of-stock', message: 'Producto agotado.' }] }
    }
    if (product.stock < quantity) {
      return {
        ok: false,
        issues: [
          {
            code: 'insufficient-stock',
            message: `Solo hay ${String(product.stock)} ${product.stock === 1 ? 'unidad disponible' : 'unidades disponibles'}.`,
          },
        ],
      }
    }
    return { ok: true, selection: { kind: 'market' } }
  },
}

export function matchesMarketFilters(product: MarketProduct, filters: MarketFilters): boolean {
  const { brands, minPrice, maxPrice, minRating, inStockOnly, onSale, freeShipping } = filters
  const price = effectivePrice(product).amount
  if (brands?.length && !brands.includes(product.brand)) return false
  if (minPrice !== undefined && price < minPrice) return false
  if (maxPrice !== undefined && price > maxPrice) return false
  if (minRating !== undefined && product.rating.average < minRating) return false
  if (inStockOnly && product.stock <= 0) return false
  if (onSale && !product.discount) return false
  if (freeShipping && !product.freeShipping) return false
  return true
}

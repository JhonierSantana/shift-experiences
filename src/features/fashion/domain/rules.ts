import {
  multiply,
  type DomainAdapter,
  type FashionProduct,
  type FashionVariant,
} from '@/core/domain'
import type { FashionFilters } from '@/core/repositories'

type Rules = Omit<DomainAdapter<'fashion'>, 'repositories'>

export function findVariant(product: FashionProduct, sku: string): FashionVariant | undefined {
  return product.variants.find((variant) => variant.sku === sku)
}

export const fashionRules: Rules = {
  kind: 'fashion',
  currency: 'COP',

  priceLine({ product, selection, quantity }) {
    const unit = findVariant(product, selection.sku)?.price ?? product.price
    return { unit, total: multiply(unit, quantity) }
  },

  describeLine({ product, selection }) {
    const variant = findVariant(product, selection.sku)
    if (!variant) return { title: product.title, details: [] }
    const color = product.colors.find((c) => c.id === variant.colorId)
    const size = variant.size === 'Única' ? 'Talla única' : `Talla ${variant.size}`
    return { title: product.title, details: color ? [size, color.name] : [size] }
  },

  validateSelection(product, selection, quantity) {
    const variant = findVariant(product, selection.sku)
    if (!variant) {
      return {
        ok: false,
        issues: [{ code: 'unknown-variant', message: 'Elige una talla y un color.' }],
      }
    }
    if (variant.stock <= 0) {
      return {
        ok: false,
        issues: [
          { code: 'out-of-stock', message: `La talla ${variant.size} está agotada en este color.` },
        ],
      }
    }
    if (variant.stock < quantity) {
      return {
        ok: false,
        issues: [
          {
            code: 'insufficient-stock',
            message: `Solo quedan ${String(variant.stock)} unidades en talla ${variant.size}.`,
          },
        ],
      }
    }
    // Normalize: drop any extra keys a caller might have attached.
    return { ok: true, selection: { kind: 'fashion', sku: variant.sku } }
  },
}

export function matchesFashionFilters(product: FashionProduct, filters: FashionFilters): boolean {
  const { collectionId, sizes, colorIds, fits } = filters
  if (collectionId !== undefined && product.collectionId !== collectionId) return false
  if (fits?.length && !fits.includes(product.fit)) return false
  if (!sizes?.length && !colorIds?.length) return true
  // A product matches when some in-stock variant satisfies both facets.
  return product.variants.some(
    (v) =>
      v.stock > 0 &&
      (!sizes?.length || sizes.includes(v.size)) &&
      (!colorIds?.length || colorIds.includes(v.colorId)),
  )
}

import type { FashionColor, FashionProduct, FashionVariant } from '@/core/domain'

export interface SizeOption {
  readonly size: string
  readonly stock: number
  readonly available: boolean
}

export interface ColorOption {
  readonly color: FashionColor
  readonly available: boolean
}

export interface VariantChoice {
  readonly size: string | undefined
  readonly colorId: string | undefined
}

/** Stock at or below this shows a "few left" hint. */
export const LOW_STOCK = 3

export function variantFor(
  product: FashionProduct,
  size: string | undefined,
  colorId: string | undefined,
): FashionVariant | undefined {
  if (size === undefined || colorId === undefined) return undefined
  return product.variants.find((v) => v.size === size && v.colorId === colorId)
}

/** First color that still has stock; falls back to the first color (everything sold out). */
export function defaultColorId(product: FashionProduct): string | undefined {
  const inStock = product.colors.find((color) =>
    product.variants.some((v) => v.colorId === color.id && v.stock > 0),
  )
  return (inStock ?? product.colors[0])?.id
}

/** Sizes in display order for a color; a missing combination counts as sold out. */
export function sizeOptions(product: FashionProduct, colorId: string | undefined): SizeOption[] {
  return product.sizes.map((size) => {
    const stock = variantFor(product, size, colorId)?.stock ?? 0
    return { size, stock, available: stock > 0 }
  })
}

/** A color is available when some variant of it has stock (in the chosen size, when one is chosen). */
export function colorOptions(product: FashionProduct, size: string | undefined): ColorOption[] {
  return product.colors.map((color) => ({
    color,
    available: product.variants.some(
      (v) => v.colorId === color.id && v.stock > 0 && (size === undefined || v.size === size),
    ),
  }))
}

/** Changing color drops a size that is not available in the new color. */
export function chooseColor(
  product: FashionProduct,
  choice: VariantChoice,
  colorId: string,
): VariantChoice {
  const keep = (variantFor(product, choice.size, colorId)?.stock ?? 0) > 0
  return { size: keep ? choice.size : undefined, colorId }
}

export function stockNote(stock: number): string | null {
  if (stock <= 0) return 'Agotada'
  if (stock <= LOW_STOCK) return stock === 1 ? 'Última unidad' : `Quedan ${String(stock)}`
  return null
}

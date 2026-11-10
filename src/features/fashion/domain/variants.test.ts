import type { FashionProduct } from '@/core/domain'
import { products } from '../data/catalog'
import {
  chooseColor,
  colorOptions,
  defaultColorId,
  sizeOptions,
  stockNote,
  variantFor,
} from './variants'

function first(): FashionProduct {
  const [product] = products
  if (!product) throw new Error('fixture missing')
  return product
}

const withSoldOutSize = products.find((p) => {
  const options = sizeOptions(p, defaultColorId(p))
  return options.some((s) => !s.available) && options.some((s) => s.available)
})

/** A size in stock in one color but sold out in another color of the same product. */
function crossColorPair() {
  for (const product of products) {
    for (const inStock of product.variants) {
      const soldOut = product.variants.find(
        (w) => w.size === inStock.size && w.colorId !== inStock.colorId && w.stock === 0,
      )
      if (inStock.stock > 0 && soldOut) return { product, inStock, soldOut }
    }
  }
  throw new Error('fixture missing')
}

describe('variant selection', () => {
  it('has fixture data with a partially sold-out size run', () => {
    expect(withSoldOutSize).toBeDefined()
  })

  it('defaults to a color that has stock whenever the product has any', () => {
    for (const product of products) {
      const id = defaultColorId(product)
      const anyStock = product.variants.some((v) => v.stock > 0)
      const idHasStock = product.variants.some((v) => v.colorId === id && v.stock > 0)
      expect(idHasStock || !anyStock).toBe(true)
    }
  })

  it('marks sizes with no stock as unavailable for the chosen color', () => {
    if (!withSoldOutSize) throw new Error('fixture missing')
    const colorId = defaultColorId(withSoldOutSize)
    for (const option of sizeOptions(withSoldOutSize, colorId)) {
      const stock = variantFor(withSoldOutSize, option.size, colorId)?.stock ?? 0
      expect(option.available).toBe(stock > 0)
    }
  })

  it('treats a size/color combination that is not sold as sold out', () => {
    expect(sizeOptions(first(), 'no-such-color').every((s) => !s.available)).toBe(true)
  })

  it('drops the selected size when the new color does not have it in stock', () => {
    const { product, inStock, soldOut } = crossColorPair()
    expect(
      chooseColor(product, { size: inStock.size, colorId: inStock.colorId }, soldOut.colorId),
    ).toEqual({ size: undefined, colorId: soldOut.colorId })
  })

  it('keeps the size when the new color has it', () => {
    for (const product of products) {
      const a = product.variants.find((v) => v.stock > 0)
      const b = product.variants.find(
        (v) => a && v.size === a.size && v.colorId !== a.colorId && v.stock > 0,
      )
      if (a && b) {
        expect(chooseColor(product, { size: a.size, colorId: a.colorId }, b.colorId).size).toBe(
          a.size,
        )
        return
      }
    }
    throw new Error('fixture missing')
  })

  it('reports color availability, optionally for a size', () => {
    const product = first()
    expect(colorOptions(product, undefined)).toHaveLength(product.colors.length)
    expect(colorOptions(product, 'no-such-size').every((c) => !c.available)).toBe(true)
  })

  it('words the stock hint', () => {
    expect(stockNote(0)).toBe('Agotada')
    expect(stockNote(1)).toBe('Última unidad')
    expect(stockNote(3)).toBe('Quedan 3')
    expect(stockNote(9)).toBeNull()
  })
})

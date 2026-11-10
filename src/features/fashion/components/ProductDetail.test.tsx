import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import type { FashionProduct } from '@/core/domain'
import { ExperienceProvider } from '@/engine'
import { products } from '../data/catalog'
import { fashionCart } from '../domain'
import { defaultColorId, sizeOptions } from '../domain/variants'
import { definition } from '../index'
import { ProductDetail } from './ProductDetail'

function renderDetail(product: FashionProduct) {
  return render(
    <MemoryRouter>
      <ExperienceProvider definition={definition}>
        <ProductDetail product={product} />
      </ExperienceProvider>
    </MemoryRouter>,
  )
}

// A product with a sold-out size and another size with room for two units.
const product = products.find((p) => {
  const options = sizeOptions(p, defaultColorId(p))
  return options.some((s) => !s.available) && options.some((s) => s.stock >= 2)
})

function fixture() {
  if (!product) throw new Error('fixture missing')
  const options = sizeOptions(product, defaultColorId(product))
  const soldOut = options.find((s) => !s.available)
  const available = options.find((s) => s.stock >= 2)
  if (!soldOut || !available) throw new Error('fixture missing')
  return { product, soldOut: soldOut.size, available: available.size }
}

beforeEach(() => {
  fashionCart.store.getState().clear()
})

describe('product detail: add to cart', () => {
  it('disables sold-out sizes so they cannot be chosen', () => {
    const { product, soldOut, available } = fixture()
    renderDetail(product)
    const sizes = screen.getByRole('group', { name: /talla/i })
    expect(within(sizes).getByRole('radio', { name: new RegExp(`^${soldOut}`) })).toBeDisabled()
    expect(within(sizes).getByRole('radio', { name: new RegExp(`^${available}`) })).toBeEnabled()
  })

  it('asks for a size instead of adding an unspecified variant', async () => {
    const { product } = fixture()
    renderDetail(product)
    await userEvent.click(screen.getByRole('button', { name: 'Añadir a la bolsa' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/elige una talla/i)
    expect(fashionCart.store.getState().lines).toHaveLength(0)
  })

  it('adds the chosen variant and confirms it; repeating merges into one line', async () => {
    const { product, available } = fixture()
    renderDetail(product)
    const sizes = screen.getByRole('group', { name: /talla/i })
    await userEvent.click(within(sizes).getByRole('radio', { name: new RegExp(`^${available}`) }))
    const add = screen.getByRole('button', { name: 'Añadir a la bolsa' })
    await userEvent.click(add)

    expect(screen.getByRole('status')).toHaveTextContent(/añadido a tu bolsa/i)
    expect(screen.getByRole('button', { name: 'Ver bolsa' })).toBeInTheDocument()
    const { lines } = fashionCart.store.getState()
    expect(lines).toHaveLength(1)
    expect(lines[0]?.selection.sku).toMatch(new RegExp(`-${available.toUpperCase()}$`))

    await userEvent.click(add)
    expect(fashionCart.store.getState().lines).toHaveLength(1)
    expect(fashionCart.store.getState().lines[0]?.quantity).toBe(2)
  })

  it('surfaces the stock limit as an error instead of a silent no-op', async () => {
    const { product, available } = fixture()
    renderDetail(product)
    const sizes = screen.getByRole('group', { name: /talla/i })
    await userEvent.click(within(sizes).getByRole('radio', { name: new RegExp(`^${available}`) }))
    const add = screen.getByRole('button', { name: 'Añadir a la bolsa' })
    const stock =
      product.variants.find((v) => v.size === available && v.colorId === defaultColorId(product))
        ?.stock ?? 0
    for (let i = 0; i < stock; i += 1) await userEvent.click(add)
    await userEvent.click(add)
    expect(await screen.findByRole('alert')).toHaveTextContent(/solo quedan/i)
  })
})

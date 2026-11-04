import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { products } from '../data/catalog'
import { fashionCart } from '../domain'
import { CartPanel } from './CartPanel'

function renderPanel() {
  return render(
    <MemoryRouter>
      <CartPanel />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  fashionCart.store.getState().clear()
})

describe('cart panel', () => {
  it('shows an empty state with a way back to the collection', () => {
    renderPanel()
    expect(screen.getByText('Tu bolsa está vacía')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver la colección' })).toHaveAttribute(
      'href',
      '/fashion/catalogo',
    )
    expect(screen.queryByRole('link', { name: 'Finalizar compra' })).not.toBeInTheDocument()
  })

  it('lists lines and updates quantity and subtotal', async () => {
    const product = products.find((p) => p.variants.some((v) => v.stock >= 2))
    const variant = product?.variants.find((v) => v.stock >= 2)
    if (!product || !variant) throw new Error('fixture missing')
    fashionCart.store.getState().add(product, { kind: 'fashion', sku: variant.sku })
    renderPanel()

    expect(screen.getByRole('link', { name: product.title })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /añadir una unidad/i }))
    expect(fashionCart.store.getState().lines[0]?.quantity).toBe(2)
    expect(screen.getByRole('link', { name: 'Finalizar compra' })).toHaveAttribute(
      'href',
      '/fashion/checkout',
    )
  })

  it('reports when a line cannot grow past its stock', async () => {
    const product = products.find((p) => p.variants.some((v) => v.stock === 1))
    const variant = product?.variants.find((v) => v.stock === 1)
    if (!product || !variant) throw new Error('fixture missing')
    fashionCart.store.getState().add(product, { kind: 'fashion', sku: variant.sku })
    renderPanel()

    await userEvent.click(screen.getByRole('button', { name: /añadir una unidad/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/solo quedan 1/i)
    expect(fashionCart.store.getState().lines[0]?.quantity).toBe(1)
  })

  it('removes a line and falls back to the empty state', async () => {
    const product = products.find((p) => p.variants.some((v) => v.stock > 0))
    const variant = product?.variants.find((v) => v.stock > 0)
    if (!product || !variant) throw new Error('fixture missing')
    fashionCart.store.getState().add(product, { kind: 'fashion', sku: variant.sku })
    renderPanel()
    await userEvent.click(screen.getByRole('button', { name: /quitar .* de la bolsa/i }))
    expect(screen.getByText('Tu bolsa está vacía')).toBeInTheDocument()
  })
})

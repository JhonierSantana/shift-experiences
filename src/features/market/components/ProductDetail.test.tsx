import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import type { MarketProduct } from '@/core/domain'
import { ExperienceProvider } from '@/engine'
import { createQueryClient } from '@/infra/query'
import { products } from '../data/catalog'
import { marketCart } from '../domain'
import { definition } from '../index'
import { ProductDetail } from './ProductDetail'

function byId(id: string): MarketProduct {
  const product = products.find((p) => p.id === id)
  if (!product) throw new Error(`fixture ${id} missing`)
  return product
}

function renderDetail(product: MarketProduct) {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter>
        <ExperienceProvider definition={definition}>
          <ProductDetail product={product} />
        </ExperienceProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  marketCart.store.getState().clear()
})

describe('product detail: add to cart', () => {
  it('shows the discounted price with the regular price and savings', () => {
    renderDetail(byId('pz-audifonos-q5'))
    expect(screen.getByTestId('price-current')).toHaveTextContent(/344\.925/)
    expect(screen.getByText(/precio anterior/i).closest('s')).toHaveTextContent(/459\.900/)
    expect(screen.getByText(/ahorras/i)).toHaveTextContent(/114\.975/)
  })

  it('limits the quantity stepper to the stock and adds that many units', async () => {
    const scarce = byId('pz-bicicleta-alba') // stock 3
    renderDetail(scarce)
    const more = screen.getByRole('button', { name: 'Añadir una unidad' })
    await userEvent.click(more)
    await userEvent.click(more)
    expect(screen.getByLabelText('Unidades a añadir')).toHaveTextContent('3')
    expect(more).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: 'Añadir al carrito' }))
    expect(screen.getByText(/3 unidades añadidas/i)).toBeInTheDocument()
    const { lines } = marketCart.store.getState()
    expect(lines).toHaveLength(1)
    expect(lines[0]?.quantity).toBe(3)

    // Everything is now in the cart: nothing left to add.
    expect(screen.getByRole('button', { name: /ya tienes todas las unidades/i })).toBeDisabled()
  })

  it('takes stock already in the cart into account', async () => {
    const scarce = byId('pz-bicicleta-alba')
    marketCart.store.getState().add(scarce, { kind: 'market' }, 2)
    renderDetail(scarce)
    expect(screen.getByText(/2 en tu carrito/i)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Añadir al carrito' }))
    expect(marketCart.store.getState().lines[0]?.quantity).toBe(3)
    expect(screen.getByRole('button', { name: /ya tienes todas las unidades/i })).toBeDisabled()
  })

  it('does not offer a sold-out product', () => {
    renderDetail(byId('pz-cargador-gan65')) // stock 0
    expect(screen.getByRole('button', { name: 'Agotado' })).toBeDisabled()
    expect(screen.queryByRole('group', { name: 'Cantidad' })).not.toBeInTheDocument()
    expect(marketCart.store.getState().lines).toHaveLength(0)
  })
})

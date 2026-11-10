import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { ExperienceProvider } from '@/engine'
import { products } from '../data/catalog'
import { marketCart } from '../domain'
import { definition } from '../index'
import { CartPage } from './CartPage'

function renderCart() {
  return render(
    <MemoryRouter>
      <ExperienceProvider definition={definition}>
        <CartPage />
      </ExperienceProvider>
    </MemoryRouter>,
  )
}

const scarce = products.find((p) => p.id === 'pz-bicicleta-alba') // stock 3

beforeEach(() => {
  marketCart.store.getState().clear()
})

describe('cart page', () => {
  it('shows an empty state with a way back to the deals', () => {
    renderCart()
    expect(screen.getByRole('heading', { name: 'Tu carrito está vacío' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Explorar ofertas' })).toHaveAttribute(
      'href',
      '/market',
    )
    expect(screen.queryByRole('link', { name: 'Ir a pagar' })).not.toBeInTheDocument()
  })

  it('reports the stock limit as an alert instead of ignoring the click', async () => {
    if (!scarce) throw new Error('fixture missing')
    marketCart.store.getState().add(scarce, { kind: 'market' }, 3)
    renderCart()
    await userEvent.click(
      screen.getByRole('button', { name: new RegExp(`Añadir una unidad de ${scarce.title}`) }),
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(/solo hay 3 unidades/i)
    expect(marketCart.store.getState().lines[0]?.quantity).toBe(3)
  })

  it('removing the last line returns to the empty state', async () => {
    if (!scarce) throw new Error('fixture missing')
    marketCart.store.getState().add(scarce, { kind: 'market' }, 1)
    renderCart()
    await userEvent.click(
      screen.getByRole('button', { name: new RegExp(`Quitar ${scarce.title} del carrito`) }),
    )
    expect(screen.getByRole('heading', { name: 'Tu carrito está vacío' })).toBeInTheDocument()
  })
})

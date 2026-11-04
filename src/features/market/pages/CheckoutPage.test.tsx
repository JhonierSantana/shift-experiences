import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { ExperienceProvider } from '@/engine'
import { createQueryClient } from '@/infra/query'
import { products } from '../data/catalog'
import { marketBackend, marketCart } from '../domain'
import { checkoutSchema } from '../domain/checkout'
import { definition } from '../index'
import { CheckoutPage } from './CheckoutPage'

function renderCheckout() {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter initialEntries={['/market/checkout']}>
        <ExperienceProvider definition={definition}>
          <Routes>
            <Route path="/market/checkout" element={<CheckoutPage />} />
            <Route path="/market/confirmacion/:orderId" element={<p>Pedido confirmado</p>} />
          </Routes>
        </ExperienceProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function addFixtureLine() {
  const product = products.find((p) => p.stock >= 2)
  if (!product) throw new Error('fixture missing')
  marketCart.store.getState().add(product, { kind: 'market' }, 1)
}

async function fillValidForm() {
  await userEvent.type(screen.getByLabelText('Correo'), 'ana@example.com')
  await userEvent.type(screen.getByLabelText('Nombre completo'), 'Ana Pérez')
  await userEvent.type(screen.getByLabelText('Teléfono'), '3001234567')
  await userEvent.type(screen.getByLabelText('Dirección'), 'Calle 79 #11-45')
  await userEvent.type(screen.getByLabelText('Ciudad'), 'Bogotá')
  await userEvent.type(screen.getByLabelText('Departamento'), 'Cundinamarca')
}

beforeEach(() => {
  marketCart.store.getState().clear()
  marketBackend.reset()
})

describe('checkout schema', () => {
  const valid = {
    email: 'ana@example.com',
    recipient: 'Ana Pérez',
    phone: '3001234567',
    line1: 'Calle 79 #11-45',
    line2: '',
    city: 'Bogotá',
    region: 'Cundinamarca',
    delivery: 'standard',
  }

  it('accepts a complete order', () => {
    expect(checkoutSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects bad email, phone and delivery method', () => {
    const result = checkoutSchema.safeParse({
      ...valid,
      email: 'nope',
      phone: 'abc',
      delivery: 'drone',
    })
    expect(result.success).toBe(false)
    const fields = result.error?.issues.map((i) => String(i.path[0])) ?? []
    expect(fields).toEqual(expect.arrayContaining(['email', 'phone', 'delivery']))
  })
})

describe('market checkout', () => {
  it('shows an empty state instead of a form when the cart is empty', () => {
    renderCheckout()
    expect(screen.getByRole('heading', { name: 'Tu carrito está vacío' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Confirmar pedido' })).not.toBeInTheDocument()
  })

  it('validates the form before placing anything', async () => {
    addFixtureLine()
    renderCheckout()
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar pedido' }))
    expect(await screen.findByText('Escribe un correo válido.')).toBeInTheDocument()
    expect(screen.getByText('Escribe el nombre de quien recibe.')).toBeInTheDocument()
    expect(marketCart.store.getState().lines).toHaveLength(1)
  })

  it('keeps the cart and offers a retry when the order fails, then completes', async () => {
    addFixtureLine()
    renderCheckout()
    await fillValidForm()

    marketBackend.failNext('server', { operation: 'orders.place' })
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar pedido' }))

    expect(await screen.findByText('El servidor tuvo un problema inesperado.')).toBeInTheDocument()
    expect(marketCart.store.getState().lines).toHaveLength(1)

    await userEvent.click(screen.getByRole('button', { name: 'Reintentar pedido' }))
    expect(await screen.findByText('Pedido confirmado')).toBeInTheDocument()
    expect(marketCart.store.getState().lines).toHaveLength(0)
  })
})

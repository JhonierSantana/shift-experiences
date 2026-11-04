import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { ExperienceProvider } from '@/engine'
import { createQueryClient } from '@/infra/query'
import { products } from '../data/catalog'
import { foodBackend, foodCart } from '../domain'
import { DEFAULT_TIP } from '../domain/pricing'
import { definition } from '../index'
import { useOrderUi } from '../state/orderUi'
import { CheckoutPage } from './CheckoutPage'
import { ConfirmationPage } from './ConfirmationPage'

function renderCheckout() {
  // Retries off so a scripted failure surfaces immediately, as it would after the last retry.
  const client = createQueryClient()
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/food/checkout']}>
        <ExperienceProvider definition={definition}>
          <Routes>
            <Route path="/food/checkout" element={<CheckoutPage />} />
            <Route path="/food/pedido/:orderId" element={<ConfirmationPage />} />
          </Routes>
        </ExperienceProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function addFixtureDish() {
  const papas = products.find((p) => p.id === 'bc-papas-rusticas')
  if (!papas) throw new Error('fixture missing')
  foodCart.store.getState().add(papas, { kind: 'food', options: [] }, 8)
}

async function fillContact() {
  await userEvent.type(screen.getByLabelText('Nombre'), 'Ana Pérez')
  await userEvent.type(screen.getByLabelText('Teléfono'), '3001234567')
  await userEvent.type(screen.getByLabelText('Correo'), 'ana@example.com')
}

async function fillAddress() {
  await userEvent.type(screen.getByLabelText('Dirección'), 'Calle 85 #14-20')
}

const confirm = () => screen.getByRole('button', { name: /confirmar pedido|reintentar pedido/i })

beforeEach(() => {
  foodCart.store.getState().clear()
  foodBackend.reset()
  useOrderUi.setState({ mode: 'delivery', tip: DEFAULT_TIP, promoCode: null })
})

describe('food checkout', () => {
  it('shows an empty state instead of a form when the order is empty', () => {
    renderCheckout()
    expect(screen.getByRole('heading', { name: 'Tu pedido está vacío' })).toBeInTheDocument()
    expect(screen.queryByRole('form', { name: /datos del pedido/i })).not.toBeInTheDocument()
  })

  it('validates required fields and does not place the order', async () => {
    addFixtureDish()
    renderCheckout()
    await userEvent.click(confirm())

    expect(await screen.findByText('Escribe tu nombre.')).toBeInTheDocument()
    expect(screen.getByText('Escribe un teléfono válido, solo números.')).toBeInTheDocument()
    expect(screen.getByText('Escribe un correo válido.')).toBeInTheDocument()
    expect(screen.getByText('Escribe la dirección de entrega.')).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre')).toHaveAttribute('aria-invalid', 'true')
    expect(foodCart.store.getState().lines).toHaveLength(1)
  })

  it('does not ask for an address when picking up', async () => {
    addFixtureDish()
    useOrderUi.setState({ mode: 'pickup' })
    renderCheckout()
    expect(screen.queryByLabelText('Dirección')).not.toBeInTheDocument()

    await fillContact()
    await userEvent.click(confirm())
    expect(await screen.findByRole('heading', { name: /gracias, ana/i })).toBeInTheDocument()
    expect(screen.getByText(/listo para recoger/i)).toBeInTheDocument()
  })

  it('keeps the order and offers a retry when placing fails, then succeeds', async () => {
    addFixtureDish()
    renderCheckout()
    await fillContact()
    await fillAddress()

    foodBackend.failNext('server', { operation: 'orders.place' })
    await userEvent.click(confirm())

    const alert = await screen.findByText('El servidor tuvo un problema inesperado.')
    expect(alert).toBeVisible()
    expect(foodCart.store.getState().lines).toHaveLength(1)
    expect(screen.getByRole('button', { name: /reintentar pedido/i })).toBeEnabled()

    await userEvent.click(confirm())
    expect(await screen.findByRole('heading', { name: /gracias, ana/i })).toBeInTheDocument()
    expect(foodCart.store.getState().lines).toHaveLength(0)
    // Fees travel with the order: delivery, service and tip appear on the confirmation.
    expect(screen.getByText('Domicilio')).toBeInTheDocument()
    expect(screen.getByText('Propina')).toBeInTheDocument()
  })
})

import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { ExperienceProvider } from '@/engine'
import { createQueryClient } from '@/infra/query'
import { products } from '../data/catalog'
import { fashionBackend, fashionCart } from '../domain'
import { definition } from '../index'
import { CheckoutPage } from './CheckoutPage'

function renderCheckout() {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter initialEntries={['/fashion/checkout']}>
        <ExperienceProvider definition={definition}>
          <Routes>
            <Route path="/fashion/checkout" element={<CheckoutPage />} />
            <Route path="/fashion/confirmacion/:orderId" element={<p>Pedido confirmado</p>} />
          </Routes>
        </ExperienceProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function addFixtureLine() {
  const product = products.find((p) => p.variants.some((v) => v.stock > 0))
  const variant = product?.variants.find((v) => v.stock > 0)
  if (!product || !variant) throw new Error('fixture missing')
  fashionCart.store.getState().add(product, { kind: 'fashion', sku: variant.sku })
}

beforeEach(() => {
  fashionCart.store.getState().clear()
  fashionBackend.reset()
})

describe('fashion checkout: placing the order', () => {
  it('keeps the bag and offers a retry when the order fails, then completes', async () => {
    addFixtureLine()
    renderCheckout()

    await userEvent.type(screen.getByLabelText('Correo'), 'ana@example.com')
    await userEvent.type(screen.getByLabelText('Nombre completo'), 'Ana Pérez')
    await userEvent.type(screen.getByLabelText('Teléfono'), '3001234567')
    await userEvent.type(screen.getByLabelText('Dirección'), 'Calle 79 #11-45')
    await userEvent.type(screen.getByLabelText('Ciudad'), 'Bogotá')
    await userEvent.type(screen.getByLabelText('Departamento'), 'Cundinamarca')
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Continuar' }))

    fashionBackend.failNext('server', { operation: 'orders.place' })
    await userEvent.click(await screen.findByRole('button', { name: 'Confirmar pedido' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El servidor tuvo un problema inesperado.',
    )
    expect(fashionCart.store.getState().lines).toHaveLength(1)

    await userEvent.click(screen.getByRole('button', { name: 'Reintentar pedido' }))
    expect(await screen.findByText('Pedido confirmado')).toBeInTheDocument()
    expect(fashionCart.store.getState().lines).toHaveLength(0)
  })
})

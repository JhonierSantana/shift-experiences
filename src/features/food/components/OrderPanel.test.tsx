import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { ExperienceProvider } from '@/engine'
import { products } from '../data/catalog'
import { foodCart } from '../domain'
import { DEFAULT_TIP, MIN_DELIVERY_ORDER } from '../domain/pricing'
import { definition } from '../index'
import { useOrderUi } from '../state/orderUi'
import { OrderPanel } from './OrderPanel'

function renderPanel() {
  return render(
    <MemoryRouter>
      <ExperienceProvider definition={definition}>
        <OrderPanel />
      </ExperienceProvider>
    </MemoryRouter>,
  )
}

function item(id: string) {
  const found = products.find((p) => p.id === id)
  if (!found) throw new Error(`fixture ${id} missing`)
  return found
}

beforeEach(() => {
  foodCart.store.getState().clear()
  useOrderUi.setState({ mode: 'delivery', tip: DEFAULT_TIP, promoCode: null })
})

describe('order panel', () => {
  it('shows an empty state with a way to the menu and no checkout', () => {
    renderPanel()
    expect(screen.getByText('Tu pedido está vacío')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver el menú' })).toHaveAttribute('href', '/food/menu')
    expect(screen.queryByRole('link', { name: /ir a pagar/i })).not.toBeInTheDocument()
  })

  it('describes lines with the adapter and offers edit and remove', async () => {
    const burger = item('bc-hamburguesa-brasa')
    foodCart.store.getState().add(
      burger,
      {
        kind: 'food',
        options: [
          { groupId: 'termino', optionId: 'medio' },
          { groupId: 'pan', optionId: 'brioche' },
        ],
        note: 'sin pepinillos',
      },
      2,
    )
    renderPanel()

    expect(screen.getByText('Término de la carne: Jugoso (término medio)')).toBeInTheDocument()
    expect(screen.getByText('Nota: «sin pepinillos»')).toBeInTheDocument()
    const edit = screen.getByRole('link', { name: /editar hamburguesa brasa/i })
    expect(edit.getAttribute('href')).toMatch(/^\/food\/plato\/bc-hamburguesa-brasa\?editar=/)
    expect(screen.getByRole('link', { name: /ir a pagar/i })).toHaveAttribute(
      'href',
      '/food/checkout',
    )

    await userEvent.click(
      screen.getByRole('button', { name: /quitar hamburguesa brasa del pedido/i }),
    )
    expect(screen.getByText('Tu pedido está vacío')).toBeInTheDocument()
  })

  it('enforces the delivery minimum but lets pickup through', async () => {
    foodCart.store.getState().add(item('bc-papas-rusticas'), { kind: 'food', options: [] })
    const subtotal = foodCart.store.getState().lines[0]?.product.price.amount ?? 0
    expect(subtotal).toBeLessThan(MIN_DELIVERY_ORDER)
    renderPanel()

    expect(screen.getByText(/te faltan/i)).toHaveTextContent(/te faltan/i)
    expect(screen.getByRole('button', { name: /aún no alcanzas el mínimo/i })).toBeDisabled()

    await userEvent.click(screen.getByRole('radio', { name: /recoger/i }))
    expect(screen.getByRole('link', { name: /ir a pagar/i })).toBeInTheDocument()
  })

  it('applies and removes promo codes, rejecting unknown ones', async () => {
    foodCart.store.getState().add(item('bc-papas-rusticas'), { kind: 'food', options: [] }, 8)
    renderPanel()

    await userEvent.type(screen.getByRole('textbox', { name: 'Código promocional' }), 'NOPE')
    await userEvent.click(screen.getByRole('button', { name: 'Aplicar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/no existe/i)

    await userEvent.clear(screen.getByRole('textbox', { name: 'Código promocional' }))
    await userEvent.type(screen.getByRole('textbox', { name: 'Código promocional' }), 'brasa10')
    await userEvent.click(screen.getByRole('button', { name: 'Aplicar' }))
    expect(screen.getByText('Promo BRASA10')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /quitar código brasa10/i }))
    expect(screen.queryByText('Promo BRASA10')).not.toBeInTheDocument()
  })

  it('flags a line whose dish is no longer available and blocks checkout', () => {
    const line = item('bc-papas-rusticas')
    foodCart.store.getState().add(line, { kind: 'food', options: [] }, 8)
    // Simulate a menu change after the snapshot was taken.
    foodCart.store.setState((state) => ({
      lines: state.lines.map((l) => ({ ...l, product: { ...l.product, available: false } })),
    }))
    renderPanel()

    expect(screen.getByRole('alert')).toHaveTextContent(/ya no está disponible/i)
    expect(screen.getByRole('button', { name: /revisa tu pedido/i })).toBeDisabled()
  })
})

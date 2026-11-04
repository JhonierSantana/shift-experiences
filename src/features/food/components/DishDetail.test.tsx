import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { formatMoney, money, type FoodItem } from '@/core/domain'
import { ExperienceProvider } from '@/engine'
import { products } from '../data/catalog'
import { foodCart } from '../domain'
import { definition } from '../index'
import { useOrderUi } from '../state/orderUi'
import { DishDetail } from './DishDetail'

const found = products.find((p) => p.id === 'bc-hamburguesa-brasa')
if (!found) throw new Error('fixture missing')
const burger: FoodItem = found

function renderDetail(product: FoodItem = burger) {
  return render(
    <MemoryRouter>
      <ExperienceProvider definition={definition}>
        <DishDetail product={product} layout="page" />
      </ExperienceProvider>
    </MemoryRouter>,
  )
}

/** Intl uses a no-break space; testing-library normalizes the DOM text but not the expected string. */
const cop = (amount: number) => formatMoney(money(amount, 'COP')).replace(/\s/g, ' ')
const group = (name: RegExp) => screen.getByRole('group', { name })

beforeEach(() => {
  foodCart.store.getState().clear()
  useOrderUi.setState({ announcement: '' })
})

describe('dish detail: add to order', () => {
  it('blocks adding while required groups are unmet and says which', async () => {
    renderDetail()
    await userEvent.click(screen.getByRole('button', { name: /añadir al pedido/i }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Elige 1 opción en «Término de la carne».')
    expect(alert).toHaveTextContent('Elige 1 opción en «Pan».')
    expect(foodCart.store.getState().lines).toHaveLength(0)
    // The invalid groups are flagged and receive focus.
    expect(group(/término de la carne/i)).toHaveAttribute('data-invalid', 'true')
    expect(group(/extras/i)).toHaveAttribute('data-invalid', 'false')
  })

  it('marks required groups and shows add-on price deltas', () => {
    renderDetail()
    expect(within(group(/pan/i)).getByText(/requerido/i)).toBeInTheDocument()
    expect(within(group(/extras/i)).getByText(/opcional/i)).toBeInTheDocument()
    expect(within(group(/extras/i)).getByText(`+ ${cop(4_000)}`)).toBeVisible()
  })

  it('updates the live total, then adds the normalized selection once valid', async () => {
    renderDetail()
    await userEvent.click(within(group(/término/i)).getByRole('radio', { name: /jugoso/i }))
    await userEvent.click(within(group(/pan/i)).getByRole('radio', { name: /brioche/i }))
    await userEvent.click(
      within(group(/extras/i)).getByRole('checkbox', { name: /queso costeño/i }),
    )
    await userEvent.click(screen.getByRole('button', { name: /añadir una unidad/i }))

    const add = screen.getByRole('button', { name: /añadir al pedido/i })
    // (34.900 + 4.000) x 2
    expect(add).toHaveTextContent(cop(77_800))

    await userEvent.click(add)
    expect(screen.getByRole('status')).toHaveTextContent(/añadido a tu pedido/i)
    const [line] = foodCart.store.getState().lines
    expect(line?.quantity).toBe(2)
    expect(line?.selection.options).toEqual([
      { groupId: 'termino', optionId: 'medio' },
      { groupId: 'pan', optionId: 'brioche' },
      { groupId: 'extras', optionId: 'queso' },
    ])
  })

  it('stops offering extras once the group maximum is reached', async () => {
    renderDetail()
    const extras = group(/extras/i)
    for (const name of [/queso/i, /tocineta/i, /aguacate/i]) {
      await userEvent.click(within(extras).getByRole('checkbox', { name }))
    }
    expect(within(extras).getByRole('checkbox', { name: /huevo/i })).toBeDisabled()
  })

  it('lists allergens including those added by the chosen options', async () => {
    renderDetail()
    expect(screen.getByText(/contiene: lácteos, mostaza\./i)).toBeInTheDocument()
    await userEvent.click(within(group(/pan/i)).getByRole('radio', { name: /brioche/i }))
    expect(screen.getByText(/contiene: lácteos, mostaza, gluten, huevo\./i)).toBeInTheDocument()
  })

  it('shows nutrition information from the capability', () => {
    renderDetail()
    expect(screen.getByRole('heading', { name: /información nutricional/i })).toBeInTheDocument()
    expect(screen.getByText('890 kcal')).toBeInTheDocument()
  })
})

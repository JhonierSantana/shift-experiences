import { QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { createExperienceDiscovery } from '@/engine'
import { createQueryClient } from '@/infra/query'
import { ROOT_ROUTE_ID, appRoutes } from './routes'

function renderSelector() {
  const router = createMemoryRouter(appRoutes, {
    initialEntries: ['/'],
    patchRoutesOnNavigation: createExperienceDiscovery(ROOT_ROUTE_ID),
  })
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

// Hovering or focusing a door also prefetches that experience's whole chunk (SwitchLink). Under
// jsdom that import is slow enough to stall the next test, and it is not what these tests check,
// so experience loading never settles here (the selector itself is a static route).
vi.mock('@/engine/registry', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return { ...actual, loadExperience: () => new Promise(() => undefined) }
})

describe('selector page', () => {
  it('puts the hovered or focused door in the spotlight, and the demo follows it', async () => {
    renderSelector()
    await screen.findByRole('heading', { level: 1, name: 'SHIFT' })

    // Pointer.
    await userEvent.hover(screen.getByRole('link', { name: 'Entrar a Plaza' }))
    expect(screen.getByRole('button', { name: 'Marketplace', pressed: true })).toBeInTheDocument()

    // Keyboard focus does the same.
    const brasa = screen.getByRole('link', { name: 'Entrar a Brasa & Co.' })
    act(() => {
      brasa.focus()
    })
    expect(screen.getByRole('button', { name: 'Comida', pressed: true })).toBeInTheDocument()
  })
})

import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { createExperienceDiscovery } from '@/engine'
import { createQueryClient } from '@/infra/query'
import { ROOT_ROUTE_ID, appRoutes } from './routes'

function renderAt(path: string) {
  const router = createMemoryRouter(appRoutes, {
    initialEntries: [path],
    patchRoutesOnNavigation: createExperienceDiscovery(ROOT_ROUTE_ID),
  })
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

describe('app routing', () => {
  it('renders the selector at / with the selector scope', async () => {
    renderAt('/')
    expect(await screen.findByRole('heading', { level: 1, name: 'SHIFT' })).toBeInTheDocument()
    expect(document.documentElement.dataset.experience).toBe('selector')
    expect(screen.getAllByRole('link', { name: /Maison Vela|Brasa & Co\.|Plaza/ })).toHaveLength(3)
  })

  it.each([
    ['/fashion', 'fashion', /El arte de lo/],
    ['/food', 'food', /Fuego lento/],
    ['/market', 'market', /Hasta \d+ % de descuento/],
  ])('lazily resolves %s into its experience', async (path, id, heading) => {
    renderAt(path)
    expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument()
    expect(document.documentElement.dataset.experience).toBe(id)
  })

  it('renders the experience NotFound slot override, or the engine default', async () => {
    const { unmount } = renderAt('/fashion/missing')
    expect(await screen.findByRole('heading', { name: 'Pieza fuera de colección' })).toBeVisible()
    unmount()

    renderAt('/food/missing')
    expect(await screen.findByRole('heading', { name: 'Página no encontrada' })).toBeVisible()
  })

  it('shows the root 404 outside any experience', async () => {
    renderAt('/nowhere')
    expect(await screen.findByRole('heading', { name: '404' })).toBeInTheDocument()
  })
})

import { QueryClientProvider } from '@tanstack/react-query'
import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { createExperienceDiscovery } from '@/engine'
import { createQueryClient } from '@/infra/query'
import { ROOT_ROUTE_ID, appRoutes } from './routes'

const router = createBrowserRouter(appRoutes, {
  patchRoutesOnNavigation: createExperienceDiscovery(ROOT_ROUTE_ID),
})

// One client for the whole app: query keys are namespaced per experience,
// so switching experiences keeps each one's cache warm without collisions.
const queryClient = createQueryClient()

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}

import { Outlet, type PatchRoutesOnNavigationFunction, type RouteObject } from 'react-router'
import { ExperienceProvider } from './ExperienceProvider'
import { isExperienceId, loadExperience } from './registry'
import { Slot } from './slots'
import type { ExperienceDefinition } from './types'

function ExperienceNotFound() {
  return <Slot name="NotFound" />
}

export function createExperienceRoute(definition: ExperienceDefinition): RouteObject {
  const Shell = definition.shell
  function ExperienceRoot() {
    return (
      <ExperienceProvider definition={definition}>
        <Shell>
          <Outlet />
        </Shell>
      </ExperienceProvider>
    )
  }
  return {
    // Stable id: React Router dedupes patched routes by id.
    id: `experience:${definition.id}`,
    path: definition.id,
    Component: ExperienceRoot,
    children: [...definition.routes, { path: '*', Component: ExperienceNotFound }],
  }
}

/**
 * Lazy route discovery: the static tree only knows the selector. The first
 * navigation into /<experienceId> loads that experience's chunk and patches
 * its subtree under `parentRouteId`.
 */
export function createExperienceDiscovery(parentRouteId: string): PatchRoutesOnNavigationFunction {
  return async ({ path, patch }) => {
    const segment = path.split('/').find(Boolean)
    if (!isExperienceId(segment)) return
    const definition = await loadExperience(segment)
    patch(parentRouteId, [createExperienceRoute(definition)])
  }
}

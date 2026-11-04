import { manifest as fashionManifest } from '@/features/fashion/manifest'
import { manifest as foodManifest } from '@/features/food/manifest'
import { manifest as marketManifest } from '@/features/market/manifest'
import type { ExperienceDefinition, ExperienceId, ExperienceManifest } from './types'

// The only module allowed to import experiences (enforced by ESLint).
// Manifests are eager (copy + tokens.css); definitions are split into one chunk per experience.
type Loader = () => Promise<ExperienceDefinition>

interface RegistryEntry {
  readonly manifest: ExperienceManifest
  readonly load: Loader
}

const entries: Readonly<Record<ExperienceId, RegistryEntry>> = {
  fashion: {
    manifest: fashionManifest,
    load: () => import('@/features/fashion').then((m) => m.definition),
  },
  food: {
    manifest: foodManifest,
    load: () => import('@/features/food').then((m) => m.definition),
  },
  market: {
    manifest: marketManifest,
    load: () => import('@/features/market').then((m) => m.definition),
  },
}

const experienceIds = Object.keys(entries) as ExperienceId[]

export function isExperienceId(value: unknown): value is ExperienceId {
  return typeof value === 'string' && (experienceIds as string[]).includes(value)
}

export function listExperiences(): readonly ExperienceManifest[] {
  return experienceIds.map((id) => entries[id].manifest)
}

export function getManifest(id: ExperienceId): ExperienceManifest {
  return entries[id].manifest
}

const cache = new Map<ExperienceId, Promise<ExperienceDefinition>>()

/** Loads (once) and validates an experience definition. Safe to call for prefetching. */
export function loadExperience(id: ExperienceId): Promise<ExperienceDefinition> {
  let pending = cache.get(id)
  if (!pending) {
    pending = entries[id].load().then((definition) => {
      if (definition.id !== id) {
        throw new Error(`Experience "${id}" resolved a definition with id "${definition.id}"`)
      }
      if (definition.domain.kind !== id) {
        throw new Error(`Experience "${id}" declares domain "${definition.domain.kind}"`)
      }
      return definition
    })
    // Drop failed loads so a later attempt (e.g. after a flaky network) can retry.
    pending.catch(() => cache.delete(id))
    cache.set(id, pending)
  }
  return pending
}

export function experiencePath(scope: ExperienceId | 'selector'): string {
  return scope === 'selector' ? '/' : `/${scope}`
}

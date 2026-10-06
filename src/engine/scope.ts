import { useLayoutEffect } from 'react'
import type { ExperienceScope } from './types'

// Bridges React commits and the switch transition: the transition's update
// callback waits until the target scope has actually been painted into the DOM.
const waiters = new Map<ExperienceScope, Set<() => void>>()

export function applyScope(scope: ExperienceScope, root: HTMLElement = document.documentElement) {
  root.dataset.experience = scope
  const pending = waiters.get(scope)
  if (!pending) return
  waiters.delete(scope)
  pending.forEach((resolve) => {
    resolve()
  })
}

/** Resolves once `scope` is applied, or after `timeoutMs` so a transition never hangs. */
export function whenScopeApplied(scope: ExperienceScope, timeoutMs = 3000): Promise<void> {
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer)
      waiters.get(scope)?.delete(done)
      resolve()
    }
    const timer = setTimeout(done, timeoutMs)
    const set = waiters.get(scope) ?? new Set()
    set.add(done)
    waiters.set(scope, set)
  })
}

/** Marks the document with the active scope (activates its tokens.css). */
export function useDocumentScope(scope: ExperienceScope) {
  useLayoutEffect(() => {
    applyScope(scope)
  }, [scope])
}

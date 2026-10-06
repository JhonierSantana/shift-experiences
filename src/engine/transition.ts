import type { SwitchOrigin, SwitchTransitionSpec, SwitchViewport } from './types'

export type SwitchMode = 'view-transition' | 'reduced-motion' | 'fallback-fade'

interface ViewTransitionHandle {
  readonly ready: Promise<void>
  readonly finished: Promise<void>
  readonly updateCallbackDone: Promise<void>
}

/** Everything the helper touches in the browser, injectable for tests. */
export interface TransitionEnvironment {
  readonly root: HTMLElement
  readonly startViewTransition: ((update: () => Promise<void>) => ViewTransitionHandle) | null
  readonly prefersReducedMotion: boolean
  readonly viewport: SwitchViewport
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

export function browserTransitionEnvironment(): TransitionEnvironment {
  const doc = document
  return {
    root: doc.documentElement,
    startViewTransition:
      typeof doc.startViewTransition === 'function'
        ? (update) => doc.startViewTransition(update)
        : null,
    prefersReducedMotion: prefersReducedMotion(),
    viewport: { width: window.innerWidth, height: window.innerHeight },
  }
}

/** Opacity only: no movement, so it is acceptable under prefers-reduced-motion. */
export const FADE_KEYFRAMES: Keyframe[] = [{ opacity: 0 }, { opacity: 1 }]
const REDUCED_FADE_MS = 180

function animate(
  root: HTMLElement,
  keyframes: Keyframe[],
  options: KeyframeAnimationOptions,
): void {
  // jsdom and very old engines lack WAAPI; the switch still happens, just unanimated.
  if (typeof root.animate === 'function') root.animate(keyframes, { fill: 'backwards', ...options })
}

/**
 * Runs `update` (which must resolve once the new scope is in the DOM) inside a
 * View Transition animated with the target brand's choreography.
 * - reduced motion: short cross-fade instead of the brand clip-path/overlay
 * - no View Transitions API: update, then fade the document in
 */
export async function runSwitchTransition(
  update: () => Promise<void>,
  spec: SwitchTransitionSpec,
  origin: SwitchOrigin | null,
  env: TransitionEnvironment = browserTransitionEnvironment(),
): Promise<SwitchMode> {
  const { root, viewport } = env
  const point = origin ?? { x: viewport.width / 2, y: viewport.height / 2 }

  if (!env.startViewTransition) {
    await update()
    animate(root, FADE_KEYFRAMES, {
      duration: env.prefersReducedMotion ? REDUCED_FADE_MS : Math.round(spec.duration / 2),
      easing: 'ease-out',
    })
    return 'fallback-fade'
  }

  const transition = env.startViewTransition(update)
  const ready = transition.ready.then(
    () => true,
    () => false,
  )
  // Surface update errors (e.g. failed chunk load) to the caller.
  await transition.updateCallbackDone

  const mode: SwitchMode = env.prefersReducedMotion ? 'reduced-motion' : 'view-transition'
  if (await ready) {
    if (mode === 'reduced-motion') {
      animate(root, FADE_KEYFRAMES, {
        duration: REDUCED_FADE_MS,
        easing: 'linear',
        pseudoElement: '::view-transition-new(root)',
      })
    } else {
      const timing = { duration: spec.duration, easing: spec.easing }
      animate(root, spec.enter(point, viewport), {
        ...timing,
        pseudoElement: '::view-transition-new(root)',
      })
      if (spec.exit) {
        animate(root, spec.exit(point, viewport), {
          ...timing,
          pseudoElement: '::view-transition-old(root)',
        })
      }
    }
  }
  await transition.finished.catch(() => undefined)
  return mode
}

/** Radius that covers the whole viewport from `origin` (for circular reveals). */
export function coveringRadius(origin: SwitchOrigin, viewport: SwitchViewport): number {
  return Math.hypot(
    Math.max(origin.x, viewport.width - origin.x),
    Math.max(origin.y, viewport.height - origin.y),
  )
}

/** Neutral entrance used when returning to the selector. */
export const selectorSwitchSpec: SwitchTransitionSpec = {
  duration: 420,
  easing: 'cubic-bezier(0.2, 0, 0, 1)',
  enter: () => [
    { opacity: 0, transform: 'scale(1.03)' },
    { opacity: 1, transform: 'scale(1)' },
  ],
}

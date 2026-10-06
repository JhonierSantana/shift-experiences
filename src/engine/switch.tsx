import {
  useCallback,
  useState,
  type ComponentPropsWithoutRef,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { useHref, useNavigate } from 'react-router'
import { useOptionalExperience } from './context'
import { prefetchFonts } from './fonts'
import { experiencePath, isExperienceId, listExperiences, loadExperience } from './registry'
import { whenScopeApplied } from './scope'
import { runSwitchTransition, selectorSwitchSpec } from './transition'
import type { ExperienceScope, SwitchOrigin } from './types'

/** Every shell renders <main id={MAIN_CONTENT_ID} tabIndex={-1}> so focus can land there after a switch. */
export const MAIN_CONTENT_ID = 'main'

function prefetchScope(scope: ExperienceScope) {
  if (!isExperienceId(scope)) return
  loadExperience(scope).then(
    (definition) => {
      prefetchFonts(definition.fonts)
    },
    () => undefined, // prefetch is best-effort; the real switch reports errors
  )
}

export function useExperienceSwitch() {
  const navigate = useNavigate()
  const current: ExperienceScope = useOptionalExperience()?.id ?? 'selector'
  const [pending, setPending] = useState<ExperienceScope | null>(null)

  const switchTo = useCallback(
    async (target: ExperienceScope, origin: SwitchOrigin | null = null) => {
      if (target === current) return
      const path = experiencePath(target)
      setPending(target)
      try {
        // Load the target first so the transition never snapshots a loading state.
        const spec = isExperienceId(target)
          ? (await loadExperience(target)).motion.switchIn
          : selectorSwitchSpec
        await runSwitchTransition(
          async () => {
            const applied = whenScopeApplied(target)
            void navigate(path)
            await applied
          },
          spec,
          origin,
        )
      } catch {
        // Chunk failed or transition aborted: plain navigation lets the router's error UI take over.
        void navigate(path)
      } finally {
        setPending(null)
      }
      document.getElementById(MAIN_CONTENT_ID)?.focus({ preventScroll: true })
    },
    [current, navigate],
  )

  return {
    current,
    pending,
    experiences: listExperiences(),
    switchTo,
    prefetch: prefetchScope,
  }
}

function isPlainLeftClick(event: MouseEvent) {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
}

function originOf(event: MouseEvent<HTMLAnchorElement>): SwitchOrigin {
  // Keyboard activation reports detail 0 and (0,0) coordinates: use the link's center instead.
  if (event.detail > 0) return { x: event.clientX, y: event.clientY }
  const rect = event.currentTarget.getBoundingClientRect()
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
}

interface SwitchLinkProps extends Omit<ComponentPropsWithoutRef<'a'>, 'href'> {
  readonly to: ExperienceScope
  readonly children: ReactNode
}

/**
 * Real link (works with new-tab, copy link, no JS) that performs the branded
 * switch transition on plain clicks. Prefetches the target on hover/focus.
 */
export function SwitchLink({ to, children, onClick, ...rest }: SwitchLinkProps) {
  const { current, switchTo, prefetch } = useExperienceSwitch()
  const href = useHref(experiencePath(to))

  return (
    <a
      {...rest}
      href={href}
      aria-current={to === current ? 'page' : undefined}
      onPointerEnter={() => {
        prefetch(to)
      }}
      onFocus={() => {
        prefetch(to)
      }}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented || !isPlainLeftClick(event)) return
        event.preventDefault()
        void switchTo(to, originOf(event))
      }}
    >
      {children}
    </a>
  )
}

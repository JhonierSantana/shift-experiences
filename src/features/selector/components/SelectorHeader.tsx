import { m } from 'motion/react'
import { EASE } from '../model'
import { PauseToggle } from './PauseToggle'

interface SelectorHeaderProps {
  readonly reduced: boolean
  /** The user paused the rotation (WCAG 2.2.2: moving content needs a way to pause it). */
  readonly stopped: boolean
  readonly onToggleStopped: () => void
}

/**
 * One quiet line that names the page and says what it is. The doors below are the opening of
 * the page, so the header stays small and never competes with them.
 */
export function SelectorHeader({ reduced, stopped, onToggleStopped }: SelectorHeaderProps) {
  return (
    <m.header
      initial={reduced ? false : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: EASE }}
      className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 px-gutter py-4"
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="font-display text-xl font-bold tracking-tight">SHIFT</h1>
        <p className="text-sm text-ink-muted sm:text-base">
          <span aria-hidden="true" className="mr-3 text-line-strong">
            ·
          </span>
          Una sola app, tres negocios.
        </p>
      </div>
      <div className="flex items-center gap-1">
        <p className="hidden items-center gap-2 text-sm text-ink-muted sm:flex">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-(--shift-crimson)" />
          Experience Engine · v0.1
        </p>
        {reduced ? null : <PauseToggle stopped={stopped} onToggle={onToggleStopped} />}
      </div>
    </m.header>
  )
}

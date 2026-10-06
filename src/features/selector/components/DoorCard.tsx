import { m } from 'motion/react'
import { SwitchLink, type ExperienceManifest } from '@/engine'
import { PANEL_RADIUS, SHOWCASE } from '../model'
import { DoorScene } from './DoorScene'

interface DoorCardProps {
  readonly experience: ExperienceManifest
  readonly index: number
  /** This brand is in the spotlight: its border takes the brand color and the card lifts. */
  readonly lit: boolean
  readonly reduced: boolean
}

/** One entrance to a business, painted inside that brand's own token scope. */
export function DoorCard({ experience, index, lit, reduced }: DoorCardProps) {
  const delay = 0.55 + index * 0.14
  return (
    <m.li
      initial={reduced ? false : { y: -72, opacity: 0, scale: 0.97 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 120,
        damping: 15,
        mass: 0.9,
        delay,
        opacity: { duration: 0.4, delay },
      }}
      className="transition-[flex-grow] duration-(--shift-duration-slow) ease-brand lg:flex-1 lg:focus-within:flex-[1.6] lg:hover:flex-[1.6]"
    >
      <SwitchLink
        to={experience.id}
        className={`group block h-full ${PANEL_RADIUS} transition-transform duration-(--shift-duration-slow) ease-brand ${
          lit ? 'lg:-translate-y-2' : ''
        }`}
      >
        <div
          data-experience={experience.id}
          className={`flex h-full min-h-72 flex-col justify-between gap-6 ${PANEL_RADIUS} border-2 bg-surface p-5 font-body text-ink transition-[transform,border-color] duration-(--shift-duration-base) ease-brand group-hover:border-accent group-focus-visible:border-accent group-active:scale-[0.99] lg:p-7 ${
            lit ? 'border-accent' : 'border-line-strong'
          }`}
        >
          <p className="text-sm text-ink-muted">
            <span aria-hidden="true">0{index + 1} · </span>
            {experience.sector}
          </p>
          <div className="min-h-0 flex-1">
            <DoorScene id={experience.id} />
          </div>
          <div className="grid gap-2">
            <p className="font-display text-[clamp(2rem,3.6vw,3.5rem)] leading-none">
              {experience.name}
            </p>
            <p className="text-ink-muted">{experience.tagline}</p>
            <p className="text-sm text-ink-muted lg:max-h-0 lg:overflow-hidden lg:opacity-0 lg:transition-[max-height,opacity] lg:duration-(--shift-duration-base) lg:ease-brand lg:group-focus-visible:max-h-12 lg:group-focus-visible:opacity-100 lg:group-hover:max-h-12 lg:group-hover:opacity-100">
              {SHOWCASE[experience.id].highlight}
            </p>
          </div>
          <p className="inline-flex min-h-11 items-center gap-2 font-semibold text-accent">
            Entrar a {experience.name}
            <span
              aria-hidden="true"
              className="inline-block transition-transform duration-(--shift-duration-base) ease-brand group-hover:translate-x-1"
            >
              →
            </span>
          </p>
        </div>
      </SwitchLink>
    </m.li>
  )
}

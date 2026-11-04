import { useId, type CSSProperties } from 'react'
import { m } from 'motion/react'
import { SwitchLink, type ExperienceManifest } from '@/engine'
import { usePointerGlow } from '../hooks'
import { PANEL_RADIUS, SHOWCASE } from '../model'
import { DoorScene } from './DoorScene'

interface DoorCardProps {
  readonly experience: ExperienceManifest
  readonly index: number
  /** This brand is in the spotlight: its border takes the brand color and the card lifts. */
  readonly lit: boolean
  readonly reduced: boolean
  /** Another door has the pointer or focus: this one steps back a little. */
  readonly dimmed: boolean
  /** Pointer or focus entered this door: put its brand in the spotlight (headline, demo). */
  readonly onActivate: () => void
}

/** One entrance to a business, painted inside that brand's own token scope. */
export function DoorCard({ experience, index, lit, reduced, dimmed, onActivate }: DoorCardProps) {
  const delay = 0.2 + index * 0.12
  const trackPointer = usePointerGlow(!reduced)
  const brand = SHOWCASE[experience.id]
  // The link is named by its call to action and described by the tagline, not by all its text.
  const nameId = useId()
  const descriptionId = useId()
  return (
    <m.li
      onPointerEnter={onActivate}
      onFocus={onActivate}
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
        aria-labelledby={nameId}
        aria-describedby={descriptionId}
        className={`group block h-full ${PANEL_RADIUS} transition-[transform,opacity] duration-(--shift-duration-slow) ease-brand ${
          lit ? 'lg:-translate-y-2' : ''
        } ${dimmed ? 'lg:opacity-75' : ''}`}
      >
        <div
          onPointerMove={trackPointer}
          style={{ '--door-accent': brand.accent } as CSSProperties}
          className={`relative flex h-full min-h-72 flex-col justify-between gap-6 ${PANEL_RADIUS} border-2 bg-surface-raised p-5 text-ink transition-[transform,border-color] duration-(--shift-duration-slow) ease-brand group-hover:border-(--door-accent) group-focus-visible:border-(--door-accent) group-active:scale-[0.99] lg:p-7 ${
            lit ? 'border-(--door-accent)' : 'border-line-strong'
          }`}
        >
          <div className="grid gap-2">
            <p className="text-sm text-ink-muted">
              <span aria-hidden="true">0{index + 1} · </span>
              {experience.sector}
            </p>
            <p className={`${brand.nameFont} text-[clamp(2rem,3.6vw,3.5rem)] leading-none`}>
              {experience.name}
            </p>
          </div>
          <div className="min-h-0 flex-1">
            <DoorScene id={experience.id} />
          </div>
          <div className="grid gap-3">
            <p id={descriptionId} className="text-ink-muted">
              {experience.tagline}
            </p>
            <ul className="grid grid-cols-3 gap-2">
              {brand.facts.map((fact) => (
                <li
                  key={fact.label}
                  className="grid min-w-0 gap-0.5 rounded-xl border border-line bg-surface px-2.5 py-2 break-words hyphens-auto"
                >
                  <span className="text-[0.7rem] text-ink-muted">{fact.label}</span>
                  <span className="text-xs font-semibold text-ink sm:text-sm">{fact.value}</span>
                </li>
              ))}
            </ul>
          </div>
          <p
            id={nameId}
            className="inline-flex min-h-11 items-center gap-2 font-semibold text-accent"
          >
            Entrar a {experience.name}
            <span
              aria-hidden="true"
              className="inline-block transition-transform duration-(--shift-duration-base) ease-brand group-hover:translate-x-1"
            >
              →
            </span>
          </p>
          <span
            aria-hidden="true"
            className={`door-glow ${lit ? 'opacity-60' : 'opacity-0'} group-hover:opacity-100 group-focus-visible:opacity-100`}
          />
          <span
            aria-hidden="true"
            className="door-edge opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
          />
        </div>
      </SwitchLink>
    </m.li>
  )
}

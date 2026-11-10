import { type CSSProperties } from 'react'
import { m } from 'motion/react'
import { SwitchLink, type ExperienceManifest } from '@/engine'
import { usePointerGlow } from '../hooks'
import { SHOWCASE } from '../model'
import { DoorScene } from './DoorScene'

interface DoorCardProps {
  readonly experience: ExperienceManifest
  readonly index: number
  /** This brand is in the spotlight: its border takes the brand color. */
  readonly lit: boolean
  readonly reduced: boolean
  /** Another card has the pointer or focus: this one steps back a little. */
  readonly dimmed: boolean
  /** Opened by a click or tap (hover and focus open it too, through CSS). */
  readonly open: boolean
  readonly onToggle: () => void
  /** Pointer or focus entered this card: put its brand in the spotlight (headline, demo). */
  readonly onActivate: () => void
}

const sheetFill = (open: boolean) =>
  `transition-colors duration-(--shift-duration-slow) ease-brand group-focus-within/folder:bg-ink group-hover/folder:bg-ink ${
    open ? 'bg-ink' : 'bg-surface-raised'
  }`

/**
 * One entrance to a business: a single card whose photo fills it, covered by a folder sheet. At
 * rest the sheet is tall and dark and shows the number, the name and the description. On hover,
 * focus or click it drops and turns light, uncovering the photo; the arrow enters the business.
 */
export function DoorCard({
  experience,
  index,
  lit,
  reduced,
  dimmed,
  open,
  onToggle,
  onActivate,
}: DoorCardProps) {
  const delay = 0.2 + index * 0.12
  const trackPointer = usePointerGlow(!reduced)
  const brand = SHOWCASE[experience.id]
  const active = lit || open
  return (
    <m.li
      onPointerEnter={onActivate}
      onFocus={onActivate}
      initial={reduced ? false : { y: -48, opacity: 0, scale: 0.98 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 120,
        damping: 15,
        mass: 0.9,
        delay,
        opacity: { duration: 0.4, delay },
      }}
      className={`group/folder transition-opacity duration-(--shift-duration-slow) ease-brand ${
        dimmed && !open ? 'lg:opacity-75' : ''
      }`}
    >
      <div
        onPointerMove={trackPointer}
        style={{ '--door-accent': brand.accent } as CSSProperties}
        className={`group h-[27rem] [--drop:7rem] rounded-[2.25rem] border-2 p-1.5 transition-colors duration-(--shift-duration-slow) ease-brand group-focus-within/folder:border-(--door-accent) group-hover/folder:border-(--door-accent) lg:h-[30rem] lg:[--drop:8rem] ${
          active ? 'border-(--door-accent)' : 'border-line-strong'
        }`}
      >
        <div className="relative h-full overflow-hidden rounded-[1.75rem] bg-surface text-ink">
          <div className="absolute inset-0 [&>div]:min-h-0! [&>div]:rounded-none!">
            <DoorScene id={experience.id} />
          </div>
          <span
            aria-hidden="true"
            className={`door-glow ${active ? 'opacity-60' : 'opacity-0'} group-hover:opacity-100`}
          />

          {/* Tab, fillet and body overlap by 1px so no seam shows between them. */}
          <div
            className={`absolute -inset-x-px -bottom-px h-[80%] transition-transform duration-(--shift-duration-slow) ease-brand motion-reduce:transition-none group-focus-within/folder:translate-y-(--drop) group-hover/folder:translate-y-(--drop) ${
              open ? 'translate-y-(--drop) text-surface' : 'text-ink'
            } group-focus-within/folder:text-surface group-hover/folder:text-surface`}
          >
            <span
              aria-hidden="true"
              className={`absolute top-0 left-0 h-14 w-[54%] rounded-tl-[1.75rem] rounded-tr-[1.25rem] ${sheetFill(open)}`}
            />
            <span
              aria-hidden="true"
              style={{
                maskImage:
                  'radial-gradient(circle at 100% 0, transparent 1.25rem, #000 calc(1.25rem + 0.5px))',
              }}
              className={`absolute top-[calc(2.5rem-1.25rem)] left-[calc(54%-1px)] h-[calc(1.25rem+1px)] w-[calc(1.25rem+1px)] ${sheetFill(open)}`}
            />
            <span
              aria-hidden="true"
              className={`absolute inset-x-0 top-10 bottom-0 rounded-tr-[1.75rem] ${sheetFill(open)}`}
            />

            <button
              type="button"
              aria-expanded={open}
              aria-label={`${open ? 'Cerrar' : 'Abrir'} ${experience.name}`}
              onClick={onToggle}
              className={`${brand.nameFont} absolute top-4 left-6 text-5xl leading-none tabular-nums lg:text-6xl`}
            >
              <span aria-hidden="true">0{index + 1}</span>
            </button>
            <SwitchLink
              to={experience.id}
              aria-label={`Entrar a ${experience.name}`}
              className="absolute top-14 right-4 grid size-12 place-items-center rounded-full border border-current/30 text-xl transition-[transform,background-color,color] duration-(--shift-duration-base) ease-brand hover:scale-110 hover:border-(--door-accent) hover:bg-(--door-accent) hover:text-surface"
            >
              <span aria-hidden="true">↗</span>
            </SwitchLink>

            <div
              className={`absolute inset-x-0 bottom-0 grid gap-2 px-6 pb-6 transition-transform duration-(--shift-duration-slow) ease-brand motion-reduce:transition-none group-focus-within/folder:-translate-y-(--drop) group-hover/folder:-translate-y-(--drop) ${
                open ? '-translate-y-(--drop)' : ''
              }`}
            >
              <p className="text-sm opacity-80">{experience.sector}</p>
              <p className={`${brand.nameFont} text-[clamp(1.5rem,2vw,2rem)] leading-none`}>
                {experience.name}
              </p>
              <div className="grid text-sm">
                <p
                  className={`col-start-1 row-start-1 opacity-80 transition-opacity duration-(--shift-duration-base) group-focus-within/folder:opacity-0 group-hover/folder:opacity-0 ${
                    open ? 'opacity-0' : ''
                  }`}
                >
                  {experience.tagline}
                </p>
                <p
                  className={`col-start-1 row-start-1 transition-opacity duration-(--shift-duration-base) group-focus-within/folder:opacity-80 group-hover/folder:opacity-80 ${
                    open ? 'opacity-80' : 'opacity-0'
                  }`}
                >
                  {brand.blurb}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </m.li>
  )
}

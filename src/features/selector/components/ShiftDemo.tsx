import type { ReactNode } from 'react'
import { m, useReducedMotion, type Variants } from 'motion/react'
import type { ExperienceId } from '@/engine'
import { showcaseMedia } from '@/infra/mock'
import {
  EASE,
  EXPERIENCE_IDS,
  PANEL_INNER_RADIUS,
  PANEL_OUTLINE_RX,
  PANEL_RADIUS,
  SHOWCASE,
  rise,
  stagger,
} from '../model'

interface DemoOption {
  readonly id: ExperienceId
  readonly label: string
}

interface ShiftDemoProps {
  readonly options: readonly DemoOption[]
  readonly activeIndex: number
  readonly onSelect: (index: number) => void
  readonly running: boolean
  readonly cycleMs: number
}

/** Entrance: the outline draws itself while the blocks inside start rising, overlapping, not in turn. */
const frame = stagger(0.05, 0.1)

/** The frame's outline fills in one continuous pass, with an even pace so no stretch shows early. */
const outline: Variants = {
  hidden: { pathLength: 0 },
  visible: { pathLength: 1, transition: { duration: 2.6, ease: [0.45, 0, 0.35, 1] } },
}
/** Images unveil from the top down, like a curtain lifting. */
const unveil: Variants = {
  hidden: { clipPath: 'inset(0 0 100% 0)' },
  visible: { clipPath: 'inset(0 0 0% 0)', transition: { duration: 1.2, ease: EASE } },
}
const line: Variants = {
  hidden: { scaleX: 0 },
  visible: { scaleX: 1, transition: { duration: 1.2, ease: EASE } },
}
const group = stagger(0, 0.09)

const SOFT = 'transition-[opacity,transform,filter] duration-1000 ease-brand'

/** Stacks every brand's content in one grid cell and cross-fades them: no remounts, no flicker. */
function Swap({
  active,
  render,
}: {
  readonly active: ExperienceId
  readonly render: (id: ExperienceId) => ReactNode
}) {
  return (
    <div className="grid">
      {EXPERIENCE_IDS.map((id) => (
        <div
          key={id}
          aria-hidden={id === active ? undefined : true}
          className={`col-start-1 row-start-1 ${SOFT} ${
            id === active
              ? 'blur-0 scale-100 opacity-100'
              : 'pointer-events-none scale-[0.985] opacity-0 blur-[3px]'
          }`}
        >
          {render(id)}
        </div>
      ))}
    </div>
  )
}

function ProductCard({ id }: { readonly id: ExperienceId }) {
  const brand = SHOWCASE[id]
  const media = showcaseMedia[brand.product.media]
  return (
    <div
      data-experience={id}
      className={`overflow-hidden ${PANEL_INNER_RADIUS} border border-white/15 bg-surface font-body text-ink`}
    >
      <m.div variants={unveil} className="relative h-28 overflow-hidden bg-surface-raised sm:h-32">
        <img
          src={media.src}
          alt=""
          width={media.width}
          height={media.height}
          loading="lazy"
          decoding="async"
          className="size-full object-cover"
        />
      </m.div>
      <m.div variants={group} className="grid gap-3 p-4">
        <m.div variants={rise} className="grid gap-1">
          <p className="font-display text-2xl leading-tight">{brand.product.title}</p>
          <p className="text-sm text-ink-muted">{brand.product.meta}</p>
        </m.div>
        <m.div variants={rise} className="flex items-center justify-between gap-3">
          <p className="font-semibold tabular-nums">{brand.product.price}</p>
          <span className="rounded-control bg-accent px-4 py-2 text-sm font-semibold text-accent-ink">
            {brand.product.action}
          </span>
        </m.div>
      </m.div>
    </div>
  )
}

/**
 * Inspector: four live readouts of the active brand's tokens. The tiles sit inside the active
 * token scope, so shape, color and motion are the real values, not screenshots of them.
 */
function Inspector({ active }: { readonly active: ExperienceId }) {
  const brand = SHOWCASE[active]
  const tile =
    'grid min-w-0 content-between gap-3 rounded-xl border border-line bg-surface-raised p-3'
  const label = 'text-[0.7rem] text-ink-muted'
  return (
    <m.div variants={group} className="grid grid-cols-4 gap-2 sm:gap-3">
      <m.div variants={rise} className={tile}>
        <p className={label}>Forma</p>
        <div
          data-experience={active}
          className="flex items-end gap-3 bg-transparent transition-all duration-1000 ease-brand"
        >
          <span className="block size-10 border-2 border-accent bg-surface rounded-card transition-[border-radius,border-color] duration-1000 ease-brand" />
          <span className="block h-6 w-12 rounded-control bg-accent transition-[border-radius,background-color] duration-1000 ease-brand" />
        </div>
        <Swap
          active={active}
          render={(id) => (
            <p className="font-mono text-[0.65rem] leading-4 break-words">{SHOWCASE[id].radius}</p>
          )}
        />
      </m.div>

      <m.div variants={rise} className={tile}>
        <p className={label}>Tipografía</p>
        <Swap
          active={active}
          render={(id) => (
            <p
              data-experience={id}
              className="font-display text-4xl leading-none text-ink"
              style={{ color: SHOWCASE[id].accent }}
            >
              Aa
            </p>
          )}
        />
        <Swap
          active={active}
          render={(id) => (
            <p className="font-mono text-[0.65rem] leading-4 break-words">{SHOWCASE[id].font}</p>
          )}
        />
      </m.div>

      <m.div variants={rise} className={tile}>
        <p className={label}>Paleta</p>
        <div className="flex flex-wrap gap-1">
          {brand.palette.map((color, index) => (
            <span
              key={index}
              className="size-5 rounded-full border border-white/20 transition-colors duration-1000 ease-brand"
              style={{ backgroundColor: color, transitionDelay: `${String(index * 60)}ms` }}
            />
          ))}
        </div>
        <Swap
          active={active}
          render={(id) => (
            <p className="font-mono text-[0.65rem] leading-4 break-words">
              {SHOWCASE[id].palette[2]}
            </p>
          )}
        />
      </m.div>

      <m.div variants={rise} className={tile}>
        <p className={label}>Movimiento</p>
        <div data-experience={active} className="relative h-6 rounded-full bg-surface/10">
          <span className="demo-track absolute inset-y-1 left-1 w-4 rounded-full bg-accent" />
        </div>
        <Swap
          active={active}
          render={(id) => (
            <p className="font-mono text-[0.65rem] leading-4 break-words">{SHOWCASE[id].motion}</p>
          )}
        />
      </m.div>
    </m.div>
  )
}

/**
 * Shows the idea of SHIFT in one frame: a single card whose structure never changes while the
 * token scope swaps underneath it, plus an inspector that reads the swapped tokens live.
 */
export function ShiftDemo({ options, activeIndex, onSelect, running, cycleMs }: ShiftDemoProps) {
  const reduced = useReducedMotion() ?? false
  const active = options[activeIndex]
  if (!active) return null

  return (
    <m.section
      variants={frame}
      initial={reduced ? false : 'hidden'}
      whileInView="visible"
      viewport={{ once: true, amount: 0.12, margin: '0px 0px -18% 0px' }}
      aria-labelledby="shift-demo-title"
      className={`relative grid gap-6 ${PANEL_RADIUS} p-5 lg:grid-cols-12 lg:gap-8 lg:p-6`}
    >
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 size-full overflow-visible"
      >
        <m.rect
          variants={outline}
          x="1"
          y="1"
          width="calc(100% - 2px)"
          height="calc(100% - 2px)"
          rx={PANEL_OUTLINE_RX}
          pathLength={1}
          fill="none"
          strokeWidth="2"
          className="stroke-line-strong"
        />
      </svg>
      <div className="grid content-start gap-4 lg:col-span-5">
        <m.h2
          variants={rise}
          id="shift-demo-title"
          className="font-['Instrument_Serif'] text-[clamp(2.25rem,4vw,3.75rem)] leading-[0.95] tracking-tight"
        >
          El mismo componente,{' '}
          <em
            className="block italic transition-colors duration-1000 ease-brand"
            style={{ color: SHOWCASE[active.id].accent }}
          >
            tres identidades.
          </em>
        </m.h2>
        <m.p variants={rise} className="max-w-md text-sm leading-6 text-ink-muted">
          Esta tarjeta nunca cambia de estructura. Cambian los tokens que la visten: forma,
          tipografía, color y movimiento. Así se construye cada negocio sobre el mismo núcleo.
        </m.p>
        <m.div
          variants={rise}
          role="group"
          aria-label="Ver la tarjeta en"
          className="flex flex-wrap gap-2"
        >
          {options.map((option, index) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={index === activeIndex}
              onClick={() => {
                onSelect(index)
              }}
              style={
                index === activeIndex
                  ? {
                      backgroundColor: SHOWCASE[option.id].palette[2],
                      borderColor: SHOWCASE[option.id].palette[2],
                      color: SHOWCASE[option.id].palette[0],
                    }
                  : { borderColor: `${SHOWCASE[option.id].palette[2]}99` }
              }
              className={`relative flex min-h-11 items-center gap-2 overflow-hidden rounded-control border px-4 text-sm transition-[background-color,border-color,color] duration-700 ease-brand ${
                index === activeIndex ? '' : 'text-ink-muted hover:text-ink'
              }`}
            >
              <span
                aria-hidden="true"
                className="size-2 rounded-full transition-colors duration-700 ease-brand"
                style={{
                  backgroundColor:
                    index === activeIndex
                      ? SHOWCASE[option.id].palette[0]
                      : SHOWCASE[option.id].palette[2],
                }}
              />
              {option.label}
              {index === activeIndex && running ? (
                <span
                  key={option.id}
                  aria-hidden="true"
                  className="demo-progress absolute inset-x-0 bottom-0 h-0.5 origin-left"
                  style={{
                    animationDuration: `${String(cycleMs)}ms`,
                    backgroundColor: `${SHOWCASE[option.id].palette[0]}b3`,
                  }}
                />
              ) : null}
            </button>
          ))}
        </m.div>

        <m.dl variants={group} className="grid gap-3">
          <m.div variants={line} className="h-px origin-left bg-line" />
          {(
            [
              ['Navegación', 'navigation'],
              ['Datos', 'data'],
              ['Movimiento', 'movement'],
            ] as const
          ).map(([term, key]) => (
            <m.div key={term} variants={rise} className="grid gap-1">
              <dt className="text-xs text-ink-muted">{term}</dt>
              <dd>
                <Swap active={active.id} render={(id) => <p>{SHOWCASE[id][key]}</p>} />
              </dd>
            </m.div>
          ))}
        </m.dl>
      </div>

      <div className="grid content-start gap-3 lg:col-span-7">
        <m.div variants={rise} aria-hidden="true">
          <Swap active={active.id} render={(id) => <ProductCard id={id} />} />
        </m.div>
        <div aria-hidden="true">
          <Inspector active={active.id} />
        </div>
      </div>
    </m.section>
  )
}

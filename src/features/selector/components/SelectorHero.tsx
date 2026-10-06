import { AnimatePresence, m } from 'motion/react'
import type { ExperienceId, ExperienceManifest } from '@/engine'
import { EASE, FACTS, SHOWCASE, WORDMARK, rise, stagger } from '../model'

/** The lead block starts while the wordmark is still rising, so the two read as one entrance. */
const LEAD = stagger(0.5)

interface SelectorHeroProps {
  readonly experiences: readonly ExperienceManifest[]
  /** The brand currently in the spotlight (drives the rotating word). */
  readonly litId: ExperienceId | undefined
  readonly reduced: boolean
}

export function SelectorHero({ experiences, litId, reduced }: SelectorHeroProps) {
  return (
    <section aria-labelledby="selector-title" className="grid gap-6 lg:grid-cols-12 lg:items-end">
      <h1
        id="selector-title"
        aria-label="SHIFT"
        className="flex gap-[0.03em] text-[clamp(4.5rem,16vw,13rem)] leading-[0.85] lg:col-span-6"
      >
        {WORDMARK.map(({ letter, className }, index) => (
          // The five letters are fixed and never reorder, so the index is a stable key.
          <span key={index} aria-hidden="true" className="block overflow-hidden pb-[0.06em]">
            <m.span
              className={`block ${className}`}
              initial={reduced ? false : { y: '105%' }}
              animate={{ y: '0%' }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.1 + index * 0.07 }}
            >
              {letter}
            </m.span>
          </span>
        ))}
      </h1>

      <m.div
        variants={LEAD}
        initial={reduced ? false : 'hidden'}
        animate="visible"
        className="grid gap-4 lg:col-span-6"
      >
        <m.p
          variants={rise}
          className="text-[clamp(1.05rem,4.6vw,1.875rem)] leading-tight font-medium whitespace-nowrap lg:text-[clamp(1.25rem,2.1vw,1.875rem)]"
        >
          Una app que se convierte en{' '}
          <span className="relative inline-grid align-bottom">
            {/* Invisible copies of every word hold the slot at the longest width: no layout jump. */}
            {experiences.map((experience) => (
              <span
                key={experience.id}
                aria-hidden="true"
                className={`invisible col-start-1 row-start-1 ${SHOWCASE[experience.id].wordFont}`}
              >
                {SHOWCASE[experience.id].word}.
              </span>
            ))}
            <AnimatePresence mode="wait" initial={false}>
              {litId ? (
                <m.span
                  key={litId}
                  className={`col-start-1 row-start-1 ${SHOWCASE[litId].wordFont}`}
                  style={{ color: SHOWCASE[litId].accent }}
                  initial={reduced ? false : { y: '60%', opacity: 0 }}
                  animate={{ y: '0%', opacity: 1 }}
                  exit={reduced ? { opacity: 0 } : { y: '-60%', opacity: 0 }}
                  transition={{ duration: 0.35, ease: EASE }}
                >
                  {SHOWCASE[litId].word}.
                </m.span>
              ) : null}
            </AnimatePresence>
          </span>
        </m.p>

        <m.p variants={rise} className="max-w-lg leading-7 text-ink-muted">
          Mismo núcleo técnico, tres negocios que no se parecen: cambian la navegación, el diseño,
          las animaciones y hasta la forma de los datos. Elige uno y compáralos.
        </m.p>

        <m.ul
          variants={rise}
          className="flex flex-wrap gap-3"
          aria-label="Qué cambia en cada experiencia"
        >
          {FACTS.map((fact) => (
            <li
              key={fact}
              className="rounded-control border border-line-strong px-3 py-1.5 text-sm text-ink-muted"
            >
              {fact}
            </li>
          ))}
        </m.ul>
      </m.div>
    </section>
  )
}

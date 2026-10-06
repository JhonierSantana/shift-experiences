import { useState } from 'react'
import { LazyMotion, domAnimation, useReducedMotion } from 'motion/react'
import { MAIN_CONTENT_ID, useDocumentScope, useExperienceSwitch, useFonts } from '@/engine'
import { DoorCard, PauseToggle, SelectorHero, ShiftDemo } from '../components'
import { useSpotlight } from '../hooks'
import { CYCLE_MS, SELECTOR_FONTS } from '../model'
import '../selector.css'
import '../tokens.css'

/** Landing: each door is rendered inside its brand's token scope, as a live preview. */
export function SelectorPage() {
  useDocumentScope('selector')
  useFonts(SELECTOR_FONTS)
  const reduced = useReducedMotion() ?? false
  const { experiences } = useExperienceSwitch()
  const count = experiences.length

  /** The pointer or keyboard focus is inside the doors: hold the spotlight still. */
  const [interacting, setInteracting] = useState(false)
  /** The user pressed "Pausar animación". */
  const [stopped, setStopped] = useState(false)

  const cycling = !reduced && !interacting && !stopped
  const [lit, setLit] = useSpotlight(count, cycling)
  const litExperience = experiences[lit]

  return (
    <LazyMotion features={domAnimation} strict>
      <div className="flex min-h-dvh flex-col">
        <title>SHIFT · One application. Three businesses.</title>
        <meta name="theme-color" content="#0f0f0e" />

        <header className="flex items-center justify-between px-gutter py-3">
          <p className="font-display text-lg font-bold tracking-tight">SHIFT</p>
          <div className="flex items-center gap-1">
            <p className="text-sm text-ink-muted">Experience Engine · v0.1</p>
            {reduced ? null : (
              <PauseToggle
                stopped={stopped}
                onToggle={() => {
                  setStopped((value) => !value)
                }}
              />
            )}
          </div>
        </header>

        <main
          id={MAIN_CONTENT_ID}
          tabIndex={-1}
          className="flex flex-1 flex-col gap-6 px-gutter pb-gutter lg:gap-8"
        >
          <SelectorHero experiences={experiences} litId={litExperience?.id} reduced={reduced} />

          <nav aria-label="Experiencias">
            <ul
              className="grid gap-3 lg:flex lg:min-h-112"
              onPointerEnter={() => {
                setInteracting(true)
              }}
              onPointerLeave={() => {
                setInteracting(false)
              }}
              onFocus={() => {
                setInteracting(true)
              }}
              onBlur={() => {
                setInteracting(false)
              }}
            >
              {experiences.map((experience, index) => (
                <DoorCard
                  key={experience.id}
                  experience={experience}
                  index={index}
                  lit={!reduced && !interacting && litExperience?.id === experience.id}
                  reduced={reduced}
                />
              ))}
            </ul>
          </nav>

          <ShiftDemo
            options={experiences.map((experience) => ({
              id: experience.id,
              label: experience.sector,
            }))}
            activeIndex={lit}
            onSelect={setLit}
            running={cycling}
            cycleMs={CYCLE_MS}
          />
        </main>
      </div>
    </LazyMotion>
  )
}

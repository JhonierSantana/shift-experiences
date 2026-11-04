import { useState } from 'react'
import { LazyMotion, domAnimation, useReducedMotion } from 'motion/react'
import { MAIN_CONTENT_ID, useDocumentScope, useExperienceSwitch, useFonts } from '@/engine'
import { DoorCard, SelectorHeader, ShiftDemo } from '../components'
import { useSpotlight } from '../hooks'
import { CYCLE_MS, SELECTOR_FONTS } from '../model'
import '../selector.css'
import '../tokens.css'

/**
 * Landing. The three doors are the opening of the page: a one-line header names it, and the
 * doors fill the first screen so choosing a business is the first thing you can do.
 */
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
      <div className="selector-stage flex min-h-dvh flex-col">
        <title>SHIFT · One application. Three businesses.</title>
        <meta name="theme-color" content="#06110c" />

        <SelectorHeader
          reduced={reduced}
          stopped={stopped}
          onToggleStopped={() => {
            setStopped((value) => !value)
          }}
        />

        <main
          id={MAIN_CONTENT_ID}
          tabIndex={-1}
          className="flex flex-1 flex-col gap-6 px-gutter pb-gutter lg:gap-8"
        >
          <nav aria-label="Experiencias">
            <ul
              className="grid gap-3 lg:flex lg:h-[calc(100dvh-5.5rem)] lg:min-h-[36rem] lg:max-h-[56rem]"
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
                  lit={(!reduced || interacting) && litExperience?.id === experience.id}
                  dimmed={interacting && litExperience?.id !== experience.id}
                  reduced={reduced}
                  onActivate={() => {
                    setLit(index)
                  }}
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

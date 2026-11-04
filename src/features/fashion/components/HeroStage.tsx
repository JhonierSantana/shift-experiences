import { useRef } from 'react'
import {
  LazyMotion,
  domAnimation,
  m,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'motion/react'
import { Link } from 'react-router'
import { buttonOutline, eyebrow } from './styles'

const LINES = ['El arte de lo', 'esencial'] as const
const EASE = [0.22, 1, 0.36, 1] as const

/**
 * Home hero. The single orchestrated moment of the page: the headline rises line by line
 * from behind a mask, then the two campaign stills drift apart as the page scrolls.
 * Stills are art-directed gradients until real campaign photography exists.
 */
export function HeroStage() {
  const ref = useRef<HTMLElement>(null)
  const reduced = useReducedMotion() ?? false
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const lift = useTransform(scrollYProgress, [0, 1], ['0%', reduced ? '0%' : '-14%'])
  const sink = useTransform(scrollYProgress, [0, 1], ['0%', reduced ? '0%' : '22%'])

  return (
    <LazyMotion features={domAnimation} strict>
      <section
        ref={ref}
        aria-labelledby="fashion-hero-title"
        className="relative isolate grid min-h-[92dvh] grid-cols-12 items-end gap-x-4 overflow-hidden px-gutter pt-16 pb-12 lg:pb-16"
      >
        <div className="col-span-12 mb-10 lg:col-span-7 lg:mb-0">
          <h1
            id="fashion-hero-title"
            className="font-display text-[clamp(3.75rem,10.5vw,10.5rem)] leading-[0.88] tracking-tight"
          >
            {LINES.map((line, index) => (
              <span key={line} className="block overflow-hidden pb-[0.08em]">
                <m.span
                  className={`block ${index === 1 ? 'italic lg:pl-[1.2em]' : ''}`}
                  initial={reduced ? false : { y: '110%' }}
                  animate={{ y: '0%' }}
                  transition={{ duration: 1.1, ease: EASE, delay: 0.15 + index * 0.14 }}
                >
                  {line}
                </m.span>{' '}
              </span>
            ))}
          </h1>
          <m.div
            className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.9 }}
          >
            <Link to="/fashion/catalogo" className={buttonOutline}>
              Descubrir la colección
            </Link>
            <p className="max-w-[26ch] text-sm text-ink-muted">
              Otoño–Invierno 2026. Lana, lino y seda en tonos de tierra.
            </p>
          </m.div>
        </div>

        <div className="relative col-span-12 h-[62vw] max-h-[44rem] min-h-80 lg:col-span-5 lg:h-[78dvh]">
          <m.div
            aria-hidden="true"
            style={{ y: lift }}
            className="absolute inset-y-0 right-0 w-[78%] bg-[linear-gradient(165deg,#e4d3bd_0%,#b58b69_48%,#3d2d23_100%)]"
          />
          <m.div
            aria-hidden="true"
            style={{ y: sink }}
            className="absolute bottom-[-6%] left-0 aspect-4/5 w-[46%] border-8 border-surface bg-[linear-gradient(200deg,#9a4a2e_0%,#5a2330_100%)]"
          />
          <p
            className={`${eyebrow} absolute top-0 left-0 hidden origin-top-left translate-x-5 rotate-90 text-ink-muted lg:block`}
          >
            Campaña Otoño — Invierno
          </p>
        </div>
      </section>
    </LazyMotion>
  )
}

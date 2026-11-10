import { useState } from 'react'
import {
  LazyMotion,
  domAnimation,
  m,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'motion/react'
import { Link } from 'react-router'
import type { FashionCollection } from '@/core/domain'
import { eyebrow } from './styles'

/** Art-directed stills per collection until real photography exists. */
const STILLS: Readonly<Record<string, string>> = {
  'lino-crudo': 'linear-gradient(160deg, #f1e8d6 0%, #cdb98f 55%, #8d7a55 100%)',
  'sastreria-blanda': 'linear-gradient(200deg, #8d8a84 0%, #4b3327 60%, #1f1d1b 100%)',
  'noche-de-arcilla': 'linear-gradient(170deg, #b0694a 0%, #5a2330 55%, #26304a 100%)',
}
const FALLBACK_STILL = 'linear-gradient(160deg, #d8c6b0, #3a2c23)'

interface CollectionIndexProps {
  readonly collections: readonly FashionCollection[]
}

/**
 * Typographic index of collections. On fine pointers a still follows the cursor with a spring;
 * keyboard focus drives the same still, so the preview never depends on hover alone.
 */
export function CollectionIndex({ collections }: CollectionIndexProps) {
  const reduced = useReducedMotion() ?? false
  const [active, setActive] = useState<string | null>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 220, damping: 28, mass: 0.6 })
  const sy = useSpring(y, { stiffness: 220, damping: 28, mass: 0.6 })

  return (
    <LazyMotion features={domAnimation} strict>
      <div
        className="relative"
        onPointerMove={(event) => {
          if (event.pointerType !== 'mouse') return
          const box = event.currentTarget.getBoundingClientRect()
          x.set(event.clientX - box.left)
          y.set(event.clientY - box.top)
        }}
        onPointerLeave={() => {
          setActive(null)
        }}
      >
        <ol>
          {collections.map((collection, index) => (
            <li key={collection.id} className="border-b border-line">
              <Link
                to={`/fashion/catalogo?coleccion=${collection.id}`}
                className="group grid gap-3 py-8 lg:grid-cols-12 lg:items-baseline lg:gap-6"
                onPointerEnter={(event) => {
                  if (event.pointerType === 'mouse') setActive(collection.id)
                }}
                onFocus={(event) => {
                  const box = event.currentTarget.getBoundingClientRect()
                  const parent = event.currentTarget.closest('ol')?.getBoundingClientRect()
                  x.set(box.width * 0.62)
                  y.set(box.top - (parent?.top ?? 0))
                  setActive(collection.id)
                }}
                onBlur={() => {
                  setActive(null)
                }}
              >
                <span
                  className={`flex items-baseline gap-6 font-display text-5xl transition-[transform,color] duration-(--shift-duration-base) ease-brand sm:text-7xl lg:col-span-8 ${
                    active !== null && active !== collection.id ? 'text-ink-muted/50' : ''
                  } group-hover:translate-x-3`}
                >
                  <span className="font-body text-sm text-ink-muted tabular-nums">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {collection.name}
                </span>
                <span className="text-ink-muted lg:col-span-4">
                  <span className={`${eyebrow} block`}>{collection.season}</span>
                  <span className="mt-2 block max-w-prose">{collection.statement}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>

        {reduced ? null : (
          <m.div
            aria-hidden="true"
            style={{ x: sx, y: sy }}
            animate={{ opacity: active ? 1 : 0, scale: active ? 1 : 0.92 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none absolute top-0 left-0 z-10 hidden h-72 w-56 -translate-x-1/2 -translate-y-1/2 overflow-hidden [@media(hover:hover)]:block"
          >
            {collections.map((collection) => (
              <m.div
                key={collection.id}
                className="absolute inset-0"
                style={{ backgroundImage: STILLS[collection.id] ?? FALLBACK_STILL }}
                animate={{ opacity: active === collection.id ? 1 : 0 }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </m.div>
        )}
      </div>
    </LazyMotion>
  )
}

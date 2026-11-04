import { useId, useRef } from 'react'
import { Link } from 'react-router'
import type { MarketProduct } from '@/core/domain'
import { Slot } from '@/engine'
import { ChevronIcon } from './Icons'
import { sectionTitle } from './styles'

interface ProductCarouselProps {
  readonly title: string
  readonly products: readonly MarketProduct[]
  readonly seeAllTo?: string
}

/** Native scroll-snap row (touch swipe, wheel, keyboard via focusable cards) plus prev/next on desktop. */
export function ProductCarousel({ title, products, seeAllTo }: ProductCarouselProps) {
  const titleId = useId()
  const scroller = useRef<HTMLUListElement>(null)
  if (products.length === 0) return null

  const scrollBy = (direction: -1 | 1) => {
    const el = scroller.current
    if (el) el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: 'smooth' })
  }

  return (
    <section aria-labelledby={titleId} className="grid gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id={titleId} className={sectionTitle}>
          {title}
        </h2>
        <div className="flex items-center gap-2">
          {seeAllTo ? (
            <Link to={seeAllTo} className="font-semibold text-accent hover:underline">
              Ver todo
            </Link>
          ) : null}
          <div className="hidden gap-1 lg:flex">
            <button
              type="button"
              aria-label={`${title}: anteriores`}
              onClick={() => {
                scrollBy(-1)
              }}
              className="grid size-9 place-items-center rounded-full border border-line bg-surface-raised hover:border-ink"
            >
              <ChevronIcon direction="left" />
            </button>
            <button
              type="button"
              aria-label={`${title}: siguientes`}
              onClick={() => {
                scrollBy(1)
              }}
              className="grid size-9 place-items-center rounded-full border border-line bg-surface-raised hover:border-ink"
            >
              <ChevronIcon />
            </button>
          </div>
        </div>
      </div>
      <ul
        ref={scroller}
        className="plaza-scroller -mx-gutter flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth px-gutter pb-1 lg:mx-0 lg:px-0"
      >
        {products.map((product) => (
          <li key={product.id} className="w-44 shrink-0 snap-start sm:w-52">
            <Slot name="ProductCard" product={product} />
          </li>
        ))}
      </ul>
    </section>
  )
}

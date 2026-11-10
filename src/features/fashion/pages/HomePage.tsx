import { useState } from 'react'
import { Link } from 'react-router'
import { Capability, Slot } from '@/engine'
import { useCollections, useLooks, useProductList } from '@/infra/query'
import { CollectionIndex } from '../components/CollectionIndex'
import { HeroStage } from '../components/HeroStage'
import { LookBoard } from '../components/LookBoard'
import { ErrorState, ProductGridSkeleton } from '../components/States'
import { buttonOutline, eyebrow, textLink } from '../components/styles'
import { fashionData } from '../domain'

const NEW_ARRIVALS = { sort: 'newest', pageSize: 4 } as const

/** Staggered editorial placement on desktop; a plain 2-column grid below it. */
const ARRIVAL_LAYOUT = [
  'lg:col-span-7',
  'lg:col-span-4 lg:col-start-9 lg:mt-40',
  'lg:col-span-4 lg:col-start-2',
  'lg:col-span-5 lg:col-start-7 lg:mt-24',
] as const

function FeaturedCollections() {
  const { data, isPending, isError, error, refetch } = useCollections(fashionData)
  return (
    <section
      aria-labelledby="fashion-collections-title"
      className="border-t border-line px-gutter py-section"
    >
      <h2 id="fashion-collections-title" className={`${eyebrow} mb-10 text-ink-muted`}>
        Colecciones
      </h2>
      {isPending ? (
        <ol role="status" aria-label="Cargando colecciones" className="animate-pulse">
          <span className="sr-only">Cargando colecciones…</span>
          {Array.from({ length: 3 }, (_, i) => (
            <li
              key={i}
              aria-hidden="true"
              className="grid gap-3 border-b border-line py-6 lg:grid-cols-12 lg:items-baseline lg:gap-6"
            >
              <div className="h-10 w-2/3 bg-surface-raised lg:col-span-7" />
              <div className="grid gap-2 lg:col-span-4">
                <div className="h-3 w-1/4 bg-surface-raised" />
                <div className="h-4 w-full bg-surface-raised" />
              </div>
            </li>
          ))}
        </ol>
      ) : isError ? (
        <ErrorState
          error={error}
          onRetry={() => {
            void refetch()
          }}
        />
      ) : (
        <CollectionIndex collections={data} />
      )}
    </section>
  )
}

function ShopTheLook() {
  const { data, isPending, isError, error, refetch } = useLooks(fashionData)
  const [index, setIndex] = useState(0)

  return (
    <section
      aria-labelledby="fashion-looks-title"
      className="border-t border-line bg-surface-raised px-gutter py-section"
    >
      <div className="mb-10 flex flex-wrap items-baseline justify-between gap-4">
        <h2 id="fashion-looks-title" className="font-display text-4xl sm:text-6xl">
          Shop the look
        </h2>
        <p className={`${eyebrow} text-ink-muted`}>Looks completos, pieza a pieza</p>
      </div>
      {isPending ? (
        <div role="status" aria-label="Cargando looks" className="grid animate-pulse gap-10">
          <span className="sr-only">Cargando looks…</span>
          <div aria-hidden="true" className="flex gap-x-8 gap-y-2 overflow-hidden">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="h-5 w-28 shrink-0 bg-surface-raised" />
            ))}
          </div>
          <div aria-hidden="true" className="aspect-4/5 w-full max-w-md bg-surface-raised" />
        </div>
      ) : isError ? (
        <ErrorState
          error={error}
          onRetry={() => {
            void refetch()
          }}
        />
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-10">
          <ul aria-label="Elegir look" className="flex gap-x-8 gap-y-2 overflow-x-auto pb-2">
            {data.map((look, i) => (
              <li key={look.id} className="shrink-0">
                <button
                  type="button"
                  aria-pressed={i === index}
                  onClick={() => {
                    setIndex(i)
                  }}
                  className={`${eyebrow} min-h-11 border-b py-2 transition-colors duration-(--shift-duration-base) ease-brand ${
                    i === index ? 'border-ink' : 'border-transparent text-ink-muted hover:text-ink'
                  }`}
                >
                  {String(i + 1).padStart(2, '0')} · {look.title}
                </button>
              </li>
            ))}
          </ul>
          {data[index] ? (
            <LookBoard key={data[index].id} look={data[index]} headingLevel="h3" />
          ) : null}
        </div>
      )}
    </section>
  )
}

function NewArrivals() {
  const { data, isPending, isError, error, refetch } = useProductList(fashionData, NEW_ARRIVALS)
  return (
    <section id="novedades" aria-labelledby="fashion-new-title" className="px-gutter py-section">
      <div className="mb-12 flex items-baseline justify-between gap-6">
        <h2 id="fashion-new-title" className="font-display text-4xl sm:text-6xl">
          Novedades
        </h2>
        <Link to="/fashion/catalogo?orden=newest" className={textLink}>
          Ver todo
        </Link>
      </div>
      {isPending ? (
        <ProductGridSkeleton count={4} />
      ) : isError ? (
        <ErrorState
          error={error}
          onRetry={() => {
            void refetch()
          }}
        />
      ) : (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 lg:grid-cols-12 lg:gap-y-16">
          {data.items.map((product, index) => (
            <li key={product.id} className={ARRIVAL_LAYOUT[index] ?? 'lg:col-span-3'}>
              <Slot name="ProductCard" product={product} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function HomePage() {
  return (
    <>
      <HeroStage />

      <NewArrivals />
      <FeaturedCollections />
      <Capability name="shopTheLook">
        <ShopTheLook />
      </Capability>

      <section aria-labelledby="fashion-journal-title" className="px-gutter py-section">
        <h2 id="fashion-journal-title" className={`${eyebrow} mb-8 text-ink-muted`}>
          Journal
        </h2>
        <blockquote className="max-w-4xl font-display text-3xl leading-tight italic sm:text-5xl">
          “Vestir menos, pero mejor. Cada pieza debe sostener el silencio.”
        </blockquote>
        <Link to="/fashion/catalogo" className={`${buttonOutline} mt-10`}>
          Explorar la colección
        </Link>
      </section>
    </>
  )
}

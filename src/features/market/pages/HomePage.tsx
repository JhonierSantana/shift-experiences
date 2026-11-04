import { useMemo } from 'react'
import { Link } from 'react-router'
import { formatMoney, type MarketProduct } from '@/core/domain'
import { Capability } from '@/engine'
import { DiscountBadge } from '../components/Price'
import { MediaImage } from '../components/MediaImage'
import { ProductCarousel } from '../components/ProductCarousel'
import { ErrorState } from '../components/States'
import { buttonPrimary, sectionTitle, tag } from '../components/styles'
import { priceDisplay } from '../domain/pricing'
import { useCatalog, useDepartments } from '../lib/useCatalog'

const byDiscount = (a: MarketProduct, b: MarketProduct) =>
  (b.discount?.percent ?? 0) - (a.discount?.percent ?? 0)

/** Products carrying `tag` first, then the best rated of the rest, so a row is never empty. */
function pick(items: readonly MarketProduct[], wanted: string, size: number): MarketProduct[] {
  const tagged = items.filter((p) => p.tags.includes(wanted))
  const rest = items
    .filter((p) => !p.tags.includes(wanted) && p.stock > 0)
    .sort((a, b) => b.rating.average - a.rating.average || b.rating.count - a.rating.count)
  return [...tagged, ...rest].slice(0, size)
}

function HomeSkeleton() {
  return (
    <div role="status" className="grid gap-4">
      <span className="sr-only">Cargando ofertas…</span>
      <div aria-hidden="true" className="grid animate-pulse gap-2 lg:grid-cols-3">
        <div className="h-56 rounded-card bg-surface-raised lg:col-span-2" />
        <div className="h-56 rounded-card bg-surface-raised" />
      </div>
      <div aria-hidden="true" className="grid animate-pulse grid-cols-2 gap-2 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-64 rounded-card bg-surface-raised" />
        ))}
      </div>
    </div>
  )
}

export function HomePage() {
  const catalog = useCatalog()
  const { departments } = useDepartments()
  const items = useMemo(() => catalog.data?.items ?? [], [catalog.data])

  const deals = useMemo(
    () =>
      items
        .filter((p) => p.discount && p.stock > 0)
        .sort(byDiscount)
        .slice(0, 6),
    [items],
  )
  const recommended = useMemo(() => pick(items, 'recomendado', 10), [items])
  const bestSellers = useMemo(() => pick(items, 'más vendido', 10), [items])
  const topDeal = deals[0]
  const maxPercent = topDeal?.discount?.percent ?? 0

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 px-gutter py-3">
      <title>Plaza · Todo, a un clic y a buen precio</title>
      {catalog.isPending ? (
        <HomeSkeleton />
      ) : catalog.isError ? (
        <ErrorState
          error={catalog.error}
          title="No pudimos cargar las ofertas"
          onRetry={() => {
            void catalog.refetch()
          }}
        />
      ) : (
        <>
          <Capability name="deals">
            <section aria-labelledby="market-deals-title" className="grid gap-2 lg:grid-cols-3">
              <div className="grid content-between gap-5 rounded-card bg-accent p-5 text-accent-ink lg:col-span-2 lg:p-7">
                <p className={tag}>Semana Plaza · 24–30 sep</p>
                <h1
                  id="market-deals-title"
                  className="font-display text-[clamp(1.9rem,5vw,3.25rem)] leading-none font-extrabold tracking-tight"
                >
                  {maxPercent > 0
                    ? `Hasta ${String(maxPercent)} % de descuento`
                    : 'Ofertas de la semana'}
                </h1>
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    to="/market/buscar?sale=1&sort=discount"
                    className="inline-flex min-h-11 items-center rounded-control bg-(--market-promo) px-5 font-bold text-ink hover:brightness-95"
                  >
                    Ver todas las ofertas
                  </Link>
                  <p className="text-sm text-accent-ink/90">Envío gratis desde $150.000</p>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                <p className="grid content-center rounded-card border border-line bg-(--market-promo) p-4 font-display text-lg font-extrabold text-ink">
                  Compara hasta 4 productos lado a lado
                </p>
                <p className="grid content-center rounded-card border border-line bg-surface-raised p-4 font-display text-lg font-extrabold">
                  Envío en 24 h en miles de productos
                </p>
              </div>
            </section>

            {deals.length > 0 ? (
              <section aria-labelledby="market-daily-title" className="grid gap-2">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 id="market-daily-title" className={sectionTitle}>
                    Ofertas del día
                  </h2>
                  <p className="font-mono text-xs text-ink-muted">Hasta agotar existencias</p>
                </div>
                <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {deals.map((product) => {
                    const { current, regular } = priceDisplay(product)
                    return (
                      <li key={product.id}>
                        <Link
                          to={`/market/producto/${product.id}`}
                          className="grid h-full grid-cols-[5.5rem_minmax(0,1fr)] gap-3 rounded-card border border-line bg-surface-raised p-2.5 transition-colors duration-(--shift-duration-fast) hover:border-accent sm:grid-cols-[7rem_minmax(0,1fr)]"
                        >
                          <div className="relative">
                            <MediaImage media={product.media[0]} className="rounded-control" />
                          </div>
                          <span className="grid content-center gap-1">
                            <span className="flex items-center gap-2">
                              {product.discount ? (
                                <DiscountBadge percent={product.discount.percent} />
                              ) : null}
                              <span className="truncate text-xs font-semibold text-(--market-deal)">
                                {product.discount?.label}
                              </span>
                            </span>
                            <span className="line-clamp-2 leading-snug font-semibold">
                              {product.title}
                            </span>
                            <span className="font-mono text-lg font-bold tabular-nums">
                              {formatMoney(current)}
                            </span>
                            {regular ? (
                              <s className="font-mono text-xs text-ink-muted tabular-nums">
                                {formatMoney(regular)}
                              </s>
                            ) : null}
                            <span className="text-xs text-ink-muted">
                              {product.stock <= 10
                                ? `Quedan ${String(product.stock)}`
                                : 'Envío rápido'}
                            </span>
                          </span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ) : null}
          </Capability>

          <section aria-labelledby="market-departments-title" className="grid gap-2">
            <div className="flex items-baseline justify-between">
              <h2 id="market-departments-title" className={sectionTitle}>
                Compra por departamento
              </h2>
              <p className="font-mono text-xs text-ink-muted">{departments.length} departamentos</p>
            </div>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {departments.map((department) => (
                <li key={department.id}>
                  <Link
                    to={`/market/departamento/${department.id}`}
                    className="grid h-full gap-2 rounded-card border border-line bg-surface-raised p-2.5 transition-colors duration-(--shift-duration-fast) hover:border-accent"
                  >
                    {department.cover ? (
                      <div className="h-24 overflow-hidden rounded-control">
                        <MediaImage
                          media={{ ...department.cover.media[0], alt: '' }}
                          className="h-full w-full"
                        />
                      </div>
                    ) : null}
                    <span className="font-semibold">{department.label}</span>
                    <span className="font-mono text-xs text-ink-muted">
                      {department.count} {department.count === 1 ? 'producto' : 'productos'}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <ProductCarousel title="Recomendados para ti" products={recommended} />
          <ProductCarousel
            title="Más vendidos"
            products={bestSellers}
            seeAllTo="/market/buscar?sort=rating"
          />

          <section className="grid gap-2 rounded-card border border-line bg-surface-raised p-5 sm:grid-cols-[1fr_auto] sm:items-center">
            <p className="font-display text-xl font-extrabold">
              ¿Dudas entre dos productos? Compáralos.
            </p>
            <Link to="/market/buscar" className={buttonPrimary}>
              Explorar todo
            </Link>
          </section>
        </>
      )}
    </div>
  )
}

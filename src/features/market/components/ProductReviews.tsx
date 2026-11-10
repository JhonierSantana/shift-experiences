import { useId, useState } from 'react'
import type { MarketProduct } from '@/core/domain'
import type { ReviewSort } from '@/core/repositories'
import { useReviews } from '@/infra/query'
import { marketData } from '../domain'
import { Stars } from './Price'
import { EmptyState, ErrorState } from './States'
import { buttonOutline, sectionTitle } from './styles'

const PAGE = 5
const SORTS: readonly { value: ReviewSort; label: string }[] = [
  { value: 'newest', label: 'Más recientes' },
  { value: 'highest', label: 'Mejor calificadas' },
  { value: 'lowest', label: 'Peor calificadas' },
]

const dateFormat = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' })

export function RatingDistribution({ product }: { product: MarketProduct }) {
  const { average, count, distribution } = product.rating
  return (
    <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
      <div className="grid justify-items-start gap-1">
        <p className="font-mono text-4xl font-bold">
          {average.toFixed(1)}
          <span className="text-base font-normal text-ink-muted"> / 5</span>
        </p>
        <Stars average={average} className="text-xl" />
        <p className="text-sm text-ink-muted">{count} calificaciones</p>
      </div>
      <ul aria-label="Distribución de calificaciones" className="grid gap-1">
        {[5, 4, 3, 2, 1].map((stars) => {
          const n = distribution[stars - 1] ?? 0
          const pct = count === 0 ? 0 : Math.round((n / count) * 100)
          return (
            <li key={stars} className="grid grid-cols-[4.5rem_1fr_3rem] items-center gap-2 text-sm">
              <span>{stars} estrellas</span>
              <span aria-hidden="true" className="h-2.5 overflow-hidden rounded-full bg-line">
                <span
                  className="block h-full bg-(--market-star)"
                  style={{ width: `${String(pct)}%` }}
                />
              </span>
              <span className="text-right font-mono text-xs text-ink-muted">{pct} %</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function ProductReviews({ product }: { product: MarketProduct }) {
  const [sort, setSort] = useState<ReviewSort>('newest')
  const [pages, setPages] = useState(1)
  const selectId = useId()
  const reviews = useReviews(marketData, product.id, { sort, pageSize: PAGE * pages })

  return (
    <section
      id="resenas"
      aria-labelledby="market-reviews-title"
      className="grid gap-4 scroll-mt-32"
    >
      <h2 id="market-reviews-title" className={sectionTitle}>
        Opiniones de compradores
      </h2>
      <RatingDistribution product={product} />

      <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
        <p className="font-semibold">Reseñas</p>
        <div className="flex items-center gap-2">
          <label htmlFor={selectId} className="text-ink-muted">
            Ordenar
          </label>
          <select
            id={selectId}
            value={sort}
            onChange={(event) => {
              const next = SORTS.find((s) => s.value === event.target.value)?.value
              if (next) {
                setSort(next)
                setPages(1)
              }
            }}
            className="min-h-11 rounded-control border border-line bg-surface-raised px-2 font-semibold"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {reviews.isPending ? (
        <div role="status" className="grid gap-2">
          <span className="sr-only">Cargando reseñas…</span>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              aria-hidden="true"
              className="h-24 animate-pulse rounded-card border border-line bg-surface-raised"
            />
          ))}
        </div>
      ) : reviews.isError ? (
        <ErrorState
          error={reviews.error}
          title="No pudimos cargar las reseñas"
          onRetry={() => {
            void reviews.refetch()
          }}
        />
      ) : reviews.data.items.length === 0 ? (
        <EmptyState title="Aún no hay reseñas">
          <p>Sé el primero en opinar cuando compres este producto.</p>
        </EmptyState>
      ) : (
        <>
          <ul className="grid gap-2">
            {reviews.data.items.map((review) => (
              <li key={review.id}>
                <article className="grid gap-1 rounded-card border border-line bg-surface-raised p-3">
                  <p className="flex flex-wrap items-center gap-2">
                    <Stars average={review.rating} />
                    <span className="sr-only">{review.rating} de 5 estrellas.</span>
                    <span className="font-semibold">{review.title}</span>
                  </p>
                  <p>{review.body}</p>
                  <p className="text-xs text-ink-muted">
                    {review.author} · {dateFormat.format(new Date(review.createdAt))}
                    {review.verifiedPurchase ? ' · Compra verificada' : ''}
                  </p>
                </article>
              </li>
            ))}
          </ul>
          {reviews.data.total > reviews.data.items.length ? (
            <button
              type="button"
              className={`${buttonOutline} justify-self-start`}
              onClick={() => {
                setPages((p) => p + 1)
              }}
            >
              Ver más reseñas ({reviews.data.total - reviews.data.items.length})
            </button>
          ) : null}
        </>
      )}
    </section>
  )
}

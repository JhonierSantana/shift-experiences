import { Link } from 'react-router'
import { formatMoney, type Look } from '@/core/domain'
import { useProductsByIds } from '@/infra/query'
import { fashionData } from '../domain'
import { MediaImage } from './MediaImage'
import { eyebrow } from './styles'

interface LookBoardProps {
  readonly look: Look
  /** Highlighted piece (on a product page, the one being viewed). */
  readonly currentProductId?: string
  readonly headingLevel?: 'h2' | 'h3'
}

/** A styled look plus the pieces that compose it ("shop the look"). */
export function LookBoard({ look, currentProductId, headingLevel = 'h3' }: LookBoardProps) {
  const Heading = headingLevel
  const { data, isPending, isError, refetch } = useProductsByIds(fashionData, look.productIds)

  return (
    <article className="grid gap-8 md:grid-cols-2 md:items-center lg:gap-16">
      <MediaImage media={look.media} sizes="(min-width: 768px) 50vw, 100vw" />
      <div className="grid gap-6">
        <Heading className="font-display text-4xl leading-none italic sm:text-5xl">
          {look.title}
        </Heading>
        {isPending ? (
          <p role="status" className="text-ink-muted">
            Cargando piezas…
          </p>
        ) : isError ? (
          <p role="alert" className="text-ink-muted">
            No pudimos cargar las piezas del look.{' '}
            <button
              type="button"
              onClick={() => {
                void refetch()
              }}
              className="underline underline-offset-4"
            >
              Reintentar
            </button>
          </p>
        ) : (
          <ul className="grid divide-y divide-line border-y border-line">
            {data.map((piece) => {
              const [thumb] = piece.media
              const current = piece.id === currentProductId
              return (
                <li key={piece.id}>
                  <Link
                    to={`/fashion/producto/${piece.id}`}
                    {...(current ? { 'aria-current': 'page' as const } : {})}
                    className="flex items-center gap-4 py-3 transition-colors duration-(--shift-duration-base) ease-brand hover:text-accent"
                  >
                    <MediaImage media={thumb} className="w-14 shrink-0" />
                    <span className="grid gap-1">
                      <span className="font-display text-xl leading-tight">{piece.title}</span>
                      <span className={`${eyebrow} text-ink-muted`}>
                        {current ? 'Esta pieza · ' : ''}
                        {formatMoney(piece.price)}
                      </span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </article>
  )
}

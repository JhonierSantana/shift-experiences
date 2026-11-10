import { useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router'
import { formatMoney } from '@/core/domain'
import { isRepositoryError } from '@/core/repositories'
import { useOrder } from '@/infra/query'
import { MediaImage } from '../components/MediaImage'
import { ErrorState } from '../components/States'
import { buttonPrimary } from '../components/styles'
import { marketData } from '../domain'

export function ConfirmationPage() {
  const { orderId = '' } = useParams()
  const { data: order, isPending, isError, error, refetch } = useOrder(marketData, orderId)
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (order) headingRef.current?.focus()
  }, [order])

  if (isPending) {
    return (
      <p role="status" className="animate-pulse px-gutter py-section text-ink-muted">
        Confirmando tu pedido…
      </p>
    )
  }

  if (isError) {
    const gone = isRepositoryError(error) && error.code === 'not-found'
    return (
      <div className="grid gap-3 px-gutter py-6">
        <ErrorState
          error={error}
          title={gone ? 'No encontramos este pedido' : 'No pudimos cargar tu pedido'}
          onRetry={() => {
            void refetch()
          }}
        />
        {gone ? (
          <p className="max-w-prose text-ink-muted">
            En esta demostración los pedidos viven solo en memoria y se pierden al recargar la
            página.
          </p>
        ) : null}
        <Link to="/market" className={`${buttonPrimary} justify-self-start`}>
          Seguir comprando
        </Link>
      </div>
    )
  }

  const { address, totals } = order
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 px-gutter py-4 lg:grid-cols-2">
      <title>Pedido confirmado · Plaza</title>
      <header className="grid content-start gap-3 rounded-card bg-accent p-5 text-accent-ink">
        <p className="font-mono text-xs tracking-wide uppercase">Pedido {order.id}</p>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="font-display text-3xl font-extrabold tracking-tight outline-none"
        >
          ¡Gracias, {address.recipient.split(' ')[0]}!
        </h1>
        <p>
          Enviamos la confirmación a {order.contactEmail}. Entregaremos en {address.line1},{' '}
          {address.city}.
        </p>
        <Link
          to="/market"
          className="inline-flex min-h-11 items-center justify-self-start rounded-control bg-(--market-promo) px-5 font-bold text-ink"
        >
          Seguir comprando
        </Link>
      </header>

      <section
        aria-labelledby="order-summary"
        className="rounded-card border border-line bg-surface-raised p-4"
      >
        <h2 id="order-summary" className="mb-2 font-display text-lg font-extrabold">
          Tu pedido
        </h2>
        <ul className="divide-y divide-line border-y border-line">
          {order.lines.map(({ line, price }) => (
            <li key={line.id} className="grid grid-cols-[3.5rem_1fr_auto] gap-3 py-2.5">
              <MediaImage media={line.product.media[0]} className="rounded-control" />
              <div className="grid content-center">
                <p className="line-clamp-2 leading-snug font-semibold">{line.product.title}</p>
                <p className="text-xs text-ink-muted">Cantidad {line.quantity}</p>
              </div>
              <p className="self-center font-mono font-semibold tabular-nums">
                {formatMoney(price.total)}
              </p>
            </li>
          ))}
        </ul>
        <dl className="mt-3 grid gap-1.5">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd className="font-mono tabular-nums">{formatMoney(totals.subtotal)}</dd>
          </div>
          {totals.fees.map((fee) => (
            <div key={fee.label} className="flex justify-between">
              <dt>{fee.label}</dt>
              <dd className="font-mono tabular-nums">
                {fee.amount.amount === 0 ? 'Gratis' : formatMoney(fee.amount)}
              </dd>
            </div>
          ))}
          <div className="flex items-baseline justify-between border-t border-line pt-2">
            <dt className="font-semibold">Total</dt>
            <dd className="font-mono text-2xl font-bold tabular-nums">
              {formatMoney(totals.total)}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  )
}

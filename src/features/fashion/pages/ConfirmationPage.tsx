import { useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router'
import { formatMoney } from '@/core/domain'
import { isRepositoryError } from '@/core/repositories'
import { useOrder } from '@/infra/query'
import { MediaImage } from '../components/MediaImage'
import { ErrorState } from '../components/States'
import { buttonPrimary, eyebrow } from '../components/styles'
import { fashionData } from '../domain'

export function ConfirmationPage() {
  const { orderId = '' } = useParams()
  const { data: order, isPending, isError, error, refetch } = useOrder(fashionData, orderId)
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
      <div className="grid gap-8 px-gutter py-section">
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
        <Link to="/fashion/catalogo" className={`${buttonPrimary} justify-self-start`}>
          Seguir explorando
        </Link>
      </div>
    )
  }

  const { address, totals } = order
  return (
    <div className="grid gap-12 px-gutter pt-16 pb-section lg:grid-cols-12 lg:gap-20">
      <title>Pedido confirmado · Maison Vela</title>
      <header className="grid content-start gap-6 lg:col-span-6">
        <p className={`${eyebrow} text-ink-muted`}>Pedido {order.id}</p>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="vela-rise font-display text-6xl leading-[0.95] outline-none sm:text-8xl"
        >
          Gracias, <em>{address.recipient.split(' ')[0]}</em>
        </h1>
        <p className="max-w-prose text-ink-muted">
          Enviamos la confirmación a {order.contactEmail}. Preparamos tu pedido con el cuidado de
          siempre.
        </p>
        <p className="text-ink-muted">
          Entrega: {address.line1}, {address.city}.
        </p>
        <Link to="/fashion/catalogo" className={`${buttonPrimary} justify-self-start`}>
          Seguir explorando
        </Link>
      </header>

      <section aria-labelledby="order-summary" className="lg:col-span-6">
        <h2 id="order-summary" className={`${eyebrow} mb-6 text-ink-muted`}>
          Tu pedido
        </h2>
        <ul className="divide-y divide-line border-y border-line">
          {order.lines.map(({ line, price }) => {
            const [thumb] = line.product.media
            return (
              <li key={line.id} className="grid grid-cols-[4.5rem_1fr_auto] gap-4 py-4">
                <MediaImage media={thumb} />
                <div className="grid content-center gap-1">
                  <p className="font-display text-lg leading-tight">{line.product.title}</p>
                  <p className="text-sm text-ink-muted">Cantidad {line.quantity}</p>
                </div>
                <p className="self-center tabular-nums">{formatMoney(price.total)}</p>
              </li>
            )
          })}
        </ul>
        <dl className="mt-6 grid gap-2">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd className="tabular-nums">{formatMoney(totals.subtotal)}</dd>
          </div>
          {totals.fees.map((fee) => (
            <div key={fee.label} className="flex justify-between">
              <dt>{fee.label}</dt>
              <dd className="tabular-nums">
                {fee.amount.amount === 0 ? 'Gratis' : formatMoney(fee.amount)}
              </dd>
            </div>
          ))}
          <div className="flex items-baseline justify-between border-t border-ink pt-3">
            <dt className={eyebrow}>Total</dt>
            <dd className="font-display text-3xl tabular-nums">{formatMoney(totals.total)}</dd>
          </div>
        </dl>
      </section>
    </div>
  )
}

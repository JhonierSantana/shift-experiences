import { useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router'
import { formatMoney, type OrderOf } from '@/core/domain'
import { isRepositoryError } from '@/core/repositories'
import { useOrder } from '@/infra/query'
import { CheckIcon } from '../components/Icons'
import { PriceBreakdown } from '../components/PriceBreakdown'
import { ErrorState } from '../components/States'
import { btnPrimary, eyebrow } from '../components/styles'
import { foodData } from '../domain'
import { modeOfOrder } from '../domain/checkout'
import { trackingStages, stageIndexAt } from '../domain/tracking'
import { useNow } from '../lib/useNow'

function TrackingCard({ order }: { readonly order: OrderOf<'food'> }) {
  const stages = trackingStages(modeOfOrder(order.address))
  // One tick per second; the timer is a cheap, isolated demo.
  const now = useNow(1000)
  const startedAt = new Date(order.createdAt).getTime()
  const current = stageIndexAt(Math.max(0, now.getTime() - startedAt), stages.length)
  const stage = stages[current]
  return (
    <section
      aria-labelledby="tracking-title"
      className="grid content-start gap-4 rounded-card bg-surface-raised p-5 shadow-(--food-shadow)"
    >
      <h2 id="tracking-title" className="font-display text-xl font-extrabold">
        Estado del pedido
      </h2>
      <p role="status" className="font-semibold text-(--food-leaf)">
        {stage?.label}: {stage?.detail}
      </p>
      <ol className="grid gap-0">
        {stages.map((s, i) => {
          const state = i < current ? 'done' : i === current ? 'current' : 'todo'
          return (
            <li
              key={s.id}
              {...(state === 'current' ? { 'aria-current': 'step' as const } : {})}
              className="grid grid-cols-[2rem_1fr] gap-3"
            >
              <div className="grid justify-items-center">
                <span
                  aria-hidden="true"
                  className={`grid size-8 place-items-center rounded-full border-2 transition-colors duration-(--shift-duration-base) ${
                    state === 'todo'
                      ? 'border-line bg-surface text-transparent'
                      : 'border-(--food-leaf) bg-(--food-leaf) text-white'
                  } ${state === 'current' ? 'food-bump' : ''}`}
                >
                  {state === 'done' ? (
                    <CheckIcon width="1em" height="1em" />
                  ) : state === 'current' ? (
                    <span className="size-2.5 animate-pulse rounded-full bg-white" />
                  ) : null}
                </span>
                {i < stages.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className={`min-h-6 w-0.5 flex-1 ${state === 'done' ? 'bg-(--food-leaf)' : 'bg-line'}`}
                  />
                ) : null}
              </div>
              <div className="pb-4">
                <p className={`font-bold ${state === 'todo' ? 'text-ink-muted' : ''}`}>
                  {s.label}
                  <span className="sr-only">
                    {state === 'done' ? ' (completado)' : state === 'current' ? ' (ahora)' : ''}
                  </span>
                </p>
                <p className="text-sm text-ink-muted">{s.detail}</p>
              </div>
            </li>
          )
        })}
      </ol>
      <p className="text-sm text-ink-muted">
        Seguimiento de demostración: los tiempos están acelerados.
      </p>
    </section>
  )
}

export function ConfirmationPage() {
  const { orderId = '' } = useParams()
  const { data: order, isPending, isError, error, refetch } = useOrder(foodData, orderId)
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
      <div className="grid gap-6 px-gutter py-section">
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
        <Link to="/food/menu" className={`${btnPrimary} justify-self-start`}>
          Volver al menú
        </Link>
      </div>
    )
  }

  const mode = modeOfOrder(order.address)
  const { address, totals } = order

  return (
    <div className="grid gap-8 px-gutter py-8 lg:grid-cols-2 lg:gap-12">
      <title>Pedido confirmado · Brasa &amp; Co.</title>
      <header className="grid content-start gap-4 lg:col-span-2">
        <p className={eyebrow}>Pedido {order.id}</p>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="food-pop font-display text-4xl font-extrabold tracking-tight outline-none sm:text-6xl"
        >
          ¡Gracias, {address.recipient.split(' ')[0]}!
        </h1>
        <p className="max-w-prose text-ink-muted">
          Enviamos la confirmación a {order.contactEmail}.{' '}
          {mode === 'delivery'
            ? `Llevamos tu pedido a ${address.line1}, ${address.city}.`
            : `Te esperamos en ${address.line1}.`}
        </p>
      </header>

      <TrackingCard order={order} />

      <section
        aria-labelledby="order-summary"
        className="grid content-start gap-4 rounded-card bg-surface-raised p-5 shadow-(--food-shadow)"
      >
        <h2 id="order-summary" className="font-display text-xl font-extrabold">
          Tu pedido
        </h2>
        <ul className="grid gap-3">
          {order.lines.map(({ line, price }) => (
            <li key={line.id} className="flex justify-between gap-3">
              <div className="grid">
                <p className="font-semibold">
                  {line.quantity} × {line.product.title}
                </p>
              </div>
              <p className="tabular-nums">{formatMoney(price.total)}</p>
            </li>
          ))}
        </ul>
        <PriceBreakdown subtotal={totals.subtotal} fees={totals.fees} total={totals.total} />
        {order.notes ? <p className="text-sm text-ink-muted">{order.notes}</p> : null}
        <Link to="/food/menu" className={`${btnPrimary} justify-self-start`}>
          Pedir algo más
        </Link>
      </section>
    </div>
  )
}

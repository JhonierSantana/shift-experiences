import { formatMoney, money, subtract } from '@/core/domain'
import { marketCart } from '../domain'
import { FREE_SHIPPING_FROM, qualifiesForFreeShipping } from '../domain/checkout'

/** Free-shipping progress: the nudge that raises basket size. */
export function ShippingProgress() {
  const summary = marketCart.useCart(marketCart.selectSummary)
  const lines = summary.lines.map((l) => l.line)
  const threshold = money(FREE_SHIPPING_FROM, 'COP')
  const free = qualifiesForFreeShipping(lines, summary.subtotal)
  const missing = subtract(threshold, summary.subtotal)
  const pct = Math.min(100, Math.round((summary.subtotal.amount / FREE_SHIPPING_FROM) * 100))

  return (
    <div className="grid gap-1.5">
      <p className="text-sm font-semibold">
        {free
          ? 'Tu envío estándar es gratis.'
          : `Te faltan ${formatMoney(missing)} para envío gratis.`}
      </p>
      <div
        role="progressbar"
        aria-label="Progreso hacia envío gratis"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={free ? 100 : pct}
        className="h-2 overflow-hidden rounded-full bg-line"
      >
        <div
          className="h-full bg-accent transition-[width] duration-(--shift-duration-base) ease-brand"
          style={{ width: `${String(free ? 100 : pct)}%` }}
        />
      </div>
    </div>
  )
}

/** Subtotal, savings and shipping note. Totals with shipping live in checkout. */
export function CartTotals() {
  const summary = marketCart.useCart(marketCart.selectSummary)
  const free = qualifiesForFreeShipping(
    summary.lines.map((l) => l.line),
    summary.subtotal,
  )
  return (
    <dl className="grid gap-1.5 text-sm">
      {summary.savings.amount > 0 ? (
        <>
          <div className="flex justify-between">
            <dt>Precio regular</dt>
            <dd className="font-mono tabular-nums">{formatMoney(summary.compareAtSubtotal)}</dd>
          </div>
          <div className="flex justify-between font-semibold text-(--market-deal)">
            <dt>Ahorras</dt>
            <dd className="font-mono tabular-nums">−{formatMoney(summary.savings)}</dd>
          </div>
        </>
      ) : null}
      <div className="flex justify-between">
        <dt>Envío estándar</dt>
        <dd className="font-mono tabular-nums">{free ? 'Gratis' : 'Desde $9.900'}</dd>
      </div>
      <div className="flex items-baseline justify-between border-t border-line pt-2">
        <dt className="font-semibold">Subtotal ({summary.itemCount})</dt>
        <dd className="font-mono text-2xl font-bold tabular-nums">
          {formatMoney(summary.subtotal)}
        </dd>
      </div>
    </dl>
  )
}

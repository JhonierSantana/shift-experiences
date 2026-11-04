import { formatMoney, type Money, type OrderFee } from '@/core/domain'

/** Subtotal, fees (delivery, service, tip, promo) and total; fits a live quote and a placed order alike. */
export function PriceBreakdown({
  subtotal,
  fees,
  total,
}: {
  readonly subtotal: Money
  readonly fees: readonly OrderFee[]
  readonly total: Money
}) {
  return (
    <dl className="grid gap-1.5">
      <div className="flex justify-between">
        <dt>Subtotal</dt>
        <dd className="tabular-nums">{formatMoney(subtotal)}</dd>
      </div>
      {fees.map((fee) => (
        <div key={fee.label} className="flex justify-between text-ink-muted">
          <dt>{fee.label}</dt>
          <dd
            className={`tabular-nums ${fee.amount.amount < 0 ? 'font-semibold text-(--food-leaf)' : ''}`}
          >
            {fee.amount.amount === 0 ? 'Gratis' : formatMoney(fee.amount)}
          </dd>
        </div>
      ))}
      <div className="mt-1 flex items-baseline justify-between border-t-2 border-dashed border-line pt-3">
        <dt className="font-display text-lg font-bold">Total</dt>
        <dd className="font-display text-2xl font-extrabold tabular-nums">{formatMoney(total)}</dd>
      </div>
    </dl>
  )
}

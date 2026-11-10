import { formatMoney, type MarketProduct } from '@/core/domain'
import { priceDisplay } from '../domain/pricing'
import { stockLabel, stockLevel } from '../domain/stock'

export function DiscountBadge({
  percent,
  className = '',
}: {
  percent: number
  className?: string
}) {
  return (
    <span
      className={`inline-block rounded-control bg-(--market-deal) px-1.5 py-0.5 font-mono text-xs font-bold text-white ${className}`}
    >
      −{percent} %<span className="sr-only"> de descuento</span>
    </span>
  )
}

interface PriceProps {
  readonly product: MarketProduct
  readonly size?: 'md' | 'lg'
}

/** Current price in mono, regular price struck through, savings spelled out on the large variant. */
export function Price({ product, size = 'md' }: PriceProps) {
  const { current, regular, savings, percent } = priceDisplay(product)
  const large = size === 'lg'
  return (
    <div className="grid gap-0.5">
      <p className="flex flex-wrap items-baseline gap-x-2">
        <span
          className={`font-mono font-bold tabular-nums ${large ? 'text-3xl' : 'text-lg'}`}
          data-testid="price-current"
        >
          <span className="sr-only">Precio: </span>
          {formatMoney(current)}
        </span>
        {regular ? (
          <s className="font-mono text-sm text-ink-muted tabular-nums">
            <span className="sr-only">Precio anterior: </span>
            {formatMoney(regular)}
          </s>
        ) : null}
        {percent !== null && large ? <DiscountBadge percent={percent} /> : null}
      </p>
      {savings && large ? (
        <p className="text-sm font-semibold text-(--market-deal)">Ahorras {formatMoney(savings)}</p>
      ) : null}
    </div>
  )
}

const stockStyles = {
  out: 'border-(--market-deal) text-(--market-deal)',
  low: 'border-(--market-promo) bg-(--market-promo)/30 text-ink',
  in: 'border-transparent text-ink-muted',
} as const

export function StockBadge({ stock, always = false }: { stock: number; always?: boolean }) {
  const level = stockLevel(stock)
  if (level === 'in' && !always) return null
  return (
    <span
      className={`inline-block rounded-control border px-1.5 py-0.5 text-xs font-semibold ${stockStyles[level]}`}
    >
      {stockLabel(stock)}
    </span>
  )
}

/** Five stars filled proportionally; the number next to it carries the meaning for assistive tech. */
export function Stars({ average, className = '' }: { average: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, (average / 5) * 100))
  return (
    <span
      aria-hidden="true"
      className={`relative inline-block leading-none tracking-tight text-line ${className}`}
    >
      ★★★★★
      <span
        className="absolute inset-y-0 left-0 overflow-hidden text-(--market-star)"
        style={{ width: `${String(pct)}%` }}
      >
        ★★★★★
      </span>
    </span>
  )
}

export function RatingLine({ product }: { product: MarketProduct }) {
  return (
    <p className="flex items-center gap-1.5 text-xs text-ink-muted">
      <Stars average={product.rating.average} />
      <span className="font-mono">
        <span className="sr-only">Calificación </span>
        {product.rating.average.toFixed(1)}
        <span className="sr-only"> de 5,</span> ({product.rating.count})
      </span>
    </p>
  )
}

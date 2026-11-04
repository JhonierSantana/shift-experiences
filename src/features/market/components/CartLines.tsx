import { useState } from 'react'
import { Link } from 'react-router'
import { MAX_LINE_QUANTITY } from '@/core/cart'
import { formatMoney } from '@/core/domain'
import { marketCart } from '../domain'
import { MediaImage } from './MediaImage'
import { stepButton } from './styles'

interface CartLinesProps {
  /** Called after following a product link (closes the drawer). */
  readonly onNavigate?: () => void
}

/** Cart lines with quantity steppers; stock limits surface as an inline alert, never a silent no-op. */
export function CartLines({ onNavigate }: CartLinesProps) {
  const summary = marketCart.useCart(marketCart.selectSummary)
  const [issue, setIssue] = useState<{ lineId: string; message: string } | null>(null)
  const { setQuantity, remove } = marketCart.store.getState()

  const change = (lineId: string, quantity: number) => {
    const result = setQuantity(lineId, quantity)
    setIssue(result.ok ? null : { lineId, message: result.issues[0].message })
  }

  return (
    <ul className="divide-y divide-line">
      {summary.lines.map(({ line, price, description }) => {
        const [thumb] = line.product.media
        const limit = Math.min(line.product.stock, MAX_LINE_QUANTITY)
        return (
          <li key={line.id} className="grid grid-cols-[4.5rem_1fr] gap-3 py-4">
            <MediaImage media={thumb} className="rounded-control" />
            <div className="grid gap-2">
              <div className="grid gap-0.5">
                <Link
                  to={`/market/producto/${line.product.id}`}
                  onClick={onNavigate}
                  className="line-clamp-2 leading-snug font-semibold hover:text-accent"
                >
                  {description.title}
                </Link>
                <p className="text-xs text-ink-muted">{description.details.join(' · ')}</p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div
                  className="flex items-center"
                  role="group"
                  aria-label={`Cantidad de ${description.title}`}
                >
                  <button
                    type="button"
                    className={`${stepButton} rounded-l-control`}
                    aria-label={`Quitar una unidad de ${description.title}`}
                    onClick={() => {
                      change(line.id, line.quantity - 1)
                    }}
                  >
                    −
                  </button>
                  <span
                    className="grid h-11 w-10 place-items-center border-y border-line bg-surface-raised font-mono tabular-nums"
                    aria-live="polite"
                  >
                    {line.quantity}
                  </span>
                  <button
                    type="button"
                    className={`${stepButton} rounded-r-control`}
                    aria-label={`Añadir una unidad de ${description.title}`}
                    aria-disabled={line.quantity >= limit ? true : undefined}
                    onClick={() => {
                      change(line.id, line.quantity + 1)
                    }}
                  >
                    +
                  </button>
                </div>
                <p className="text-right">
                  <span className="block font-mono font-bold tabular-nums">
                    {formatMoney(price.total)}
                  </span>
                  {price.compareAtTotal ? (
                    <s className="font-mono text-xs text-ink-muted tabular-nums">
                      {formatMoney(price.compareAtTotal)}
                    </s>
                  ) : null}
                </p>
              </div>
              {issue?.lineId === line.id ? (
                <p role="alert" className="text-sm font-semibold text-(--market-deal)">
                  {issue.message}
                </p>
              ) : null}
              <button
                type="button"
                aria-label={`Quitar ${description.title} del carrito`}
                onClick={() => {
                  remove(line.id)
                  setIssue(null)
                }}
                className="min-h-11 justify-self-start text-sm text-ink-muted underline underline-offset-4 hover:text-ink"
              >
                Eliminar
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

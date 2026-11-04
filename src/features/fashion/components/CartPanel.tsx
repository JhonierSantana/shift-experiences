import { useState } from 'react'
import { Link } from 'react-router'
import { MAX_LINE_QUANTITY } from '@/core/cart'
import { formatMoney } from '@/core/domain'
import { fashionCart } from '../domain'
import { CloseIcon } from './Icons'
import { MediaImage } from './MediaImage'
import { buttonOutline, buttonPrimary, eyebrow, textLink } from './styles'

interface CartPanelProps {
  /** Called after navigating away (closes the drawer). */
  readonly onNavigate?: () => void
  readonly onClose?: () => void
}

const stepButton =
  'grid size-11 place-items-center border border-line-strong transition-colors duration-(--shift-duration-base) ease-brand hover:border-ink disabled:cursor-not-allowed disabled:opacity-40'

/** Bag contents: lines, quantity steppers, subtotal and the way into checkout. */
export function CartPanel({ onNavigate, onClose }: CartPanelProps) {
  const summary = fashionCart.useCart(fashionCart.selectSummary)
  const [issue, setIssue] = useState<{ lineId: string; message: string } | null>(null)
  const { setQuantity, remove } = fashionCart.store.getState()

  const change = (lineId: string, quantity: number) => {
    const result = setQuantity(lineId, quantity)
    setIssue(result.ok ? null : { lineId, message: result.issues[0].message })
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex items-center justify-between border-b border-line px-gutter py-4">
        <h2 className="font-display text-3xl">
          Tu bolsa{' '}
          <span className={`${eyebrow} font-body text-ink-muted`}>({summary.itemCount})</span>
        </h2>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar bolsa"
            className="grid size-11 place-items-center"
          >
            <CloseIcon />
          </button>
        ) : null}
      </div>

      {summary.lines.length === 0 ? (
        <div className="grid flex-1 content-center justify-items-start gap-6 px-gutter py-16">
          <p className="font-display text-4xl italic">Tu bolsa está vacía</p>
          <p className="max-w-prose text-ink-muted">
            Aún no has elegido ninguna pieza. Empieza por las novedades de la temporada.
          </p>
          <Link to="/fashion/catalogo" onClick={onNavigate} className={buttonPrimary}>
            Ver la colección
          </Link>
        </div>
      ) : (
        <>
          <ul className="flex-1 divide-y divide-line px-gutter">
            {summary.lines.map(({ line, price, description }) => {
              const [thumb] = line.product.media
              return (
                <li key={line.id} className="grid grid-cols-[5.5rem_1fr] gap-4 py-6">
                  <MediaImage media={thumb} />
                  <div className="grid content-between gap-3">
                    <div className="grid gap-1">
                      <Link
                        to={`/fashion/producto/${line.product.id}`}
                        onClick={onNavigate}
                        className="font-display text-xl leading-tight hover:text-accent"
                      >
                        {description.title}
                      </Link>
                      <p className={`${eyebrow} text-ink-muted`}>
                        {description.details.join(' · ')}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div
                        className="flex items-center"
                        role="group"
                        aria-label={`Cantidad de ${description.title}`}
                      >
                        <button
                          type="button"
                          className={stepButton}
                          aria-label={`Quitar una unidad de ${description.title}`}
                          onClick={() => {
                            change(line.id, line.quantity - 1)
                          }}
                        >
                          −
                        </button>
                        <span className="w-10 text-center tabular-nums" aria-live="polite">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          className={stepButton}
                          aria-label={`Añadir una unidad de ${description.title}`}
                          disabled={line.quantity >= MAX_LINE_QUANTITY}
                          onClick={() => {
                            change(line.id, line.quantity + 1)
                          }}
                        >
                          +
                        </button>
                      </div>
                      <p className="tabular-nums">{formatMoney(price.total)}</p>
                    </div>
                    {issue?.lineId === line.id ? (
                      <p role="alert" className="text-sm text-accent">
                        {issue.message}
                      </p>
                    ) : null}
                    <button
                      aria-label={`Quitar ${description.title} de la bolsa`}
                      type="button"
                      onClick={() => {
                        remove(line.id)
                        setIssue(null)
                      }}
                      className={`${eyebrow} min-h-11 justify-self-start py-2 text-ink-muted underline underline-offset-4 hover:text-ink`}
                    >
                      Quitar
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>

          <div className="sticky bottom-0 grid gap-4 border-t border-line bg-surface px-gutter py-6">
            <p className="flex items-baseline justify-between">
              <span className={eyebrow}>Subtotal</span>
              <span className="font-display text-3xl tabular-nums">
                {formatMoney(summary.subtotal)}
              </span>
            </p>
            <p className="text-sm text-ink-muted">El envío se calcula en el siguiente paso.</p>
            <Link to="/fashion/checkout" onClick={onNavigate} className={buttonPrimary}>
              Finalizar compra
            </Link>
            {onClose ? (
              <button type="button" onClick={onClose} className={buttonOutline}>
                Seguir comprando
              </button>
            ) : (
              <Link to="/fashion/catalogo" className={`${textLink} justify-self-center`}>
                Seguir comprando
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  )
}

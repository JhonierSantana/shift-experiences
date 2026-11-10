import { useState, type SyntheticEvent } from 'react'
import { Link } from 'react-router'
import { MAX_LINE_QUANTITY } from '@/core/cart'
import { formatMoney } from '@/core/domain'
import { foodCart, foodDomain } from '../domain'
import { EDIT_PARAM } from '../domain/dish'
import { TIP_OPTIONS, findPromo, quote as buildQuote } from '../domain/pricing'
import { useOrderUi } from '../state/orderUi'
import { FulfillmentToggle } from './FulfillmentToggle'
import { CloseIcon, TagIcon } from './Icons'
import { PriceBreakdown } from './PriceBreakdown'
import { QuantityStepper } from './QuantityStepper'
import { btnDark, btnPrimary, chip, eyebrow, iconBtn, inputBase } from './styles'

interface OrderPanelProps {
  /** Called after navigating away (closes the drawer). */
  readonly onNavigate?: () => void
  readonly onClose?: () => void
}

/** The order: lines with edit/remove, fulfillment, tip, promo code, fee breakdown and the way to checkout. */
export function OrderPanel({ onNavigate, onClose }: OrderPanelProps) {
  const summary = foodCart.useCart(foodCart.selectSummary)
  const { mode, tip, promoCode, setTip, setPromo } = useOrderUi()
  const [issue, setIssue] = useState<{ lineId: string; message: string } | null>(null)
  const [promoDraft, setPromoDraft] = useState('')
  const [promoError, setPromoError] = useState<string | null>(null)
  const { setQuantity, remove } = foodCart.store.getState()

  const quote = buildQuote({ subtotal: summary.subtotal, mode, tip, promoCode })
  const stale = summary.lines.filter(
    ({ line }) => !foodDomain.validateSelection(line.product, line.selection, line.quantity).ok,
  )
  const blocked = stale.length > 0 || quote.shortfall > 0

  const change = (lineId: string, quantity: number) => {
    const result = setQuantity(lineId, quantity)
    setIssue(result.ok ? null : { lineId, message: result.issues[0].message })
  }

  const applyPromo = (event: SyntheticEvent) => {
    event.preventDefault()
    const promo = findPromo(promoDraft)
    if (!promo) {
      setPromoError('Ese código no existe o ya venció.')
      return
    }
    setPromoError(null)
    setPromo(promo.code)
    setPromoDraft('')
  }

  const activePromo = promoCode ? findPromo(promoCode) : undefined

  return (
    <div className="flex max-h-[calc(92dvh-1.5rem)] flex-col md:h-dvh md:max-h-none">
      <div className="flex items-center justify-between gap-3 px-gutter pt-3 pb-2">
        <h2 className="font-display text-2xl font-extrabold">
          Tu pedido{' '}
          <span className="font-body text-base font-semibold text-ink-muted">
            ({summary.itemCount})
          </span>
        </h2>
        {onClose ? (
          <button type="button" onClick={onClose} aria-label="Cerrar pedido" className={iconBtn}>
            <CloseIcon />
          </button>
        ) : null}
      </div>

      {summary.lines.length === 0 ? (
        <div className="grid flex-1 content-center justify-items-start gap-4 px-gutter py-12">
          <p className="font-display text-3xl font-extrabold">Tu pedido está vacío</p>
          <p className="max-w-prose text-ink-muted">
            Aún no has elegido nada. La parrilla ya está prendida.
          </p>
          <Link to="/food/menu" onClick={onNavigate} className={btnPrimary}>
            Ver el menú
          </Link>
        </div>
      ) : (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-gutter pb-4">
            <FulfillmentToggle className="pb-4" />

            {quote.shortfall > 0 ? (
              <p
                role="status"
                className="mb-3 rounded-2xl bg-(--food-butter) px-4 py-2 text-sm font-semibold"
              >
                Te faltan {formatMoney({ amount: quote.shortfall, currency: 'COP' })} para pedir a
                domicilio. También puedes elegir recoger.
              </p>
            ) : quote.freeDeliveryRemaining !== null ? (
              <p className="mb-3 text-sm text-ink-muted">
                Domicilio gratis desde{' '}
                {formatMoney({
                  amount: quote.freeDeliveryRemaining + summary.subtotal.amount,
                  currency: 'COP',
                })}
                : te faltan {formatMoney({ amount: quote.freeDeliveryRemaining, currency: 'COP' })}.
              </p>
            ) : null}

            <ul className="divide-y-2 divide-dashed divide-line">
              {summary.lines.map(({ line, price, description }) => {
                const invalid = stale.some((s) => s.line.id === line.id)
                return (
                  <li key={line.id} className="grid gap-2 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="grid gap-0.5">
                        <p className="font-display text-lg leading-tight font-bold">
                          {description.title}
                        </p>
                        {description.details.map((detail) => (
                          <p key={detail} className="text-sm text-ink-muted">
                            {detail}
                          </p>
                        ))}
                      </div>
                      <p className="font-bold tabular-nums">{formatMoney(price.total)}</p>
                    </div>
                    {invalid ? (
                      <p role="alert" className="text-sm font-semibold text-accent">
                        Este plato ya no está disponible. Quítalo para continuar.
                      </p>
                    ) : null}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <QuantityStepper
                        value={line.quantity}
                        min={1}
                        max={MAX_LINE_QUANTITY}
                        label={description.title}
                        onChange={(quantity) => {
                          change(line.id, quantity)
                        }}
                      />
                      <div className="flex items-center gap-1">
                        <Link
                          to={`/food/plato/${line.product.id}?${EDIT_PARAM}=${encodeURIComponent(line.id)}`}
                          onClick={onNavigate}
                          aria-label={`Editar ${description.title}`}
                          className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-semibold underline underline-offset-4"
                        >
                          Editar
                        </Link>
                        <button
                          type="button"
                          aria-label={`Quitar ${description.title} del pedido`}
                          onClick={() => {
                            remove(line.id)
                          }}
                          className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-semibold text-accent underline underline-offset-4"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                    {issue?.lineId === line.id ? (
                      <p role="alert" className="text-sm font-semibold text-accent">
                        {issue.message}
                      </p>
                    ) : null}
                  </li>
                )
              })}
            </ul>

            <section
              aria-labelledby="order-tip"
              className="mt-2 grid gap-2 border-t-2 border-dashed border-line py-4"
            >
              <h3 id="order-tip" className={eyebrow}>
                Propina para quien cocina y reparte
              </h3>
              <div className="flex flex-wrap gap-2">
                {TIP_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={tip === option}
                    onClick={() => {
                      setTip(option)
                    }}
                    className={chip}
                  >
                    {option === 0
                      ? 'Sin propina'
                      : formatMoney({ amount: option, currency: 'COP' })}
                  </button>
                ))}
              </div>
            </section>

            <section
              aria-labelledby="order-promo"
              className="grid gap-2 border-t-2 border-dashed border-line py-4"
            >
              <h3 id="order-promo" className={eyebrow}>
                Código promocional
              </h3>
              {activePromo ? (
                <p className="flex items-center justify-between gap-3 rounded-2xl bg-(--food-cream-deep) px-4 py-2">
                  <span className="inline-flex items-center gap-2 font-semibold">
                    <TagIcon /> {activePromo.code} · {activePromo.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setPromo(null)
                    }}
                    aria-label={`Quitar código ${activePromo.code}`}
                    className={iconBtn}
                  >
                    <CloseIcon />
                  </button>
                </p>
              ) : (
                <form onSubmit={applyPromo} className="grid gap-2" noValidate>
                  <div className="flex gap-2">
                    <input
                      value={promoDraft}
                      onChange={(event) => {
                        setPromoDraft(event.target.value)
                      }}
                      aria-label="Código promocional"
                      aria-invalid={promoError ? true : undefined}
                      aria-describedby={promoError ? 'promo-error' : undefined}
                      autoCapitalize="characters"
                      placeholder="BRASA10"
                      className={inputBase}
                    />
                    <button type="submit" className={btnDark}>
                      Aplicar
                    </button>
                  </div>
                  {promoError ? (
                    <p id="promo-error" role="alert" className="text-sm font-semibold text-accent">
                      {promoError}
                    </p>
                  ) : null}
                </form>
              )}
            </section>

            <div className="border-t-2 border-dashed border-line pt-4">
              <PriceBreakdown subtotal={summary.subtotal} fees={quote.fees} total={quote.total} />
            </div>
          </div>

          <div className="border-t border-line bg-surface-raised px-gutter py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {blocked ? (
              <button type="button" disabled className={`${btnPrimary} w-full`}>
                {quote.shortfall > 0 ? 'Aún no alcanzas el mínimo' : 'Revisa tu pedido'}
              </button>
            ) : (
              <Link to="/food/checkout" onClick={onNavigate} className={`${btnPrimary} w-full`}>
                Ir a pagar · {formatMoney(quote.total)}
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  )
}

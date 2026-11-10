import { add, money, zero, type CartLineOf, type Money, type OrderFee } from '@/core/domain'

export type FulfillmentMode = 'delivery' | 'pickup'

/** Rules below are client-side mock policy: the mock order repository does not enforce them. */
export const MIN_DELIVERY_ORDER = 25_000
export const DELIVERY_FEE = 5_900
export const FREE_DELIVERY_FROM = 90_000
/** Percent of the subtotal. */
export const SERVICE_FEE_PERCENT = 4
export const TIP_OPTIONS: readonly number[] = [0, 2_000, 4_000, 6_000]
export const DEFAULT_TIP = 2_000

export const PICKUP_ADDRESS = 'Cra. 14 #85-20, Bogotá'

type Promo =
  | {
      readonly code: string
      readonly kind: 'percent'
      readonly percent: number
      readonly label: string
    }
  | { readonly code: string; readonly kind: 'free-delivery'; readonly label: string }

export const PROMOS: readonly Promo[] = [
  { code: 'BRASA10', kind: 'percent', percent: 10, label: '10 % de descuento en tu pedido' },
  { code: 'ENVIOGRATIS', kind: 'free-delivery', label: 'Domicilio gratis' },
]

export function findPromo(code: string): Promo | undefined {
  const normalized = code.trim().toUpperCase()
  return PROMOS.find((p) => p.code === normalized)
}

export interface QuoteInput {
  readonly subtotal: Money
  readonly mode: FulfillmentMode
  readonly tip: number
  readonly promoCode: string | null
}

export interface Quote {
  readonly fees: readonly OrderFee[]
  readonly total: Money
  readonly discount: Money
  /** Pesos still missing to reach the delivery minimum; 0 when satisfied or picking up. */
  readonly shortfall: number
  /** Pesos still missing for free delivery; null when not applicable. */
  readonly freeDeliveryRemaining: number | null
}

/** Pure price breakdown for the order bar, drawer and checkout, in the order the user reads it. */
export function quote({ subtotal, mode, tip, promoCode }: QuoteInput): Quote {
  const currency = subtotal.currency
  const promo = promoCode ? findPromo(promoCode) : undefined
  const fees: OrderFee[] = []
  let discount = zero(currency)

  if (mode === 'delivery') {
    const free =
      subtotal.amount >= FREE_DELIVERY_FROM ||
      (promo?.kind === 'free-delivery' && subtotal.amount > 0)
    fees.push({ label: 'Domicilio', amount: money(free ? 0 : DELIVERY_FEE, currency) })
  }
  fees.push({
    label: 'Servicio',
    amount: money(Math.round((subtotal.amount * SERVICE_FEE_PERCENT) / 100), currency),
  })
  if (tip > 0) fees.push({ label: 'Propina', amount: money(tip, currency) })
  if (promo?.kind === 'percent') {
    discount = money(Math.round((subtotal.amount * promo.percent) / 100), currency)
    fees.push({ label: `Promo ${promo.code}`, amount: money(-discount.amount, currency) })
  }

  const total = fees.reduce((acc, fee) => add(acc, fee.amount), subtotal)
  const shortfall =
    mode === 'delivery' && subtotal.amount > 0
      ? Math.max(0, MIN_DELIVERY_ORDER - subtotal.amount)
      : 0
  const freeDeliveryRemaining =
    mode === 'delivery' && subtotal.amount > 0 && subtotal.amount < FREE_DELIVERY_FROM
      ? FREE_DELIVERY_FROM - subtotal.amount
      : null
  return { fees, total, discount, shortfall, freeDeliveryRemaining }
}

/** Rough minutes range shown to the customer; the longest prep in the order dominates. */
export function estimateMinutes(
  mode: FulfillmentMode,
  lines: readonly CartLineOf<'food'>[],
): readonly [number, number] {
  const prep = lines.reduce((max, l) => Math.max(max, l.product.prepTimeMinutes), 15)
  return mode === 'delivery' ? [prep + 15, prep + 25] : [prep, prep + 5]
}

export function estimateLabel(mode: FulfillmentMode, lines: readonly CartLineOf<'food'>[]): string {
  const [min, max] = estimateMinutes(mode, lines)
  return `${mode === 'delivery' ? 'Llega en' : 'Listo en'} ${String(min)}–${String(max)} min`
}

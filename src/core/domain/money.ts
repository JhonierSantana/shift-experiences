/**
 * Currency-safe money. Amounts are integers in the currency's minor unit, so
 * sums never accumulate floating-point error. Mixing currencies throws.
 */

/** Minor-unit exponent per supported currency (commercial practice, not always ISO 4217). */
const CURRENCY_EXPONENT = {
  // COP has two ISO decimals but centavos are not used in retail; 1 minor unit = 1 peso.
  COP: 0,
  USD: 2,
  EUR: 2,
} as const

export type CurrencyCode = keyof typeof CURRENCY_EXPONENT

export interface Money {
  /** Integer amount in minor units (see CURRENCY_EXPONENT). */
  readonly amount: number
  readonly currency: CurrencyCode
}

export class CurrencyMismatchError extends Error {
  constructor(a: CurrencyCode, b: CurrencyCode) {
    super(`Cannot combine ${a} with ${b}`)
    this.name = 'CurrencyMismatchError'
  }
}

function assertInteger(value: number, what: string): void {
  if (!Number.isSafeInteger(value))
    throw new RangeError(`${what} must be a safe integer, got ${String(value)}`)
}

/** Builds money from minor units (integers only). */
export function money(amount: number, currency: CurrencyCode): Money {
  assertInteger(amount, 'Money amount')
  return { amount, currency }
}

/** Builds money from a human amount (e.g. 12.5 USD). Rounds half away from zero to the minor unit. */
export function fromMajor(major: number, currency: CurrencyCode): Money {
  const factor = 10 ** CURRENCY_EXPONENT[currency]
  // toFixed avoids 1.005 * 100 = 100.49999 style drift before rounding.
  const scaled = Number((Math.abs(major) * factor).toFixed(6))
  return money(Math.sign(major) * Math.round(scaled), currency)
}

export function zero(currency: CurrencyCode): Money {
  return { amount: 0, currency }
}

function assertSameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) throw new CurrencyMismatchError(a.currency, b.currency)
}

export function add(a: Money, b: Money): Money {
  assertSameCurrency(a, b)
  return money(a.amount + b.amount, a.currency)
}

export function subtract(a: Money, b: Money): Money {
  assertSameCurrency(a, b)
  return money(a.amount - b.amount, a.currency)
}

/** Multiplies by an integer factor (typically a quantity). */
export function multiply(m: Money, factor: number): Money {
  assertInteger(factor, 'Money factor')
  return money(m.amount * factor, m.currency)
}

/** Sums a list; the currency is required so an empty list still has one. */
export function sum(items: readonly Money[], currency: CurrencyCode): Money {
  return items.reduce<Money>((total, item) => add(total, item), zero(currency))
}

/**
 * Applies a percentage discount, rounding the discount (not the result) half-up
 * to the minor unit, so price - discount always equals the returned value.
 */
export function discountBy(m: Money, percent: number): Money {
  if (!(percent >= 0 && percent <= 100))
    throw new RangeError(`Discount must be 0..100, got ${String(percent)}`)
  const off = Math.round((m.amount * percent) / 100)
  return money(m.amount - off, m.currency)
}

export function compare(a: Money, b: Money): -1 | 0 | 1 {
  assertSameCurrency(a, b)
  return a.amount === b.amount ? 0 : a.amount < b.amount ? -1 : 1
}

export function equals(a: Money, b: Money): boolean {
  return a.currency === b.currency && a.amount === b.amount
}

export function isZero(m: Money): boolean {
  return m.amount === 0
}

const formatters = new Map<string, Intl.NumberFormat>()

export function formatMoney(m: Money, locale = 'es-CO'): string {
  const key = `${locale}|${m.currency}`
  let formatter = formatters.get(key)
  if (!formatter) {
    const digits = CURRENCY_EXPONENT[m.currency]
    formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: m.currency,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    })
    formatters.set(key, formatter)
  }
  return formatter.format(m.amount / 10 ** CURRENCY_EXPONENT[m.currency])
}

export function isMoney(value: unknown): value is Money {
  if (typeof value !== 'object' || value === null) return false
  const { amount, currency } = value as Record<string, unknown>
  return (
    typeof amount === 'number' &&
    Number.isSafeInteger(amount) &&
    typeof currency === 'string' &&
    Object.hasOwn(CURRENCY_EXPONENT, currency)
  )
}

import {
  add,
  zero,
  type CartLineOf,
  type DomainAdapter,
  type DomainKind,
  type LineDescription,
  type LinePrice,
  type Money,
} from '@/core/domain'
import type { CartData } from './store'

export interface PricedLine<K extends DomainKind> {
  readonly line: CartLineOf<K>
  readonly price: LinePrice
  readonly description: LineDescription
}

export interface CartSummary<K extends DomainKind> {
  readonly lines: readonly PricedLine<K>[]
  /** Distinct lines. */
  readonly lineCount: number
  /** Sum of quantities (badge number). */
  readonly itemCount: number
  readonly subtotal: Money
  /** Undiscounted subtotal; equals subtotal when nothing is on sale. */
  readonly compareAtSubtotal: Money
  readonly savings: Money
}

export function summarizeCart<K extends DomainKind>(
  adapter: DomainAdapter<K>,
  lines: readonly CartLineOf<K>[],
): CartSummary<K> {
  let subtotal = zero(adapter.currency)
  let compareAtSubtotal = zero(adapter.currency)
  let itemCount = 0
  const priced = lines.map((line) => {
    const price = adapter.priceLine(line)
    subtotal = add(subtotal, price.total)
    compareAtSubtotal = add(compareAtSubtotal, price.compareAtTotal ?? price.total)
    itemCount += line.quantity
    return { line, price, description: adapter.describeLine(line) }
  })
  return {
    lines: priced,
    lineCount: lines.length,
    itemCount,
    subtotal,
    compareAtSubtotal,
    savings: { amount: compareAtSubtotal.amount - subtotal.amount, currency: adapter.currency },
  }
}

/**
 * Selector returning a referentially stable summary while `lines` is unchanged,
 * so components using it with useStore do not re-render (or loop) on unrelated updates.
 */
export function createSummarySelector<K extends DomainKind>(
  adapter: DomainAdapter<K>,
): (state: CartData<K>) => CartSummary<K> {
  const cache = new WeakMap<readonly CartLineOf<K>[], CartSummary<K>>()
  return (state) => {
    let summary = cache.get(state.lines)
    if (!summary) {
      summary = summarizeCart(adapter, state.lines)
      cache.set(state.lines, summary)
    }
    return summary
  }
}

// Primitive selectors: return numbers, so equality is by value.
export const selectItemCount = (state: CartData<DomainKind>): number =>
  state.lines.reduce((count, line) => count + line.quantity, 0)

export const selectLineCount = (state: CartData<DomainKind>): number => state.lines.length

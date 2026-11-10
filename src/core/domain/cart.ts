import type { Money } from './money'
import type { DomainKind, ProductOf } from './product'

// Quantity lives on the line for every domain (one source of truth for generic
// cart operations); the selection only carries what makes a line distinct.

export interface FashionSelection {
  readonly kind: 'fashion'
  readonly sku: string
}

export interface FoodOptionChoice {
  readonly groupId: string
  readonly optionId: string
}

export interface FoodSelection {
  readonly kind: 'food'
  readonly options: readonly FoodOptionChoice[]
  /** Kitchen note, e.g. "sin cebolla". Different notes = different lines. */
  readonly note?: string
}

export interface MarketSelection {
  readonly kind: 'market'
}

export interface SelectionByKind {
  readonly fashion: FashionSelection
  readonly food: FoodSelection
  readonly market: MarketSelection
}

export type SelectionOf<K extends DomainKind> = SelectionByKind[K]
export type Selection = SelectionOf<DomainKind>

/**
 * A cart line keeps a snapshot of the product it was added with, so pricing
 * and descriptions are pure functions of the line (no fetch needed to render
 * the cart). Checkout re-validates against the repository.
 */
export interface CartLineOf<K extends DomainKind> {
  /** Deterministic: product id + normalized selection. Same id = same line. */
  readonly id: string
  readonly product: ProductOf<K>
  readonly selection: SelectionOf<K>
  readonly quantity: number
  readonly addedAt: string
}

export type CartLine = { [K in DomainKind]: CartLineOf<K> }[DomainKind]

export interface CartOf<K extends DomainKind> {
  readonly lines: readonly CartLineOf<K>[]
  readonly updatedAt: string | null
}

export interface LinePrice {
  readonly unit: Money
  readonly total: Money
  /** What the line would cost without discounts; present only when it differs from total. */
  readonly compareAtTotal?: Money
}

export interface LineDescription {
  readonly title: string
  /** Short human-readable facts, e.g. ["Talla M", "Color arcilla"]. */
  readonly details: readonly string[]
}

export interface SelectionIssue {
  readonly code:
    | 'unknown-variant'
    | 'out-of-stock'
    | 'insufficient-stock'
    | 'unavailable'
    | 'unknown-option'
    | 'option-count'
    | 'invalid-quantity'
    | 'kind-mismatch'
  readonly message: string
}

export type SelectionResult<S> =
  | { readonly ok: true; readonly selection: S }
  | { readonly ok: false; readonly issues: readonly [SelectionIssue, ...SelectionIssue[]] }

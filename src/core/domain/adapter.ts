import type { RepositoriesOf } from '@/core/repositories'
import type { CartLineOf, LineDescription, LinePrice, SelectionOf, SelectionResult } from './cart'
import type { CurrencyCode } from './money'
import type { DomainKind, ProductOf } from './product'

/**
 * Everything domain-specific the shared core needs. The cart, orders and
 * query layer only ever call these functions; they never switch on `kind`.
 * Property (not method) signatures keep parameter checks contravariant.
 */
export interface DomainAdapter<K extends DomainKind> {
  readonly kind: K
  /** Currency of every price in this domain (an empty cart still needs one). */
  readonly currency: CurrencyCode
  /** Pure: derives unit/total/compare-at prices from the line snapshot. */
  readonly priceLine: (line: CartLineOf<K>) => LinePrice
  readonly describeLine: (line: CartLineOf<K>) => LineDescription
  /**
   * Checks a selection against the product for the total `quantity` the line
   * would hold. On success returns the normalized selection (e.g. options in
   * canonical order) so equal choices produce the same cart line.
   */
  readonly validateSelection: (
    product: ProductOf<K>,
    selection: SelectionOf<K>,
    quantity: number,
  ) => SelectionResult<SelectionOf<K>>
  readonly repositories: RepositoriesOf<K>
}

/** One adapter of any domain (a correlated union, not DomainAdapter<DomainKind>). */
export type AnyDomainAdapter = { [K in DomainKind]: DomainAdapter<K> }[DomainKind]

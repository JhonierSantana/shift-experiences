import type { CartLineOf, LinePrice } from './cart'
import type { Money } from './money'
import type { DomainKind } from './product'
import type { Address } from './user'

export type OrderStatus = 'placed' | 'preparing' | 'on-the-way' | 'delivered' | 'cancelled'

export interface OrderLine<K extends DomainKind> {
  readonly line: CartLineOf<K>
  readonly price: LinePrice
}

export interface OrderFee {
  readonly label: string
  readonly amount: Money
}

export interface OrderTotals {
  readonly subtotal: Money
  readonly fees: readonly OrderFee[]
  readonly total: Money
}

export interface OrderOf<K extends DomainKind> {
  readonly id: string
  readonly kind: K
  readonly lines: readonly OrderLine<K>[]
  readonly totals: OrderTotals
  readonly address: Address
  readonly contactEmail: string
  readonly status: OrderStatus
  readonly createdAt: string
  readonly notes?: string
}

export interface PlaceOrderInput<K extends DomainKind> {
  readonly lines: readonly CartLineOf<K>[]
  readonly address: Address
  readonly contactEmail: string
  /** Domain fees decided at checkout (shipping, delivery, service, tip). */
  readonly fees?: readonly OrderFee[]
  readonly notes?: string
}

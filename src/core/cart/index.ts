import { useStore } from 'zustand'
import type { DomainKind } from '@/core/domain'
import {
  createCartStore,
  type CartState,
  type CartStore,
  type CreateCartStoreOptions,
} from './store'
import { createSummarySelector, type CartSummary } from './summary'

export {
  CART_STORAGE_VERSION,
  MAX_LINE_QUANTITY,
  cartStorageKey,
  createCartStore,
  lineIdFor,
  type CartData,
  type CartMutation,
  type CartState,
  type CartStore,
  type CreateCartStoreOptions,
} from './store'
export {
  createSummarySelector,
  selectItemCount,
  selectLineCount,
  summarizeCart,
  type CartSummary,
  type PricedLine,
} from './summary'

export interface BoundCart<K extends DomainKind> {
  readonly store: CartStore<K>
  /** Subscribe with a selector; the component re-renders only when the selected value changes. */
  readonly useCart: <T>(selector: (state: CartState<K>) => T) => T
  /** Stable (memoized per `lines`) summary: priced lines, counts, subtotal, savings. */
  readonly selectSummary: (state: CartState<K>) => CartSummary<K>
}

/** Creates a scope's cart store plus its typed React hook. Call once per experience (module level). */
export function createCart<K extends DomainKind>(options: CreateCartStoreOptions<K>): BoundCart<K> {
  const store = createCartStore(options)
  return {
    store,
    useCart: (selector) => useStore(store, selector),
    selectSummary: createSummarySelector(options.adapter),
  }
}

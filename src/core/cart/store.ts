import {
  persist,
  type PersistStorage,
  type StateStorage,
  type StorageValue,
} from 'zustand/middleware'
import { createStore, type StoreApi } from 'zustand/vanilla'
import type {
  CartLineOf,
  DomainAdapter,
  DomainKind,
  ProductOf,
  SelectionIssue,
  SelectionOf,
} from '@/core/domain'

/** Bump when the persisted shape changes; older payloads are dropped (see `migrate`). */
export const CART_STORAGE_VERSION = 1
export const MAX_LINE_QUANTITY = 99

export function cartStorageKey(scope: string): string {
  return `shift:cart:${scope}`
}

export type CartMutation =
  | { readonly ok: true; readonly lineId: string }
  | { readonly ok: false; readonly issues: readonly [SelectionIssue, ...SelectionIssue[]] }

export interface CartData<K extends DomainKind> {
  readonly lines: readonly CartLineOf<K>[]
  readonly updatedAt: string | null
}

export interface CartState<K extends DomainKind> extends CartData<K> {
  /** Adds `quantity` units; merges into an existing line with the same normalized selection. */
  readonly add: (
    product: ProductOf<K>,
    selection: SelectionOf<K>,
    quantity?: number,
  ) => CartMutation
  /** Sets an absolute quantity; 0 removes the line. */
  readonly setQuantity: (lineId: string, quantity: number) => CartMutation
  readonly remove: (lineId: string) => void
  readonly clear: () => void
}

export type CartStore<K extends DomainKind> = StoreApi<CartState<K>> & {
  readonly persist: {
    readonly rehydrate: () => Promise<void> | void
    readonly clearStorage: () => void
  }
}

export interface CreateCartStoreOptions<K extends DomainKind> {
  /** Isolation key: one persisted cart per scope (the experience id). */
  readonly scope: string
  readonly adapter: DomainAdapter<K>
  /** Defaults to window.localStorage when available, else in-memory only. */
  readonly storage?: StateStorage
  readonly now?: () => Date
}

// ---------------------------------------------------------------- helpers

/** JSON with sorted object keys, so equal selections always produce the same id. */
function stableKey(value: unknown): string {
  return JSON.stringify(value, (_key, v: unknown) =>
    isRecord(v) && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)))
      : v,
  )
}

export function lineIdFor(productId: string, selection: object): string {
  return `${productId}:${stableKey(selection)}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function quantityIssue(quantity: number): CartMutation | null {
  if (Number.isInteger(quantity) && quantity >= 1 && quantity <= MAX_LINE_QUANTITY) return null
  return {
    ok: false,
    issues: [
      {
        code: 'invalid-quantity',
        message: `La cantidad debe estar entre 1 y ${String(MAX_LINE_QUANTITY)}.`,
      },
    ],
  }
}

/**
 * Rebuilds persisted lines defensively: anything malformed, of another domain,
 * or no longer valid for the adapter is dropped instead of crashing the app.
 */
function sanitizeLines<K extends DomainKind>(
  adapter: DomainAdapter<K>,
  raw: unknown,
): CartLineOf<K>[] {
  if (!Array.isArray(raw)) return []
  const byId = new Map<string, CartLineOf<K>>()
  for (const candidate of raw as unknown[]) {
    if (!isRecord(candidate)) continue
    const { product, selection, quantity, addedAt } = candidate
    if (
      !isRecord(product) ||
      product.kind !== adapter.kind ||
      typeof product.id !== 'string' ||
      !isRecord(selection) ||
      selection.kind !== adapter.kind ||
      typeof quantity !== 'number' ||
      quantityIssue(quantity) !== null ||
      typeof addedAt !== 'string'
    ) {
      continue
    }
    // Shape checked above; the adapter validates the domain-specific rest.
    const typedProduct = product as unknown as ProductOf<K>
    try {
      const result = adapter.validateSelection(
        typedProduct,
        selection as unknown as SelectionOf<K>,
        quantity,
      )
      if (!result.ok) continue
      const line: CartLineOf<K> = {
        id: lineIdFor(typedProduct.id, result.selection),
        product: typedProduct,
        selection: result.selection,
        quantity,
        addedAt,
      }
      adapter.priceLine(line) // throws on a malformed price snapshot
      if (!byId.has(line.id)) byId.set(line.id, line)
    } catch {
      continue
    }
  }
  return [...byId.values()]
}

function resolveStorage(storage: StateStorage | undefined): StateStorage | undefined {
  if (storage) return storage
  try {
    return typeof window !== 'undefined' ? window.localStorage : undefined
  } catch {
    // Access can throw (e.g. storage disabled by privacy settings).
    return undefined
  }
}

/** JSON storage that treats unreadable payloads as "no cart" and never throws on write. */
function safeJsonStorage<S>(getStorage: () => StateStorage | undefined): PersistStorage<S> {
  return {
    getItem(name) {
      const storage = getStorage()
      if (!storage) return null
      try {
        const raw = storage.getItem(name)
        if (typeof raw !== 'string') return null
        const parsed: unknown = JSON.parse(raw)
        if (isRecord(parsed) && 'state' in parsed) return parsed as StorageValue<S>
      } catch {
        // fall through: corrupt JSON
      }
      try {
        storage.removeItem(name)
      } catch {
        // ignore
      }
      return null
    },
    setItem(name, value) {
      try {
        getStorage()?.setItem(name, JSON.stringify(value))
      } catch {
        // Quota exceeded / private mode: the cart keeps working in memory.
      }
    },
    removeItem(name) {
      try {
        getStorage()?.removeItem(name)
      } catch {
        // ignore
      }
    },
  }
}

// ---------------------------------------------------------------- store

/**
 * A persisted cart for one scope. Knows nothing about fashion/food/market:
 * validation, normalization and pricing are delegated to the domain adapter.
 */
export function createCartStore<K extends DomainKind>({
  scope,
  adapter,
  storage,
  now = () => new Date(),
}: CreateCartStoreOptions<K>): CartStore<K> {
  const empty: CartData<K> = { lines: [], updatedAt: null }

  return createStore<CartState<K>>()(
    persist(
      (set, get) => {
        const commit = (lines: readonly CartLineOf<K>[]) => {
          set({ lines, updatedAt: now().toISOString() })
        }

        return {
          ...empty,

          add(product, selection, quantity = 1) {
            const invalid = quantityIssue(quantity)
            if (invalid) return invalid
            const first = adapter.validateSelection(product, selection, quantity)
            if (!first.ok) return first

            const id = lineIdFor(product.id, first.selection)
            const { lines } = get()
            const existing = lines.find((line) => line.id === id)
            if (!existing) {
              commit([
                ...lines,
                { id, product, selection: first.selection, quantity, addedAt: now().toISOString() },
              ])
              return { ok: true, lineId: id }
            }

            const total = existing.quantity + quantity
            const tooMany = quantityIssue(total)
            if (tooMany) return tooMany
            const merged = adapter.validateSelection(product, first.selection, total)
            if (!merged.ok) return merged
            // Refresh the snapshot with the product the user is looking at now.
            commit(
              lines.map((line) => (line.id === id ? { ...line, product, quantity: total } : line)),
            )
            return { ok: true, lineId: id }
          },

          setQuantity(lineId, quantity) {
            const { lines } = get()
            const line = lines.find((l) => l.id === lineId)
            if (!line) {
              return {
                ok: false,
                issues: [
                  { code: 'unavailable', message: 'Este producto ya no está en tu carrito.' },
                ],
              }
            }
            if (quantity === 0) {
              commit(lines.filter((l) => l.id !== lineId))
              return { ok: true, lineId }
            }
            const invalid = quantityIssue(quantity)
            if (invalid) return invalid
            const result = adapter.validateSelection(line.product, line.selection, quantity)
            if (!result.ok) return result
            commit(lines.map((l) => (l.id === lineId ? { ...l, quantity } : l)))
            return { ok: true, lineId }
          },

          remove(lineId) {
            const { lines } = get()
            if (lines.some((l) => l.id === lineId)) commit(lines.filter((l) => l.id !== lineId))
          },

          clear() {
            commit([])
          },
        }
      },
      {
        name: cartStorageKey(scope),
        version: CART_STORAGE_VERSION,
        storage: safeJsonStorage<CartData<K>>(() => resolveStorage(storage)),
        partialize: ({ lines, updatedAt }) => ({ lines, updatedAt }),
        // No earlier schema exists; unknown versions start empty rather than guessing.
        migrate: () => empty,
        merge(persisted, current) {
          if (!isRecord(persisted)) return current
          const lines = sanitizeLines(adapter, persisted.lines)
          const updatedAt = typeof persisted.updatedAt === 'string' ? persisted.updatedAt : null
          return { ...current, lines, updatedAt: lines.length > 0 ? updatedAt : null }
        },
      },
    ),
  )
}

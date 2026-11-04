import { useStore } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { createStore, type StoreApi } from 'zustand/vanilla'

export const WISHLIST_STORAGE_VERSION = 1

export interface WishlistState {
  /** Product ids, most recently saved first. */
  readonly ids: readonly string[]
  readonly toggle: (id: string) => void
  readonly remove: (id: string) => void
}

export type WishlistStore = StoreApi<WishlistState> & {
  readonly persist: { readonly rehydrate: () => Promise<void> | void }
}

export function wishlistStorageKey(scope: string): string {
  return `shift:wishlist:${scope}`
}

function sanitize(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return [...new Set((raw as unknown[]).filter((v): v is string => typeof v === 'string'))]
}

function defaultStorage(): Storage | undefined {
  try {
    return typeof window !== 'undefined' ? window.localStorage : undefined
  } catch {
    return undefined
  }
}

/** Per-experience wishlist, persisted like the cart; unreadable payloads start empty. */
export function createWishlistStore(scope: string, storage?: Storage): WishlistStore {
  const target = storage ?? defaultStorage()
  return createStore<WishlistState>()(
    persist(
      (set) => ({
        ids: [],
        toggle: (id) => {
          set((s) => ({ ids: s.ids.includes(id) ? s.ids.filter((i) => i !== id) : [id, ...s.ids] }))
        },
        remove: (id) => {
          set((s) => ({ ids: s.ids.filter((i) => i !== id) }))
        },
      }),
      {
        name: wishlistStorageKey(scope),
        version: WISHLIST_STORAGE_VERSION,
        // Without storage (private mode) the list lives in memory only.
        ...(target ? { storage: createJSONStorage<{ ids: readonly string[] }>(() => target) } : {}),
        partialize: ({ ids }) => ({ ids }),
        migrate: () => ({ ids: [] }),
        merge: (persisted, current) => ({
          ...current,
          ids: sanitize((persisted as { ids?: unknown } | null)?.ids),
        }),
      },
    ),
  )
}

export const fashionWishlistStore = createWishlistStore('fashion')

export function useWishlist<T>(selector: (state: WishlistState) => T): T {
  return useStore(fashionWishlistStore, selector)
}

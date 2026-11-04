import { useStore } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { createStore, type StoreApi } from 'zustand/vanilla'

export const COMPARE_STORAGE_VERSION = 1
/** Side-by-side columns stay readable up to four products. */
export const MAX_COMPARE = 4

export type CompareToggle = 'added' | 'removed' | 'full'

export interface CompareState {
  /** Product ids in the order they were added. */
  readonly ids: readonly string[]
  /** Transient message for the tray's live region; never persisted. */
  readonly notice: string | null
  readonly toggle: (id: string) => CompareToggle
  readonly remove: (id: string) => void
  readonly clear: () => void
  readonly dismissNotice: () => void
}

export type CompareStore = StoreApi<CompareState>

export function compareStorageKey(scope: string): string {
  return `shift:compare:${scope}`
}

function sanitize(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const ids = (raw as unknown[]).filter((v): v is string => typeof v === 'string')
  return [...new Set(ids)].slice(0, MAX_COMPARE)
}

function defaultStorage(): Storage | undefined {
  try {
    return typeof window !== 'undefined' ? window.localStorage : undefined
  } catch {
    return undefined
  }
}

/** Per-experience comparison list, persisted like the cart; corrupt payloads start empty. */
export function createCompareStore(scope: string, storage?: Storage): CompareStore {
  const target = storage ?? defaultStorage()
  return createStore<CompareState>()(
    persist(
      (set, get) => ({
        ids: [],
        notice: null,
        toggle: (id) => {
          const { ids } = get()
          if (ids.includes(id)) {
            set({ ids: ids.filter((i) => i !== id), notice: null })
            return 'removed'
          }
          if (ids.length >= MAX_COMPARE) {
            set({
              notice: `Puedes comparar hasta ${String(MAX_COMPARE)} productos. Quita uno para añadir otro.`,
            })
            return 'full'
          }
          set({ ids: [...ids, id], notice: null })
          return 'added'
        },
        remove: (id) => {
          set((s) => ({ ids: s.ids.filter((i) => i !== id), notice: null }))
        },
        clear: () => {
          set({ ids: [], notice: null })
        },
        dismissNotice: () => {
          set({ notice: null })
        },
      }),
      {
        name: compareStorageKey(scope),
        version: COMPARE_STORAGE_VERSION,
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

export const marketCompareStore = createCompareStore('market')

export function useCompare<T>(selector: (state: CompareState) => T): T {
  return useStore(marketCompareStore, selector)
}

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_TIP, type FulfillmentMode } from '../domain/pricing'

interface OrderUiState {
  readonly mode: FulfillmentMode
  readonly tip: number
  readonly promoCode: string | null
  readonly drawerOpen: boolean
  /** Text for the polite live region ("Añadido: ..."). */
  readonly announcement: string
  readonly setMode: (mode: FulfillmentMode) => void
  readonly setTip: (tip: number) => void
  readonly setPromo: (code: string | null) => void
  readonly openDrawer: () => void
  readonly closeDrawer: () => void
  readonly announce: (message: string) => void
}

export const ORDER_UI_STORAGE_KEY = 'shift:food:order-ui'

/** Order preferences persist; drawer and announcements are transient UI state. */
export const useOrderUi = create<OrderUiState>()(
  persist(
    (set) => ({
      mode: 'delivery',
      tip: DEFAULT_TIP,
      promoCode: null,
      drawerOpen: false,
      announcement: '',
      setMode: (mode) => {
        set({ mode })
      },
      setTip: (tip) => {
        set({ tip })
      },
      setPromo: (promoCode) => {
        set({ promoCode })
      },
      openDrawer: () => {
        set({ drawerOpen: true })
      },
      closeDrawer: () => {
        set({ drawerOpen: false })
      },
      announce: (announcement) => {
        set({ announcement })
      },
    }),
    {
      name: ORDER_UI_STORAGE_KEY,
      partialize: ({ mode, tip, promoCode }) => ({ mode, tip, promoCode }),
    },
  ),
)

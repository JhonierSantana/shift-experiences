import { create } from 'zustand'

interface CartDrawerState {
  readonly open: boolean
  readonly show: () => void
  readonly hide: () => void
}

/** UI-only state: whether the cart drawer is open (not persisted). */
export const useCartDrawer = create<CartDrawerState>()((set) => ({
  open: false,
  show: () => {
    set({ open: true })
  },
  hide: () => {
    set({ open: false })
  },
}))

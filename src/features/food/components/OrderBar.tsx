import { selectItemCount } from '@/core/cart'
import { formatMoney } from '@/core/domain'
import { foodCart } from '../domain'
import { useOrderUi } from '../state/orderUi'
import { BagIcon } from './Icons'

/** Sticky order bar for mobile, above the tab bar and thumb-reachable. Desktop uses the header's Pedido button. */
export function OrderBar() {
  const count = foodCart.useCart(selectItemCount)
  const subtotal = foodCart.useCart((s) => foodCart.selectSummary(s).subtotal)
  const openDrawer = useOrderUi((s) => s.openDrawer)
  if (count === 0) return null

  return (
    <button
      type="button"
      onClick={openDrawer}
      aria-haspopup="dialog"
      aria-label={`Ver pedido: ${String(count)} ${count === 1 ? 'plato' : 'platos'}, ${formatMoney(subtotal)}`}
      className="food-pop fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-(--shift-z-header) flex min-h-14 items-center justify-between gap-4 rounded-full bg-ink px-5 font-semibold text-surface shadow-(--food-shadow) transition-transform duration-(--shift-duration-fast) ease-brand active:scale-95 md:hidden"
    >
      <span className="flex items-center gap-3">
        <span className="relative">
          <BagIcon width="1.5em" height="1.5em" />
          {/* Keyed by count so the spring bump replays on every change. */}
          <span
            key={count}
            aria-hidden="true"
            className="food-bump absolute -top-2 -right-3 grid min-w-5 place-items-center rounded-full bg-accent px-1 text-xs font-bold text-accent-ink"
          >
            {count}
          </span>
        </span>
        Ver pedido
      </span>
      <span className="tabular-nums">{formatMoney(subtotal)}</span>
    </button>
  )
}

import { Link } from 'react-router'
import { selectItemCount } from '@/core/cart'
import { marketCart } from '../domain'
import { CartLines } from './CartLines'
import { CartTotals, ShippingProgress } from './CartSummary'
import { CloseIcon } from './Icons'
import { buttonOutline, buttonPrimary } from './styles'

/** Drawer contents: lines, totals and the way into cart page or checkout. */
export function CartPanel({ onClose }: { readonly onClose: () => void }) {
  const itemCount = marketCart.useCart(selectItemCount)

  return (
    <div className="flex min-h-full flex-col">
      <div className="sticky top-0 flex items-center justify-between border-b border-line bg-surface-raised px-gutter py-2">
        <h2 className="font-display text-xl font-extrabold">
          Tu carrito <span className="font-mono text-sm text-ink-muted">({itemCount})</span>
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar carrito"
          className="grid size-11 place-items-center"
        >
          <CloseIcon />
        </button>
      </div>

      {itemCount === 0 ? (
        <div className="grid flex-1 content-center justify-items-start gap-3 px-gutter py-12">
          <p className="font-display text-2xl font-extrabold">Tu carrito está vacío</p>
          <p className="max-w-prose text-ink-muted">
            Añade productos y aprovecha las ofertas del día.
          </p>
          <Link to="/market" onClick={onClose} className={buttonPrimary}>
            Explorar ofertas
          </Link>
        </div>
      ) : (
        <>
          <div className="flex-1 px-gutter">
            <CartLines onNavigate={onClose} />
          </div>
          <div className="sticky bottom-0 grid gap-3 border-t border-line bg-surface-raised px-gutter py-4">
            <ShippingProgress />
            <CartTotals />
            <Link to="/market/checkout" onClick={onClose} className={buttonPrimary}>
              Ir a pagar
            </Link>
            <Link to="/market/carrito" onClick={onClose} className={buttonOutline}>
              Ver carrito completo
            </Link>
          </div>
        </>
      )}
    </div>
  )
}

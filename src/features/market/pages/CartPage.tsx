import { Link } from 'react-router'
import { selectItemCount } from '@/core/cart'
import { CartLines } from '../components/CartLines'
import { CartTotals, ShippingProgress } from '../components/CartSummary'
import { EmptyState } from '../components/States'
import { buttonPrimary } from '../components/styles'
import { marketCart } from '../domain'

export function CartPage() {
  const itemCount = marketCart.useCart(selectItemCount)

  return (
    <div className="grid gap-3 px-gutter py-4">
      <title>Tu carrito · Plaza</title>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">
        Tu carrito <span className="font-mono text-base text-ink-muted">({itemCount})</span>
      </h1>
      {itemCount === 0 ? (
        <EmptyState title="Tu carrito está vacío">
          <p>Aún no has añadido productos. Empieza por las ofertas del día.</p>
          <Link to="/market" className={`${buttonPrimary} mt-3`}>
            Explorar ofertas
          </Link>
        </EmptyState>
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <section
            aria-label="Productos en tu carrito"
            className="rounded-card border border-line bg-surface-raised px-3"
          >
            <CartLines />
          </section>
          <aside
            aria-label="Resumen del pedido"
            className="grid gap-3 rounded-card border border-line bg-surface-raised p-4 lg:sticky lg:top-28"
          >
            <ShippingProgress />
            <CartTotals />
            <Link to="/market/checkout" className={buttonPrimary}>
              Ir a pagar
            </Link>
            <Link to="/market" className="text-center text-accent underline underline-offset-4">
              Seguir comprando
            </Link>
          </aside>
        </div>
      )}
    </div>
  )
}

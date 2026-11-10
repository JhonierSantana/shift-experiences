import { Link } from 'react-router'
import { Capability, Slot } from '@/engine'
import { useProductsByIds } from '@/infra/query'
import { EmptyState, ErrorState, ProductGridSkeleton } from '../components/States'
import { buttonPrimary } from '../components/styles'
import { marketData } from '../domain'
import { useWishlist } from '../wishlist/store'

function WishlistBody() {
  const ids = useWishlist((s) => s.ids)
  const query = useProductsByIds(marketData, ids)

  if (ids.length === 0) {
    return (
      <EmptyState title="Aún no tienes favoritos">
        <p>Toca el corazón en un producto para guardarlo y encontrarlo después.</p>
        <Link to="/market" className={`${buttonPrimary} mt-3`}>
          Explorar productos
        </Link>
      </EmptyState>
    )
  }
  if (query.isPending) return <ProductGridSkeleton count={Math.min(ids.length, 8)} />
  if (query.isError) {
    return (
      <ErrorState
        error={query.error}
        title="No pudimos cargar tus favoritos"
        onRetry={() => {
          void query.refetch()
        }}
      />
    )
  }
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
      {query.data.map((product) => (
        <li key={product.id}>
          <Slot name="ProductCard" product={product} />
        </li>
      ))}
    </ul>
  )
}

export function WishlistPage() {
  return (
    <div className="grid gap-3 px-gutter py-4">
      <title>Favoritos · Plaza</title>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">Favoritos</h1>
      <Capability
        name="wishlist"
        fallback={<p className="text-ink-muted">Los favoritos no están disponibles.</p>}
      >
        <WishlistBody />
      </Capability>
    </div>
  )
}

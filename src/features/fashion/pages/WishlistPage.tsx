import { Link } from 'react-router'
import { Slot } from '@/engine'
import { useProductsByIds } from '@/infra/query'
import { EmptyState, ErrorState, ProductGridSkeleton } from '../components/States'
import { buttonPrimary, eyebrow } from '../components/styles'
import { fashionData } from '../domain'
import { useWishlist } from '../wishlist/store'

export function WishlistPage() {
  const ids = useWishlist((s) => s.ids)
  const { data, isPending, isError, error, refetch } = useProductsByIds(fashionData, ids)

  return (
    <div className="px-gutter pt-10 pb-section lg:pt-16">
      <title>Favoritos · Maison Vela</title>
      <p className={`${eyebrow} mb-4 text-ink-muted`}>
        {ids.length} {ids.length === 1 ? 'pieza guardada' : 'piezas guardadas'}
      </p>
      <h1 className="mb-12 font-display text-6xl leading-[0.9] sm:text-8xl">Favoritos</h1>
      {ids.length === 0 ? (
        <EmptyState title="Aún no has guardado nada">
          <p>Toca el corazón en cualquier pieza para reunirla aquí.</p>
          <Link to="/fashion/catalogo" className={`${buttonPrimary} mt-6`}>
            Ver la colección
          </Link>
        </EmptyState>
      ) : isPending ? (
        <ProductGridSkeleton count={Math.min(ids.length, 8)} />
      ) : isError ? (
        <ErrorState
          error={error}
          onRetry={() => {
            void refetch()
          }}
        />
      ) : (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 lg:grid-cols-4">
          {data.map((product) => (
            <li key={product.id}>
              <Slot name="ProductCard" product={product} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

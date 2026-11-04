import { Link, useParams } from 'react-router'
import { isRepositoryError } from '@/core/repositories'
import { useProduct } from '@/infra/query'
import { ProductDetail } from '../components/ProductDetail'
import { ErrorState } from '../components/States'
import { buttonPrimary } from '../components/styles'
import { marketData } from '../domain'

function DetailSkeleton() {
  return (
    <div role="status" className="grid gap-4 px-gutter py-4 lg:grid-cols-[1.15fr_1fr]">
      <span className="sr-only">Cargando producto…</span>
      <div
        aria-hidden="true"
        className="aspect-square animate-pulse rounded-card bg-surface-raised"
      />
      <div
        aria-hidden="true"
        className="grid animate-pulse content-start gap-3 rounded-card border border-line bg-surface-raised p-4"
      >
        <div className="h-3 w-1/4 rounded-control bg-surface" />
        <div className="h-7 w-full rounded-control bg-surface" />
        <div className="h-9 w-1/2 rounded-control bg-surface" />
        <div className="h-24 rounded-control bg-surface" />
      </div>
    </div>
  )
}

export function ProductPage() {
  const { id = '' } = useParams()
  const { data: product, isPending, isError, error, refetch } = useProduct(marketData, id)

  if (isPending) return <DetailSkeleton />
  if (isError) {
    const gone = isRepositoryError(error) && error.code === 'not-found'
    return (
      <div className="grid gap-3 px-gutter py-6">
        <ErrorState
          error={error}
          title={gone ? 'No encontramos este producto' : 'No pudimos cargar el producto'}
          onRetry={() => {
            void refetch()
          }}
        />
        <Link to="/market" className={`${buttonPrimary} justify-self-start`}>
          Seguir explorando
        </Link>
      </div>
    )
  }
  // Remount per product so quantity and feedback never leak between products.
  return <ProductDetail key={product.id} product={product} />
}

import { Link, useParams } from 'react-router'
import { Capability } from '@/engine'
import { isRepositoryError } from '@/core/repositories'
import { useCollections, useLooks, useProduct } from '@/infra/query'
import { ProductDetail } from '../components/ProductDetail'
import { LookBoard } from '../components/LookBoard'
import { ErrorState } from '../components/States'
import { buttonPrimary, eyebrow } from '../components/styles'
import { fashionData } from '../domain'

function DetailSkeleton() {
  return (
    <div role="status" className="grid animate-pulse gap-10 px-gutter lg:grid-cols-12 lg:gap-16">
      <span className="sr-only">Cargando pieza…</span>
      <div aria-hidden="true" className="aspect-[4/5] bg-surface-raised lg:col-span-7" />
      <div aria-hidden="true" className="grid content-start gap-6 lg:col-span-5">
        <div className="h-14 w-4/5 bg-surface-raised" />
        <div className="h-6 w-1/4 bg-surface-raised" />
        <div className="h-24 bg-surface-raised" />
        <div className="h-12 bg-surface-raised" />
      </div>
    </div>
  )
}

function RelatedLooks({
  lookIds,
  productId,
}: {
  readonly lookIds: readonly string[]
  readonly productId: string
}) {
  const { data } = useLooks(fashionData)
  const looks = data?.filter((look) => lookIds.includes(look.id)) ?? []
  if (looks.length === 0) return null
  return (
    <section
      aria-labelledby="pdp-looks-title"
      className="border-t border-line px-gutter py-section"
    >
      <h2 id="pdp-looks-title" className={`${eyebrow} mb-10 text-ink-muted`}>
        Combínalo · Shop the look
      </h2>
      <div className="grid gap-section">
        {looks.map((look) => (
          <LookBoard key={look.id} look={look} currentProductId={productId} />
        ))}
      </div>
    </section>
  )
}

export function ProductPage() {
  const { id = '' } = useParams()
  const { data: product, isPending, isError, error, refetch } = useProduct(fashionData, id)
  const { data: collections } = useCollections(fashionData)

  if (isPending) return <DetailSkeleton />

  if (isError) {
    const notFound = isRepositoryError(error) && error.code === 'not-found'
    return (
      <div className="px-gutter py-section">
        <ErrorState
          error={error}
          title={notFound ? 'Esta pieza ya no está en la colección' : 'No pudimos cargar la pieza'}
          onRetry={() => {
            void refetch()
          }}
        />
        <Link to="/fashion/catalogo" className={`${buttonPrimary} mt-8`}>
          Ver la colección
        </Link>
      </div>
    )
  }

  return (
    <>
      <title>{`${product.title} · Maison Vela`}</title>
      <div className="pt-6 lg:pt-10">
        <ProductDetail
          key={product.id}
          product={product}
          collection={collections?.find((c) => c.id === product.collectionId)}
        />
      </div>
      <Capability name="shopTheLook">
        <RelatedLooks lookIds={product.lookIds} productId={product.id} />
      </Capability>
    </>
  )
}

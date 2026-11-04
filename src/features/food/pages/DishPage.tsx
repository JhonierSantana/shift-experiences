import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { isRepositoryError } from '@/core/repositories'
import { useProduct } from '@/infra/query'
import { DishDetail } from '../components/DishDetail'
import { ErrorState } from '../components/States'
import { btnPrimary } from '../components/styles'
import { foodCart, foodData } from '../domain'
import { EDIT_PARAM } from '../domain/dish'
import { useOrderUi } from '../state/orderUi'

function DetailSkeleton() {
  return (
    <div role="status" className="grid animate-pulse gap-6 px-gutter lg:grid-cols-2 lg:gap-10">
      <span className="sr-only">Cargando el plato…</span>
      <div aria-hidden="true" className="aspect-[4/3] rounded-card bg-(--food-cream-deep)" />
      <div aria-hidden="true" className="grid content-start gap-4">
        <div className="h-10 w-4/5 rounded-full bg-(--food-cream-deep)" />
        <div className="h-6 w-1/4 rounded-full bg-(--food-cream-deep)" />
        <div className="h-24 rounded-3xl bg-(--food-cream-deep)" />
        <div className="h-32 rounded-3xl bg-(--food-cream-deep)" />
      </div>
    </div>
  )
}

export function DishPage() {
  const { id = '' } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const openDrawer = useOrderUi((s) => s.openDrawer)
  const { data: product, isPending, isError, error, refetch } = useProduct(foodData, id)
  const editId = params.get(EDIT_PARAM)
  const editLine = foodCart.useCart((s) => s.lines.find((line) => line.id === editId))

  if (isPending) return <DetailSkeleton />

  if (isError) {
    const gone = isRepositoryError(error) && error.code === 'not-found'
    return (
      <div className="grid gap-6 px-gutter py-section">
        <ErrorState
          error={error}
          title={gone ? 'Este plato ya no está en el menú' : 'No pudimos cargar el plato'}
          onRetry={() => {
            void refetch()
          }}
        />
        <Link to="/food/menu" className={`${btnPrimary} justify-self-start`}>
          Volver al menú
        </Link>
      </div>
    )
  }

  return (
    <div className="grid gap-4 px-gutter py-6">
      <title>{`${product.title} · Brasa & Co.`}</title>
      <Link
        to="/food/menu"
        className="inline-flex min-h-11 items-center justify-self-start font-semibold underline underline-offset-4"
      >
        ← Volver al menú
      </Link>
      <DishDetail
        key={`${product.id}:${editId ?? ''}`}
        product={product}
        layout="page"
        {...(editLine ? { editLine } : {})}
        {...(editLine
          ? {
              onDone: () => {
                openDrawer()
                void navigate('/food/menu', { replace: true })
              },
            }
          : {})}
      />
    </div>
  )
}

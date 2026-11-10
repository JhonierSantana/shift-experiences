import { useSearchParams } from 'react-router'
import { useProduct } from '@/infra/query'
import { foodCart, foodData } from '../domain'
import { DISH_PARAM, EDIT_PARAM } from '../domain/dish'
import { DishDetail } from './DishDetail'
import { ErrorState } from './States'
import { Sheet } from './Sheet'

function SheetSkeleton() {
  return (
    <div role="status" className="grid animate-pulse gap-4 p-gutter">
      <span className="sr-only">Cargando el plato…</span>
      <div aria-hidden="true" className="h-40 rounded-3xl bg-(--food-cream-deep)" />
      <div aria-hidden="true" className="h-8 w-3/4 rounded-full bg-(--food-cream-deep)" />
      <div aria-hidden="true" className="h-20 rounded-3xl bg-(--food-cream-deep)" />
    </div>
  )
}

/** Bottom sheet (dialog on desktop) for the dish named by `?plato=`; closing removes the params. */
export function DishSheet({ id }: { readonly id: string }) {
  const [params, setParams] = useSearchParams()
  const { data: product, isPending, isError, error, refetch } = useProduct(foodData, id)
  const editId = params.get(EDIT_PARAM)
  const editLine = foodCart.useCart((s) => s.lines.find((line) => line.id === editId))

  const close = () => {
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        next.delete(DISH_PARAM)
        next.delete(EDIT_PARAM)
        return next
      },
      { replace: true },
    )
  }

  return (
    <Sheet open onClose={close} label={product ? product.title : 'Plato'}>
      {isPending ? (
        <SheetSkeleton />
      ) : isError ? (
        <div className="p-gutter">
          <ErrorState
            error={error}
            title="No pudimos abrir este plato"
            onRetry={() => {
              void refetch()
            }}
          />
        </div>
      ) : (
        <DishDetail
          key={product.id}
          product={product}
          layout="sheet"
          onDone={close}
          onClose={close}
          {...(editLine ? { editLine } : {})}
        />
      )}
    </Sheet>
  )
}

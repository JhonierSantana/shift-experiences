import type { MouseEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { formatMoney, type FoodItem } from '@/core/domain'
import type { SlotPropsMap } from '@/engine'
import { foodCart } from '../domain'
import { DISH_PARAM, canQuickAdd } from '../domain/dish'
import { SPICE_LABELS } from '../domain/menuFilters'
import { useOrderUi } from '../state/orderUi'
import { DishMedia } from './DishMedia'
import { ClockIcon, FlameIcon, PlusIcon } from './Icons'

/** Same breakpoint as Tailwind's `md`: below it dish detail opens as a bottom sheet. */
const MOBILE_QUERY = '(max-width: 47.99rem)'

const roundBtn =
  'absolute -right-1 -bottom-1 z-10 grid size-11 place-items-center rounded-full bg-accent text-accent-ink shadow-(--food-shadow) transition-[transform,background-color] duration-(--shift-duration-fast) ease-brand hover:bg-(--food-ember-deep) active:scale-90'

function DishCard({ item }: { readonly item: FoodItem }) {
  const [, setParams] = useSearchParams()
  const announce = useOrderUi((s) => s.announce)
  const [media] = item.media
  const detailPath = `/food/plato/${item.id}`

  const open = (event: MouseEvent) => {
    if (typeof window.matchMedia !== 'function' || !window.matchMedia(MOBILE_QUERY).matches) return
    event.preventDefault()
    setParams((current) => {
      const next = new URLSearchParams(current)
      next.set(DISH_PARAM, item.id)
      return next
    })
  }

  const quickAdd = () => {
    const result = foodCart.store.getState().add(item, { kind: 'food', options: [] }, 1)
    announce(
      result.ok
        ? `Añadido al pedido: ${item.title}`
        : `No se pudo añadir: ${result.issues[0].message}`,
    )
  }

  return (
    <article
      className={`food-pop group relative flex items-stretch gap-4 rounded-card bg-surface-raised p-4 shadow-(--food-shadow) transition-transform duration-(--shift-duration-base) ease-brand focus-within:outline-3 focus-within:outline-(--shift-focus) sm:flex-col-reverse sm:justify-end sm:hover:-translate-y-1 ${
        item.available ? '' : 'opacity-70'
      }`}
    >
      <div className="grid min-w-0 flex-1 content-start gap-1.5">
        <h3 className="font-display text-lg leading-tight font-bold">
          <Link
            to={detailPath}
            onClick={open}
            className="outline-none after:absolute after:inset-0 after:rounded-card"
          >
            {item.title}
          </Link>
        </h3>
        <p className="line-clamp-2 text-sm text-ink-muted">{item.description}</p>
        <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-ink-muted">
          <li className="inline-flex items-center gap-1">
            <ClockIcon width="1em" height="1em" /> {item.prepTimeMinutes} min
          </li>
          {item.spiceLevel > 0 ? (
            <li className="inline-flex items-center gap-1 text-accent">
              <FlameIcon width="1em" height="1em" />
              <span className="sr-only">{SPICE_LABELS[item.spiceLevel]}</span>
              <span aria-hidden="true">{'●'.repeat(item.spiceLevel)}</span>
            </li>
          ) : null}
          {item.tags.slice(0, 2).map((tag) => (
            <li key={tag} className="rounded-full bg-(--food-cream-deep) px-2 py-0.5 text-ink">
              {tag}
            </li>
          ))}
        </ul>
        <p className="mt-auto pt-1 font-display text-lg font-extrabold">
          {formatMoney(item.price)}
          {!item.available ? (
            <span className="ml-2 rounded-full bg-ink px-2 py-0.5 font-body text-xs text-surface">
              Agotado
            </span>
          ) : null}
        </p>
      </div>

      <div className="relative h-fit w-28 shrink-0 self-start sm:w-full">
        <DishMedia
          media={media}
          sizes="(min-width: 640px) 33vw, 112px"
          className="w-full rounded-3xl"
        />
        {item.available ? (
          canQuickAdd(item) ? (
            <button
              type="button"
              onClick={quickAdd}
              aria-label={`Añadir ${item.title} al pedido`}
              className={roundBtn}
            >
              <PlusIcon />
            </button>
          ) : (
            <Link
              to={detailPath}
              onClick={open}
              aria-label={`Personalizar ${item.title}`}
              className={roundBtn}
            >
              <PlusIcon />
            </Link>
          )
        ) : null}
      </div>
    </article>
  )
}

/** ProductCard slot for the food experience. Any other domain's product renders nothing. */
export function FoodDishCard({ product }: SlotPropsMap['ProductCard']) {
  return product.kind === 'food' ? <DishCard item={product} /> : null
}

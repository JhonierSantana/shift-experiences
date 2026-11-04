import { Link } from 'react-router'
import { Slot } from '@/engine'
import { useCategories, useProductList } from '@/infra/query'
import { DishGridSkeleton, ErrorState } from '../components/States'
import { FulfillmentToggle } from '../components/FulfillmentToggle'
import { OpenBadge } from '../components/OpenBadge'
import { TagIcon } from '../components/Icons'
import { btnDark, btnOutline } from '../components/styles'
import { foodData } from '../domain'
import { FREE_DELIVERY_FROM, PROMOS } from '../domain/pricing'
import { plateArt } from '../lib/plateArt'
import { useOrderUi } from '../state/orderUi'
import { formatMoney } from '@/core/domain'

const POPULAR_QUERY = { tag: 'más pedido', pageSize: 6 } as const

function CategoryRail() {
  const { data, isPending, isError, error, refetch } = useCategories(foodData)
  return (
    <section aria-labelledby="food-cats-title" className="grid gap-4">
      <h2
        id="food-cats-title"
        className="px-gutter font-display text-3xl font-extrabold tracking-tight"
      >
        ¿Qué se te antoja?
      </h2>
      {isError ? (
        <div className="px-gutter">
          <ErrorState
            error={error}
            title="No pudimos cargar las categorías"
            onRetry={() => {
              void refetch()
            }}
          />
        </div>
      ) : (
        <ul className="flex min-w-0 snap-x gap-4 overflow-x-auto px-gutter pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {isPending
            ? Array.from({ length: 6 }, (_, i) => (
                <li
                  key={i}
                  aria-hidden="true"
                  className="grid shrink-0 animate-pulse justify-items-center gap-2"
                >
                  <div className="size-24 rounded-full bg-(--food-cream-deep)" />
                  <div className="h-3 w-16 rounded-full bg-(--food-cream-deep)" />
                </li>
              ))
            : data.map((category) => (
                <li key={category.id} className="shrink-0 snap-start">
                  <Link
                    to={`/food/menu?cat=${category.id}`}
                    className="group grid w-24 justify-items-center gap-2 text-center text-sm font-bold"
                  >
                    <span
                      aria-hidden="true"
                      className="size-24 rounded-full shadow-(--food-shadow) transition-transform duration-(--shift-duration-base) ease-brand group-hover:scale-110 group-active:scale-95"
                      style={{ background: plateArt(category.id) }}
                    />
                    {category.label}
                  </Link>
                </li>
              ))}
        </ul>
      )}
    </section>
  )
}

function Promos() {
  const setPromo = useOrderUi((s) => s.setPromo)
  const announce = useOrderUi((s) => s.announce)
  const promoCode = useOrderUi((s) => s.promoCode)
  return (
    <section aria-labelledby="food-promos-title" className="grid gap-4 px-gutter">
      <h2 id="food-promos-title" className="sr-only">
        Promociones
      </h2>
      <ul className="grid gap-4 md:grid-cols-2">
        {PROMOS.map((promo, index) => (
          <li
            key={promo.code}
            className={`flex items-center justify-between gap-4 rounded-card p-5 shadow-(--food-shadow) ${
              index === 0 ? 'bg-(--food-leaf) text-white' : 'bg-(--food-butter) text-ink'
            }`}
          >
            <div className="grid gap-1">
              <p className="inline-flex items-center gap-2 font-display text-xl font-extrabold">
                <TagIcon /> {promo.label}
              </p>
              <p className="text-sm">
                Código <strong>{promo.code}</strong>
                {promo.kind === 'free-delivery'
                  ? ` · también gratis desde ${formatMoney({ amount: FREE_DELIVERY_FROM, currency: 'COP' })}`
                  : ''}
              </p>
            </div>
            <button
              type="button"
              disabled={promoCode === promo.code}
              onClick={() => {
                setPromo(promo.code)
                announce(`Código ${promo.code} aplicado a tu pedido`)
              }}
              className={`${index === 0 ? btnOutline + ' border-white text-white hover:bg-white hover:text-(--food-leaf)' : btnDark} shrink-0`}
            >
              {promoCode === promo.code ? 'Aplicado' : 'Aplicar'}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Popular() {
  const list = useProductList(foodData, POPULAR_QUERY)
  return (
    <section aria-labelledby="food-popular-title" className="grid gap-4 px-gutter">
      <div className="flex items-end justify-between gap-4">
        <h2 id="food-popular-title" className="font-display text-3xl font-extrabold tracking-tight">
          Los más pedidos
        </h2>
        <Link
          to="/food/menu"
          className="min-h-11 content-center font-semibold underline underline-offset-4"
        >
          Ver todo el menú
        </Link>
      </div>
      {list.isPending ? (
        <DishGridSkeleton count={3} />
      ) : list.isError ? (
        <ErrorState
          error={list.error}
          title="No pudimos cargar los platos"
          onRetry={() => {
            void list.refetch()
          }}
        />
      ) : (
        <ul className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.data.items.map((item) => (
            <li key={item.id} className="grid grid-cols-[minmax(0,1fr)]">
              <Slot name="ProductCard" product={item} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function HomePage() {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-section py-6">
      <title>Brasa &amp; Co. · Fuego lento, sabor rápido</title>
      <section
        aria-labelledby="food-hero-title"
        className="relative mx-gutter overflow-hidden rounded-card bg-accent px-6 py-10 text-accent-ink shadow-(--food-shadow) sm:px-10 sm:py-14"
      >
        <div
          aria-hidden="true"
          className="absolute -right-16 -bottom-24 hidden size-96 rounded-full bg-(--food-butter) lg:block"
        />
        <div
          aria-hidden="true"
          className="absolute -top-10 -right-10 size-40 rounded-full bg-(--food-ember-deep) opacity-60 lg:hidden"
        />
        <div className="relative grid max-w-xl gap-5">
          <OpenBadge className="justify-self-start" />
          <h1
            id="food-hero-title"
            className="font-display text-[clamp(2.75rem,9vw,5.5rem)] leading-[0.95] font-extrabold tracking-tight"
          >
            Fuego lento, sabor rápido.
          </h1>
          <p className="text-lg">Parrilla de barrio, a tu puerta o lista para recoger.</p>
          <div className="max-w-sm rounded-3xl bg-surface p-3 text-ink">
            <FulfillmentToggle />
          </div>
          <Link
            to="/food/menu"
            className="inline-flex min-h-12 items-center justify-self-start rounded-control bg-ink px-6 font-semibold text-surface transition-transform duration-(--shift-duration-fast) ease-brand hover:scale-105 active:scale-95"
          >
            Ver el menú
          </Link>
        </div>
      </section>

      <Promos />
      <CategoryRail />
      <Popular />
    </div>
  )
}

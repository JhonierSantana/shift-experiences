import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Slot, useCapability } from '@/engine'
import { useCategories, useProductList } from '@/infra/query'
import { CloseIcon, SearchIcon, SlidersIcon } from '../components/Icons'
import { FilterSheet } from '../components/FilterSheet'
import { DishGridSkeleton, EmptyState, ErrorState } from '../components/States'
import { chip, inputBase } from '../components/styles'
import { foodData } from '../domain'
import {
  activeChips,
  clearSheetFilters,
  groupByCategory,
  parseFilters,
  serializeFilters,
  toProductQuery,
  withCategory,
  type MenuFilters,
} from '../domain/menuFilters'

export function MenuPage() {
  const [params, setParams] = useSearchParams()
  const filters = useMemo(() => parseFilters(params), [params])
  const canFilter = useCapability('nutritionInfo')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [text, setText] = useState(filters.search)

  const categories = useCategories(foodData)
  const list = useProductList(foodData, toProductQuery(filters))

  const apply = (next: MenuFilters) => {
    setParams(serializeFilters(next), { replace: true })
  }

  // Debounced search: the URL (and so the query) updates once typing pauses.
  useEffect(() => {
    const id = setTimeout(() => {
      setParams(
        (current) => {
          const value = text.trim()
          if ((current.get('q') ?? '') === value) return current
          const next = new URLSearchParams(current)
          if (value) next.set('q', value)
          else next.delete('q')
          return next
        },
        { replace: true },
      )
    }, 250)
    return () => {
      clearTimeout(id)
    }
  }, [text, setParams])

  const chips = activeChips(filters)
  const groups = useMemo(
    () => groupByCategory(list.data?.items ?? [], categories.data ?? []),
    [list.data, categories.data],
  )
  const total = list.data?.total ?? 0
  const isPending = list.isPending || categories.isPending
  const error = list.error ?? categories.error
  const hasFilters = chips.length > 0 || filters.search !== ''

  const reset = () => {
    setText('')
    apply({ ...clearSheetFilters(filters), search: '' })
  }

  return (
    <div className="pb-section">
      <title>Menú · Brasa &amp; Co.</title>
      <header className="grid gap-4 px-gutter pt-6 pb-4">
        <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          El menú de hoy
        </h1>
        <div className="flex gap-2">
          <form
            role="search"
            onSubmit={(event) => {
              event.preventDefault()
            }}
            className="relative min-w-0 flex-1"
          >
            <label htmlFor="menu-search" className="sr-only">
              Buscar en el menú
            </label>
            <SearchIcon className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-muted" />
            <input
              id="menu-search"
              type="search"
              value={text}
              onChange={(event) => {
                setText(event.target.value)
              }}
              placeholder="Busca un plato"
              autoComplete="off"
              className={`${inputBase} pl-12`}
            />
          </form>
          {canFilter ? (
            <button
              type="button"
              aria-haspopup="dialog"
              onClick={() => {
                setSheetOpen(true)
              }}
              className="inline-flex min-h-12 items-center gap-2 rounded-control border-2 border-ink px-4 font-semibold transition-transform duration-(--shift-duration-fast) ease-brand active:scale-95"
            >
              <SlidersIcon />
              Filtros{chips.length > 0 ? ` (${String(chips.length)})` : ''}
            </button>
          ) : null}
        </div>
      </header>

      {/* Sticky under the 4rem header so categories stay one thumb-flick away. */}
      <nav
        aria-label="Categorías"
        className="sticky top-16 z-20 border-b border-line bg-surface/95 backdrop-blur-sm"
      >
        <ul className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-gutter py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <li>
            <button
              type="button"
              aria-current={filters.categoryId === undefined}
              onClick={() => {
                apply(withCategory(filters, undefined))
              }}
              className={chip}
            >
              Todo
            </button>
          </li>
          {(categories.data ?? []).map((category) => (
            <li key={category.id}>
              <button
                type="button"
                aria-current={filters.categoryId === category.id}
                onClick={() => {
                  apply(withCategory(filters, category.id))
                }}
                className={chip}
              >
                {category.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div
        className="grid grid-cols-[minmax(0,1fr)] gap-6 px-gutter pt-6"
        aria-busy={list.isFetching}
      >
        {chips.length > 0 ? (
          <ul aria-label="Filtros activos" className="flex flex-wrap gap-2">
            {chips.map((c) => (
              <li key={c.key}>
                <button
                  type="button"
                  aria-label={`Quitar filtro: ${c.label}`}
                  onClick={() => {
                    apply(c.without)
                  }}
                  className={chip}
                >
                  {c.label} <CloseIcon width="1em" height="1em" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {isPending ? (
          <DishGridSkeleton />
        ) : error ? (
          <ErrorState
            error={error}
            title="No pudimos cargar el menú"
            onRetry={() => {
              void list.refetch()
              void categories.refetch()
            }}
          />
        ) : total === 0 ? (
          <EmptyState
            title="Nada coincide con tu búsqueda"
            {...(hasFilters ? { actionLabel: 'Quitar filtros', onAction: reset } : {})}
          >
            <p>Prueba con otra palabra o menos filtros.</p>
          </EmptyState>
        ) : (
          <div
            className={`grid grid-cols-[minmax(0,1fr)] gap-10 transition-opacity duration-(--shift-duration-base) ${
              list.isPlaceholderData ? 'opacity-50' : ''
            }`}
          >
            {groups.map(({ category, items }) => (
              <section
                key={category.id}
                aria-labelledby={`menu-${category.id}`}
                className="grid grid-cols-[minmax(0,1fr)] gap-4"
              >
                <div className="grid gap-1">
                  <h2 id={`menu-${category.id}`} className="font-display text-2xl font-extrabold">
                    {category.label}
                  </h2>
                  {category.description ? (
                    <p className="text-sm text-ink-muted">{category.description}</p>
                  ) : null}
                </div>
                <ul className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((item) => (
                    <li key={item.id} className="grid grid-cols-[minmax(0,1fr)]">
                      <Slot name="ProductCard" product={item} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
        <p role="status" className="sr-only">
          {list.isSuccess ? `${String(total)} platos` : ''}
        </p>
      </div>

      {canFilter ? (
        <FilterSheet
          open={sheetOpen}
          filters={filters}
          onApply={apply}
          onClose={() => {
            setSheetOpen(false)
          }}
        />
      ) : null}
    </div>
  )
}

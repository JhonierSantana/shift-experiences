import { useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { Slot } from '@/engine'
import { useCategories, useProductList } from '@/infra/query'
import { CloseIcon } from '../components/Icons'
import { FilterPanel } from '../components/FilterPanel'
import { Modal } from '../components/Modal'
import { EmptyState, ErrorState, ProductGridSkeleton } from '../components/States'
import { buttonOutline, buttonPrimary } from '../components/styles'
import { marketData } from '../domain'
import {
  SORT_OPTIONS,
  activeChips,
  applyClientRules,
  clearFilters,
  facetsOf,
  parseListing,
  serializeListing,
  toProductQuery,
  type ListingFacets,
  type ListingState,
} from '../domain/catalogFilters'
import { useMediaQuery } from '../lib/useMediaQuery'

interface FilterDrawerProps {
  readonly open: boolean
  readonly onClose: () => void
  readonly state: ListingState
  readonly onApply: (next: ListingState) => void
  readonly facets: ListingFacets
  readonly departmentId: string | undefined
}

function FilterDrawer({ open, onClose, ...body }: FilterDrawerProps) {
  return (
    <Modal open={open} onClose={onClose} label="Filtrar productos" placement="bottom">
      <DrawerBody onClose={onClose} {...body} />
    </Modal>
  )
}

/** The draft lives only while the drawer is open; Apply commits it to the URL. */
function DrawerBody({
  onClose,
  state,
  onApply,
  facets,
  departmentId,
}: Omit<FilterDrawerProps, 'open'>) {
  const [draft, setDraft] = useState(state)
  return (
    <div className="flex max-h-[92dvh] flex-col">
      <div className="flex items-center justify-between border-b border-line px-gutter py-2">
        <h2 className="font-display text-xl font-extrabold">Filtrar</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar filtros"
          className="grid size-11 place-items-center"
        >
          <CloseIcon />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-gutter py-4">
        <FilterPanel
          state={draft}
          onChange={setDraft}
          facets={facets}
          departmentId={departmentId}
          idPrefix="drawer"
        />
      </div>
      <div className="grid grid-cols-2 gap-2 border-t border-line bg-surface-raised px-gutter py-3">
        <button
          type="button"
          className={buttonOutline}
          onClick={() => {
            setDraft(clearFilters(draft))
          }}
        >
          Limpiar
        </button>
        <button
          type="button"
          className={buttonPrimary}
          onClick={() => {
            onApply(draft)
            onClose()
          }}
        >
          Aplicar
        </button>
      </div>
    </div>
  )
}

export function ListingPage() {
  const { departmentId } = useParams()
  const [params, setParams] = useSearchParams()
  const state = useMemo(() => parseListing(params), [params])
  const isDesktop = useMediaQuery('(min-width: 64rem)')
  const [drawerOpen, setDrawerOpen] = useState(false)

  const categories = useCategories(marketData)
  const department = categories.data?.find((c) => c.id === departmentId)
  const unknownDepartment =
    departmentId !== undefined && categories.isSuccess && department === undefined

  // Unfiltered base (department + search): the source of facet options and department counts.
  const base = useProductList(marketData, {
    pageSize: 60,
    ...(departmentId ? { categoryId: departmentId } : {}),
    ...(state.search ? { search: state.search } : {}),
  })
  const list = useProductList(marketData, toProductQuery(state, departmentId))

  const facets = useMemo(() => facetsOf(base.data?.items ?? []), [base.data])
  const products = useMemo(
    () => applyClientRules(list.data?.items ?? [], state, departmentId),
    [list.data, state, departmentId],
  )
  const chips = activeChips(state, departmentId)
  const searchDepartments = useMemo(() => {
    if (departmentId) return []
    const counts = new Map<string, number>()
    for (const p of base.data?.items ?? [])
      counts.set(p.categoryId, (counts.get(p.categoryId) ?? 0) + 1)
    return (categories.data ?? [])
      .filter((c) => counts.has(c.id))
      .map((c) => ({ ...c, count: counts.get(c.id) ?? 0 }))
  }, [departmentId, base.data, categories.data])

  const apply = (next: ListingState) => {
    setParams(serializeListing(next), { replace: true })
  }

  const heading = department
    ? department.label
    : state.search
      ? `Resultados para “${state.search}”`
      : state.onSale
        ? 'Ofertas'
        : 'Todos los productos'
  const countText = list.isSuccess
    ? `${String(products.length)} ${products.length === 1 ? 'resultado' : 'resultados'}`
    : 'Cargando…'

  if (unknownDepartment) {
    return (
      <div className="grid gap-3 px-gutter py-6">
        <EmptyState title="No encontramos este departamento">
          <p>Revisa el menú de departamentos para seguir explorando.</p>
        </EmptyState>
        <Link to="/market" className={`${buttonPrimary} justify-self-start`}>
          Ir al inicio
        </Link>
      </div>
    )
  }

  const panel = { facets, departmentId, state }

  return (
    <div className="px-gutter py-4">
      <title>{`${heading} · Plaza`}</title>
      <nav aria-label="Ruta de navegación" className="mb-2 text-xs text-ink-muted">
        <Link to="/market" className="hover:text-accent hover:underline">
          Inicio
        </Link>
        {' / '}
        <span aria-current="page">{department?.label ?? 'Búsqueda'}</span>
      </nav>
      <header className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h1 className="font-display text-2xl font-extrabold tracking-tight">{heading}</h1>
        <p role="status" className="font-mono text-sm text-ink-muted">
          {countText}
        </p>
      </header>

      {searchDepartments.length > 1 ? (
        <nav aria-label="Departamentos con resultados" className="mb-3">
          <ul className="plaza-scroller flex gap-2 overflow-x-auto">
            {searchDepartments.map((d) => (
              <li key={d.id} className="shrink-0">
                <Link
                  to={`/market/departamento/${d.id}${state.search ? `?q=${encodeURIComponent(state.search)}` : ''}`}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line bg-surface-raised px-3 hover:border-accent"
                >
                  {d.label} <span className="font-mono text-xs text-ink-muted">{d.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      <div className="flex items-center justify-between gap-3 rounded-card border border-line bg-surface-raised px-3 py-1.5">
        {isDesktop ? (
          <p className="text-ink-muted">Filtra por marca, precio, calificación y más.</p>
        ) : (
          <button
            type="button"
            aria-haspopup="dialog"
            className="inline-flex min-h-11 items-center gap-2 font-semibold"
            onClick={() => {
              setDrawerOpen(true)
            }}
          >
            Filtrar{chips.length > 0 ? ` (${String(chips.length)})` : ''}
          </button>
        )}
        <label className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-ink-muted">Ordenar</span>
          <select
            value={state.sort}
            onChange={(event) => {
              const sort = SORT_OPTIONS.find((o) => o.value === event.target.value)?.value
              if (sort) apply({ ...state, sort })
            }}
            className="min-h-11 min-w-0 rounded-control border border-line bg-surface-raised px-2 font-semibold hover:border-ink"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[15rem_minmax(0,1fr)]">
        {isDesktop ? (
          <aside
            aria-label="Filtros"
            className="self-start rounded-card border border-line bg-surface-raised p-3 lg:sticky lg:top-28"
          >
            <FilterPanel {...panel} onChange={apply} idPrefix="side" />
          </aside>
        ) : null}

        <section aria-label="Productos" aria-busy={list.isFetching}>
          {chips.length > 0 ? (
            <ul aria-label="Filtros activos" className="mb-3 flex flex-wrap items-center gap-2">
              {chips.map((chip) => (
                <li key={chip.key}>
                  <button
                    type="button"
                    aria-label={`Quitar filtro: ${chip.label}`}
                    onClick={() => {
                      apply(chip.without)
                    }}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-accent bg-surface-raised px-3 text-accent transition-colors duration-(--shift-duration-fast) hover:bg-accent hover:text-accent-ink"
                  >
                    {chip.label}
                    <CloseIcon className="size-3.5" />
                  </button>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={() => {
                    apply(clearFilters(state))
                  }}
                  className="min-h-11 px-2 underline underline-offset-4"
                >
                  Limpiar todo
                </button>
              </li>
            </ul>
          ) : null}

          {list.isPending ? (
            <ProductGridSkeleton />
          ) : list.isError ? (
            <ErrorState
              error={list.error}
              title="No pudimos cargar los productos"
              onRetry={() => {
                void list.refetch()
              }}
            />
          ) : products.length === 0 ? (
            <EmptyState
              title="Ningún producto coincide"
              {...(chips.length > 0
                ? {
                    actionLabel: 'Quitar filtros',
                    onAction: () => {
                      apply(clearFilters(state))
                    },
                  }
                : {})}
            >
              <p>
                {state.search
                  ? `No encontramos resultados para “${state.search}”. Revisa la ortografía o prueba con una palabra más general.`
                  : 'Prueba con menos filtros o explora otro departamento.'}
              </p>
            </EmptyState>
          ) : (
            <ul
              className={`grid grid-cols-2 gap-2 transition-opacity duration-(--shift-duration-fast) sm:grid-cols-3 xl:grid-cols-4 ${
                list.isPlaceholderData ? 'opacity-50' : ''
              }`}
            >
              {products.map((product) => (
                <li key={product.id}>
                  <Slot name="ProductCard" product={product} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {!isDesktop ? (
        <FilterDrawer
          open={drawerOpen}
          onClose={() => {
            setDrawerOpen(false)
          }}
          onApply={apply}
          {...panel}
        />
      ) : null}
    </div>
  )
}

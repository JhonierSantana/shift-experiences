import { useMemo, useState, type ComponentProps } from 'react'
import { useSearchParams } from 'react-router'
import { Slot } from '@/engine'
import { useCollections, useProductList } from '@/infra/query'
import { CloseIcon } from '../components/Icons'
import { FilterPanel } from '../components/FilterPanel'
import { Modal } from '../components/Modal'
import { EmptyState, ErrorState, ProductGridSkeleton } from '../components/States'
import { buttonOutline, buttonPrimary, eyebrow } from '../components/styles'
import {
  SORT_OPTIONS,
  activeChips,
  applyPriceBand,
  clearFilters,
  facetsOf,
  parseFilters,
  serializeFilters,
  toProductQuery,
  withFilters,
  type CatalogFilters,
} from '../domain/catalogFilters'
import { fashionData } from '../domain'
import { useMediaQuery } from '../lib/useMediaQuery'

const ALL_QUERY = { pageSize: 60 } as const

function FilterSheet({
  open,
  onClose,
  filters,
  onApply,
  ...panel
}: {
  readonly open: boolean
  readonly onClose: () => void
  readonly filters: CatalogFilters
  readonly onApply: (next: CatalogFilters) => void
} & Pick<ComponentProps<typeof FilterPanel>, 'collections' | 'sizes' | 'colors'>) {
  // Draft lives only while the sheet is open; Apply commits it to the URL.
  return (
    <Modal open={open} onClose={onClose} label="Filtrar piezas" placement="bottom">
      <SheetBody filters={filters} onApply={onApply} onClose={onClose} {...panel} />
    </Modal>
  )
}

function SheetBody({
  filters,
  onApply,
  onClose,
  ...panel
}: {
  readonly filters: CatalogFilters
  readonly onApply: (next: CatalogFilters) => void
  readonly onClose: () => void
} & Pick<ComponentProps<typeof FilterPanel>, 'collections' | 'sizes' | 'colors'>) {
  const [draft, setDraft] = useState(filters)
  return (
    <div className="flex max-h-[90dvh] flex-col">
      <div className="flex items-center justify-between border-b border-line px-gutter py-3">
        <h2 className="font-display text-3xl">Filtrar</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar filtros"
          className="grid size-11 place-items-center"
        >
          <CloseIcon />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-gutter py-6">
        <FilterPanel filters={draft} onChange={setDraft} idPrefix="sheet" {...panel} />
      </div>
      <div className="grid grid-cols-2 gap-3 border-t border-line bg-surface px-gutter py-4">
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

export function CatalogPage() {
  const [params, setParams] = useSearchParams()
  const filters = useMemo(() => parseFilters(params), [params])
  const isDesktop = useMediaQuery('(min-width: 64rem)')
  const [sheetOpen, setSheetOpen] = useState(false)

  const list = useProductList(fashionData, toProductQuery(filters))
  // Unfiltered list (cached, shared with other pages) only to derive facet options.
  const all = useProductList(fashionData, ALL_QUERY)
  const { data: collections = [] } = useCollections(fashionData)
  const facets = useMemo(() => facetsOf(all.data?.items ?? []), [all.data])

  const products = useMemo(
    () => applyPriceBand(list.data?.items ?? [], filters.priceBandId),
    [list.data, filters.priceBandId],
  )
  const chips = activeChips(filters, collections, facets.colors)
  const collection = collections.find((c) => c.id === filters.collectionId)

  const apply = (next: CatalogFilters) => {
    setParams(serializeFilters(next), { replace: true })
  }

  const panelProps = { collections, sizes: facets.sizes, colors: facets.colors }

  return (
    <div className="px-gutter pt-10 pb-section lg:pt-16">
      <title>{`${collection?.name ?? 'Colección'} · Maison Vela`}</title>
      <header className="mb-10 grid gap-4 lg:mb-14 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <p className={`${eyebrow} mb-4 text-ink-muted`}>
            {collection?.season ?? 'Toda la maison'}
          </p>
          <h1 className="font-display text-6xl leading-[0.9] sm:text-8xl">
            {collection?.name ?? 'La colección'}
          </h1>
        </div>
        {collection ? (
          <p className="max-w-prose self-end text-ink-muted lg:col-span-4">
            {collection.statement}
          </p>
        ) : null}
      </header>

      <div className="flex items-center justify-between gap-4 border-y border-line py-3">
        {isDesktop ? (
          <p className={`${eyebrow} text-ink-muted`} role="status">
            {list.isSuccess ? `${String(products.length)} piezas` : 'Cargando…'}
          </p>
        ) : (
          <button
            type="button"
            aria-haspopup="dialog"
            className={`${eyebrow} min-h-11 pr-4`}
            onClick={() => {
              setSheetOpen(true)
            }}
          >
            Filtrar{chips.length > 0 ? ` (${String(chips.length)})` : ''}
          </button>
        )}
        <label className={`${eyebrow} flex min-w-0 items-center gap-3`}>
          Ordenar
          <select
            value={filters.sort}
            onChange={(event) => {
              const sort = SORT_OPTIONS.find((o) => o.value === event.target.value)?.value
              if (sort) apply(withFilters(filters, { sort }))
            }}
            className="min-h-11 min-w-0 max-w-40 border-0 border-b border-ink bg-transparent py-2 pr-6 text-base normal-case tracking-normal sm:max-w-none"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[15rem_1fr] lg:gap-16">
        {isDesktop ? (
          <aside aria-label="Filtros" className="lg:sticky lg:top-24 lg:self-start">
            <FilterPanel filters={filters} onChange={apply} idPrefix="side" {...panelProps} />
          </aside>
        ) : null}

        <section aria-label="Piezas" aria-busy={list.isFetching}>
          {chips.length > 0 ? (
            <ul aria-label="Filtros activos" className="mb-8 flex flex-wrap items-center gap-2">
              {chips.map((chip) => (
                <li key={chip.key}>
                  <button
                    type="button"
                    aria-label={`Quitar filtro: ${chip.label}`}
                    onClick={() => {
                      apply(chip.without)
                    }}
                    className="flex min-h-11 items-center gap-2 border border-ink px-3 text-sm transition-colors duration-(--shift-duration-base) ease-brand hover:bg-ink hover:text-surface"
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
                    apply(clearFilters(filters))
                  }}
                  className={`${eyebrow} min-h-11 px-2 underline underline-offset-4`}
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
              title="No pudimos cargar la colección"
              onRetry={() => {
                void list.refetch()
              }}
            />
          ) : products.length === 0 ? (
            <EmptyState
              title="Ninguna pieza coincide"
              actionLabel="Quitar filtros"
              onAction={() => {
                apply(clearFilters(filters))
              }}
            >
              <p>Prueba con menos filtros o explora otra colección.</p>
            </EmptyState>
          ) : (
            <ul
              className={`grid grid-cols-2 gap-x-4 gap-y-12 transition-opacity duration-(--shift-duration-base) sm:gap-x-6 xl:grid-cols-3 ${
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
          {!isDesktop ? (
            <p role="status" className="sr-only">
              {list.isSuccess ? `${String(products.length)} piezas` : ''}
            </p>
          ) : null}
        </section>
      </div>

      {!isDesktop ? (
        <FilterSheet
          open={sheetOpen}
          onClose={() => {
            setSheetOpen(false)
          }}
          filters={filters}
          onApply={apply}
          {...panelProps}
        />
      ) : null}
    </div>
  )
}

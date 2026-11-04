import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Capability } from '@/engine'
import { useProductsByIds } from '@/infra/query'
import { CheckIcon } from '../components/Icons'
import { MediaImage } from '../components/MediaImage'
import { EmptyState, ErrorState } from '../components/States'
import { buttonOutline, buttonPrimary } from '../components/styles'
import { MAX_COMPARE, marketCompareStore, useCompare } from '../compare/store'
import { marketData } from '../domain'
import { buildCompareRows } from '../domain/compare'

function ComparePageBody() {
  const ids = useCompare((s) => s.ids)
  const [onlyDiffs, setOnlyDiffs] = useState(false)
  const query = useProductsByIds(marketData, ids)
  const products = useMemo(() => query.data ?? [], [query.data])
  const rows = useMemo(() => buildCompareRows(products), [products])
  const visible = onlyDiffs ? rows.filter((r) => r.differs) : rows
  const groups = useMemo(() => {
    const map = new Map<string, typeof rows>()
    for (const row of visible) map.set(row.group, [...(map.get(row.group) ?? []), row])
    return [...map]
  }, [visible])

  if (ids.length === 0) {
    return (
      <EmptyState title="Aún no tienes productos para comparar">
        <p>
          Usa el botón “Comparar” en cualquier producto. Puedes elegir hasta {MAX_COMPARE} y verlos
          lado a lado.
        </p>
      </EmptyState>
    )
  }
  if (query.isPending) {
    return (
      <div role="status" className="h-64 animate-pulse rounded-card bg-surface-raised">
        <span className="sr-only">Cargando comparación…</span>
      </div>
    )
  }
  if (query.isError) {
    return (
      <ErrorState
        error={query.error}
        title="No pudimos cargar la comparación"
        onRetry={() => {
          void query.refetch()
        }}
      />
    )
  }
  if (products.length < 2) {
    return (
      <EmptyState title="Elige al menos dos productos">
        <p>Añade otro producto al comparador para ver la tabla.</p>
      </EmptyState>
    )
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="inline-flex min-h-11 items-center gap-2">
          <input
            type="checkbox"
            checked={onlyDiffs}
            onChange={(event) => {
              setOnlyDiffs(event.target.checked)
            }}
            className="size-4 accent-(--shift-accent)"
          />
          Mostrar solo diferencias
        </label>
        <button
          type="button"
          className={buttonOutline}
          onClick={() => {
            marketCompareStore.getState().clear()
          }}
        >
          Vaciar comparador
        </button>
      </div>

      <p className="text-sm text-ink-muted">
        <CheckIcon className="mr-1 inline size-4 text-accent" />
        Las celdas marcadas con “Mejor” tienen el mejor valor de su fila.
      </p>

      {/* Focusable scroll region: keyboard users can pan the wide table. */}
      <div
        role="region"
        aria-label="Tabla comparativa, desplázate horizontalmente"
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        className="overflow-x-auto rounded-card border border-line bg-surface-raised"
      >
        <table className="w-full min-w-max border-collapse text-left">
          <caption className="sr-only">
            Comparación de {products.length} productos: {products.map((p) => p.title).join(', ')}
          </caption>
          <thead>
            <tr>
              <td className="sticky left-0 z-10 w-28 bg-surface-raised p-2 sm:w-40" />
              {products.map((p) => (
                <th
                  key={p.id}
                  scope="col"
                  className="w-44 min-w-44 border-l border-line p-2 align-top font-normal sm:w-56"
                >
                  <div className="grid gap-1.5">
                    <MediaImage media={p.media[0]} className="rounded-control" />
                    <Link
                      to={`/market/producto/${p.id}`}
                      className="line-clamp-2 leading-snug font-semibold hover:text-accent"
                    >
                      {p.title}
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        marketCompareStore.getState().remove(p.id)
                      }}
                      aria-label={`Quitar de la comparación: ${p.title}`}
                      className="min-h-11 justify-self-start text-sm text-ink-muted underline underline-offset-4"
                    >
                      Quitar
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          {groups.map(([group, groupRows]) => (
            <tbody key={group}>
              <tr>
                <th
                  scope="colgroup"
                  colSpan={products.length + 1}
                  className="bg-surface px-3 py-1.5 font-mono text-xs tracking-wide text-ink-muted uppercase"
                >
                  {group}
                </th>
              </tr>
              {groupRows.map((row) => (
                <tr key={row.id} className="border-t border-line">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 bg-surface-raised p-2 font-semibold"
                  >
                    {row.label}
                  </th>
                  {row.cells.map((cell, i) => (
                    <td
                      key={products[i]?.id ?? i}
                      className={`border-l border-line p-2 ${cell.best ? 'bg-(--market-promo)/25 font-semibold' : ''}`}
                    >
                      {cell.text}
                      {cell.best ? (
                        <span className="ml-1.5 rounded-control bg-(--market-promo) px-1 py-0.5 font-mono text-[0.65rem] font-bold text-ink uppercase">
                          Mejor
                        </span>
                      ) : null}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
      {visible.length === 0 ? (
        <p role="status" className="text-ink-muted">
          Estos productos no tienen diferencias en las características listadas.
        </p>
      ) : null}
    </div>
  )
}

export function ComparePage() {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3 px-gutter py-4">
      <title>Comparar productos · Plaza</title>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">Comparar productos</h1>
      <Capability
        name="compare"
        fallback={
          <p className="text-ink-muted">El comparador no está disponible en esta tienda.</p>
        }
      >
        <ComparePageBody />
      </Capability>
      <Link to="/market" className={`${buttonPrimary} justify-self-start`}>
        Seguir explorando
      </Link>
    </div>
  )
}

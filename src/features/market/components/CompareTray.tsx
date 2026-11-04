import { Link, useMatch } from 'react-router'
import { Capability } from '@/engine'
import { useProductsByIds } from '@/infra/query'
import { MAX_COMPARE, marketCompareStore, useCompare } from '../compare/store'
import { marketData } from '../domain'
import { CloseIcon } from './Icons'
import { MediaImage } from './MediaImage'
import { buttonPrimary } from './styles'

/**
 * Persistent tray: what is queued for comparison, one tap to remove, one to compare.
 * The live region announces the "list is full" notice to screen readers.
 */
export function CompareTray() {
  return (
    <Capability name="compare">
      <Tray />
    </Capability>
  )
}

function Tray() {
  const ids = useCompare((s) => s.ids)
  const notice = useCompare((s) => s.notice)
  const onCompare = useMatch('/market/comparar') !== null
  const onProduct = useMatch('/market/producto/:id') !== null
  const products = useProductsByIds(marketData, ids)
  const byId = new Map((products.data ?? []).map((p) => [p.id, p]))

  return (
    <>
      <p role="status" className="sr-only">
        {notice ?? ''}
      </p>
      {ids.length > 0 && !onCompare ? (
        <aside
          aria-label="Comparador"
          // On product pages the sticky buy bar owns the very bottom edge on mobile.
          className={`plaza-drop fixed inset-x-0 z-(--shift-z-header) border-t-2 border-accent bg-surface-raised shadow-[0_-4px_16px_rgb(14_23_38/0.12)] ${
            onProduct ? 'bottom-[4.5rem] lg:bottom-0' : 'bottom-0'
          }`}
        >
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-gutter py-2">
            <p className="hidden font-semibold sm:block">
              Comparador{' '}
              <span className="font-mono text-ink-muted">
                {ids.length}/{MAX_COMPARE}
              </span>
            </p>
            <ul className="flex min-w-0 flex-1 gap-2 overflow-x-auto">
              {ids.map((id) => {
                const product = byId.get(id)
                return (
                  <li
                    key={id}
                    className="flex shrink-0 items-center gap-1 rounded-control border border-line-strong bg-surface pr-0.5"
                  >
                    {product ? (
                      <MediaImage media={product.media[0]} className="size-10 rounded-l-control" />
                    ) : (
                      <span className="size-10 animate-pulse bg-surface" aria-hidden="true" />
                    )}
                    <span className="hidden max-w-32 truncate text-xs sm:block">
                      {product?.title ?? 'Cargando…'}
                    </span>
                    <button
                      type="button"
                      aria-label={`Quitar de la comparación: ${product?.title ?? id}`}
                      onClick={() => {
                        marketCompareStore.getState().remove(id)
                      }}
                      className="grid size-11 place-items-center"
                    >
                      <CloseIcon className="size-4" />
                    </button>
                  </li>
                )
              })}
            </ul>
            <button
              type="button"
              onClick={() => {
                marketCompareStore.getState().clear()
              }}
              className="min-h-11 px-2 text-sm text-ink-muted underline underline-offset-4"
            >
              Limpiar
            </button>
            {ids.length >= 2 ? (
              <Link to="/market/comparar" className={buttonPrimary}>
                Comparar ({ids.length})
              </Link>
            ) : (
              <p className="text-xs text-ink-muted">Añade uno más</p>
            )}
          </div>
        </aside>
      ) : null}
    </>
  )
}

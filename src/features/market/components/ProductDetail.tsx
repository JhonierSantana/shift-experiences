import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { formatMoney, type MarketProduct } from '@/core/domain'
import { Capability } from '@/engine'
import { useCategories } from '@/infra/query'
import { marketData } from '../domain'
import { priceDisplay } from '../domain/pricing'
import { stockLabel } from '../domain/stock'
import { useAddToCart } from '../lib/useAddToCart'
import { useCatalog } from '../lib/useCatalog'
import { useOffscreen } from '../lib/useOffscreen'
import { useCartDrawer } from '../shell/uiState'
import { TruckIcon } from './Icons'
import { MediaImage } from './MediaImage'
import { Price, RatingLine, StockBadge } from './Price'
import { CompareButton, WishlistButton } from './ProductActions'
import { ProductCarousel } from './ProductCarousel'
import { ProductReviews } from './ProductReviews'
import { buttonPrimary, sectionTitle, stepButton } from './styles'

function Gallery({ product }: { product: MarketProduct }) {
  const [index, setIndex] = useState(0)
  const active = product.media[index] ?? product.media[0]
  return (
    <div className="grid gap-2 lg:grid-cols-[4.5rem_1fr]">
      <div className="rounded-card border border-line bg-surface-raised p-2 lg:col-start-2 lg:row-start-1">
        <MediaImage
          media={active}
          priority
          sizes="(min-width: 1024px) 45vw, 100vw"
          className="rounded-control"
        />
      </div>
      {product.media.length > 1 ? (
        <ul
          aria-label={`Imágenes de ${product.title}`}
          className="flex gap-2 lg:col-start-1 lg:row-start-1 lg:flex-col"
        >
          {product.media.map((media, i) => (
            <li key={media.alt}>
              <button
                type="button"
                aria-pressed={i === index}
                aria-label={`Ver imagen ${String(i + 1)} de ${String(product.media.length)}`}
                onClick={() => {
                  setIndex(i)
                }}
                className={`block w-16 overflow-hidden rounded-control border-2 lg:w-[4.5rem] ${i === index ? 'border-accent' : 'border-line'}`}
              >
                <MediaImage media={{ ...media, alt: '' }} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

function SpecsTable({ product }: { product: MarketProduct }) {
  const groups = useMemo(() => {
    const map = new Map<string, MarketProduct['specs'][number][]>()
    for (const spec of product.specs) map.set(spec.group, [...(map.get(spec.group) ?? []), spec])
    return [...map]
  }, [product.specs])
  if (groups.length === 0) return null
  return (
    <section aria-labelledby="market-specs-title" className="grid gap-2 scroll-mt-32">
      <h2 id="market-specs-title" className={sectionTitle}>
        Especificaciones
      </h2>
      <table className="w-full border-collapse overflow-hidden rounded-card border border-line bg-surface-raised text-left">
        <caption className="sr-only">Especificaciones de {product.title}</caption>
        {groups.map(([group, specs]) => (
          <tbody key={group}>
            <tr>
              <th
                colSpan={2}
                scope="colgroup"
                className="bg-surface px-3 py-1.5 font-mono text-xs tracking-wide text-ink-muted uppercase"
              >
                {group}
              </th>
            </tr>
            {specs.map((spec) => (
              <tr key={spec.label} className="border-t border-line">
                <th scope="row" className="w-2/5 px-3 py-2 font-semibold">
                  {spec.label}
                </th>
                <td className="px-3 py-2">{spec.value}</td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </section>
  )
}

function Seller({ product }: { product: MarketProduct }) {
  const { seller } = product
  return (
    <p className="rounded-control border border-line bg-surface p-2.5">
      Vendido por <strong>{seller.name}</strong>
      {seller.official ? (
        <span className="ml-1.5 rounded-control bg-accent px-1.5 py-0.5 text-xs font-semibold text-accent-ink">
          Tienda oficial
        </span>
      ) : null}
      <span className="block text-xs text-ink-muted">
        Reputación {seller.rating.toFixed(1)} de 5
      </span>
    </p>
  )
}

export function ProductDetail({ product }: { product: MarketProduct }) {
  const { inCart, max, add, feedback } = useAddToCart(product)
  const [rawQty, setRawQty] = useState(1)
  const qty = Math.min(Math.max(1, rawQty), Math.max(1, max))
  const buyRef = useRef<HTMLDivElement>(null)
  const stickyVisible = useOffscreen(buyRef)
  const showCart = useCartDrawer((s) => s.show)
  const catalog = useCatalog()
  const categories = useCategories(marketData)
  const { current } = priceDisplay(product)

  const related = useMemo(
    () =>
      (catalog.data?.items ?? [])
        .filter((p) => p.id !== product.id && p.categoryId === product.categoryId)
        .sort(
          (a, b) =>
            Number(b.brand === product.brand) - Number(a.brand === product.brand) ||
            b.rating.average - a.rating.average,
        )
        .slice(0, 8),
    [catalog.data, product],
  )

  const soldOut = product.stock <= 0
  const addLabel = soldOut
    ? 'Agotado'
    : max === 0
      ? 'Ya tienes todas las unidades'
      : 'Añadir al carrito'

  const doAdd = () => {
    if (add(qty)) setRawQty(1)
  }

  return (
    <article className="grid grid-cols-[minmax(0,1fr)] gap-6 px-gutter py-4">
      <title>{`${product.title} · Plaza`}</title>
      <nav aria-label="Ruta de navegación" className="text-xs text-ink-muted">
        <Link to="/market" className="hover:text-accent hover:underline">
          Inicio
        </Link>
        {' / '}
        <Link
          to={`/market/departamento/${product.categoryId}`}
          className="hover:text-accent hover:underline"
        >
          {categories.data?.find((c) => c.id === product.categoryId)?.label ?? 'Departamento'}
        </Link>
        {' / '}
        <span aria-current="page">{product.brand}</span>
      </nav>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-start">
        <Gallery product={product} />

        <div className="grid gap-3 rounded-card border border-line bg-surface-raised p-4">
          <p className="font-mono text-xs tracking-wide text-ink-muted uppercase">
            {product.brand}
          </p>
          <h1 className="font-display text-2xl leading-tight font-extrabold tracking-tight">
            {product.title}
          </h1>
          <Capability name="reviews">
            <a href="#resenas" className="w-fit hover:underline">
              <RatingLine product={product} />
            </a>
          </Capability>
          <Price product={product} size="lg" />
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <StockBadge stock={product.stock} always />
            {product.freeShipping ? (
              <span className="inline-flex items-center gap-1 font-semibold text-accent">
                <TruckIcon /> Envío gratis
              </span>
            ) : null}
          </p>
          <p className="text-ink-muted">{product.description}</p>
          <Seller product={product} />

          <div ref={buyRef} className="grid gap-3 border-t border-line pt-3">
            {!soldOut ? (
              <div className="flex flex-wrap items-center gap-3">
                <div role="group" aria-label="Cantidad" className="flex items-center">
                  <button
                    type="button"
                    className={`${stepButton} rounded-l-control`}
                    aria-label="Quitar una unidad"
                    disabled={qty <= 1}
                    onClick={() => {
                      setRawQty(qty - 1)
                    }}
                  >
                    −
                  </button>
                  <output
                    aria-label="Unidades a añadir"
                    className="grid h-11 w-12 place-items-center border-y border-line bg-surface font-mono tabular-nums"
                  >
                    {qty}
                  </output>
                  <button
                    type="button"
                    className={`${stepButton} rounded-r-control`}
                    aria-label="Añadir una unidad"
                    disabled={qty >= max}
                    onClick={() => {
                      setRawQty(qty + 1)
                    }}
                  >
                    +
                  </button>
                </div>
                <p className="text-sm text-ink-muted">
                  {max === 0
                    ? 'Tienes todo el stock en tu carrito'
                    : `${stockLabel(product.stock)}${product.stock > 5 ? ` · máx. ${String(max)}` : ''}`}
                  {inCart > 0 ? ` · ${String(inCart)} en tu carrito` : ''}
                </p>
              </div>
            ) : null}

            <button
              type="button"
              className={`${buttonPrimary} min-h-12 text-base`}
              disabled={max === 0}
              onClick={doAdd}
            >
              {addLabel}
            </button>

            {feedback?.kind === 'added' ? (
              <p
                role="status"
                className="flex flex-wrap items-center gap-3 font-semibold text-accent"
              >
                {feedback.message}
                <button
                  type="button"
                  onClick={showCart}
                  className="min-h-11 underline underline-offset-4"
                >
                  Ver carrito
                </button>
              </p>
            ) : null}
            {feedback?.kind === 'error' ? (
              <p role="alert" className="font-semibold text-(--market-deal)">
                {feedback.message}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <WishlistButton productId={product.id} title={product.title} variant="text" />
              <CompareButton productId={product.id} title={product.title} variant="text" />
            </div>
          </div>
        </div>
      </div>

      <SpecsTable product={product} />

      <Capability name="reviews">
        <ProductReviews product={product} />
      </Capability>

      <div className="grid gap-2">
        {catalog.isSuccess ? (
          <ProductCarousel title="Productos relacionados" products={related} />
        ) : null}
      </div>

      {stickyVisible && !soldOut ? (
        <div
          role="region"
          aria-label="Compra rápida"
          className="plaza-drop fixed inset-x-0 bottom-0 z-(--shift-z-header) grid grid-cols-[1fr_auto] items-center gap-3 border-t-2 border-accent bg-surface-raised px-gutter py-2 lg:hidden"
        >
          <p className="min-w-0 leading-tight">
            {feedback ? (
              <span
                role={feedback.kind === 'error' ? 'alert' : 'status'}
                className="text-sm font-semibold"
              >
                {feedback.message}
              </span>
            ) : (
              <>
                <span className="block truncate text-xs text-ink-muted">{product.title}</span>
                <span className="font-mono text-lg font-bold">{formatMoney(current)}</span>
              </>
            )}
          </p>
          <button
            type="button"
            disabled={max === 0}
            aria-label={`Añadir al carrito: ${product.title}`}
            onClick={doAdd}
            className={buttonPrimary}
          >
            Añadir
          </button>
        </div>
      ) : null}
    </article>
  )
}

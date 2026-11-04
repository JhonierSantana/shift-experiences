import { Link } from 'react-router'
import type { MarketProduct } from '@/core/domain'
import type { SlotPropsMap } from '@/engine'
import { useAddToCart } from '../lib/useAddToCart'
import { stockLevel } from '../domain/stock'
import { TruckIcon } from './Icons'
import { MediaImage } from './MediaImage'
import { DiscountBadge, Price, RatingLine, StockBadge } from './Price'
import { CompareButton, WishlistButton } from './ProductActions'
import { buttonPrimary } from './styles'

/** Market's ProductCard slot: dense tile, price and stock first, quick add and compare within reach. */
export function MarketProductCard({ product }: SlotPropsMap['ProductCard']) {
  if (product.kind !== 'market') return null
  return <Card product={product} />
}

function Card({ product }: { product: MarketProduct }) {
  const [primary] = product.media
  const { inCart, max, add } = useAddToCart(product)
  const out = stockLevel(product.stock) === 'out'

  return (
    <article className="group relative grid h-full grid-cols-[minmax(0,1fr)] grid-rows-[auto_1fr_auto] gap-2 rounded-card border border-line bg-surface-raised p-2.5 transition-colors duration-(--shift-duration-fast) hover:border-accent">
      <div className="relative">
        <Link
          to={`/market/producto/${product.id}`}
          tabIndex={-1}
          aria-hidden="true"
          className="block"
        >
          <MediaImage
            media={primary}
            sizes="(min-width: 1024px) 20vw, 45vw"
            className="rounded-control"
          />
        </Link>
        {product.discount ? (
          <DiscountBadge percent={product.discount.percent} className="absolute top-1.5 left-1.5" />
        ) : null}
        <div className="absolute top-0.5 right-0.5 z-10">
          <WishlistButton productId={product.id} title={product.title} />
        </div>
      </div>

      <div className="grid content-start gap-1">
        <p className="font-mono text-[0.7rem] tracking-wide text-ink-muted uppercase">
          {product.brand}
        </p>
        <h3 className="line-clamp-2 leading-snug font-semibold">
          <Link
            to={`/market/producto/${product.id}`}
            className="after:absolute after:inset-0 after:content-[''] hover:text-accent"
          >
            {product.title}
          </Link>
        </h3>
        <RatingLine product={product} />
        <Price product={product} />
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {product.freeShipping ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent">
              <TruckIcon /> Envío gratis
            </span>
          ) : null}
          <StockBadge stock={product.stock} />
        </p>
      </div>

      <div className="relative z-10 grid grid-cols-[1fr_auto] gap-1.5">
        <button
          type="button"
          disabled={max === 0}
          onClick={() => {
            add(1)
          }}
          aria-label={`Agregar al carrito: ${product.title}`}
          className={`${buttonPrimary} min-h-11 px-3 text-sm`}
        >
          {out
            ? 'Agotado'
            : max === 0
              ? 'Máximo en carrito'
              : inCart > 0
                ? `Agregar (${String(inCart)})`
                : 'Agregar'}
        </button>
        <CompareButton productId={product.id} title={product.title} />
      </div>
    </article>
  )
}

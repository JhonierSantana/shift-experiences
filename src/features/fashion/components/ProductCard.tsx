import { Link } from 'react-router'
import { formatMoney } from '@/core/domain'
import type { SlotPropsMap } from '@/engine'
import { MediaImage } from './MediaImage'
import { WishlistButton } from './WishlistButton'
import { eyebrow } from './styles'

/** Fashion's ProductCard slot: image-led tile, price and color count in quiet type. */
export function FashionProductCard({ product }: SlotPropsMap['ProductCard']) {
  if (product.kind !== 'fashion') return null
  const [primary] = product.media
  const soldOut = product.variants.every((v) => v.stock <= 0)
  const badge = soldOut ? 'Agotado' : product.tags.includes('nuevo') ? 'Nuevo' : null

  return (
    <article className="group relative">
      <Link to={`/fashion/producto/${product.id}`} className="block">
        <div className="overflow-hidden">
          <MediaImage
            media={primary}
            sizes="(min-width: 1024px) 25vw, 50vw"
            className="transition-transform duration-(--shift-duration-slow) ease-brand group-hover:scale-[1.03]"
          />
        </div>
        <div className="mt-4 grid gap-1">
          <h3 className="font-display text-xl leading-tight sm:text-2xl">{product.title}</h3>
          <p className={`${eyebrow} flex flex-wrap items-center gap-x-4 gap-y-1 text-ink-muted`}>
            <span>{formatMoney(product.price)}</span>
            <span className="flex items-center gap-1.5">
              {product.colors.map((color) => (
                <span
                  key={color.id}
                  aria-hidden="true"
                  className="size-2.5 rounded-full border border-line"
                  style={{ backgroundColor: color.swatch }}
                />
              ))}
              <span className="sr-only">
                Colores: {product.colors.map((c) => c.name).join(', ')}
              </span>
            </span>
          </p>
        </div>
      </Link>
      {badge ? (
        <span
          className={`${eyebrow} pointer-events-none absolute top-0 left-0 bg-surface px-3 py-2`}
        >
          {badge}
        </span>
      ) : null}
      <div className="absolute top-0 right-0">
        <WishlistButton productId={product.id} title={product.title} />
      </div>
    </article>
  )
}

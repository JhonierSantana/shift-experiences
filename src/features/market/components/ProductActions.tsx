import { Capability } from '@/engine'
import { MAX_COMPARE, useCompare, marketCompareStore } from '../compare/store'
import { useWishlist } from '../wishlist/store'
import { CompareIcon, HeartIcon } from './Icons'

interface ActionProps {
  readonly productId: string
  readonly title: string
  /** `icon` floats over a card image; `text` sits in the product detail. */
  readonly variant?: 'icon' | 'text'
}

export function WishlistButton({ productId, title, variant = 'icon' }: ActionProps) {
  const saved = useWishlist((s) => s.ids.includes(productId))
  const toggle = useWishlist((s) => s.toggle)
  return (
    <Capability name="wishlist">
      <button
        type="button"
        aria-pressed={saved}
        aria-label={variant === 'icon' ? `Guardar en favoritos: ${title}` : undefined}
        onClick={() => {
          toggle(productId)
        }}
        className={
          variant === 'icon'
            ? 'grid size-11 place-items-center rounded-full border border-line-strong bg-surface-raised text-ink transition-colors duration-(--shift-duration-fast) hover:border-ink aria-pressed:text-(--market-deal)'
            : 'inline-flex min-h-11 items-center gap-2 rounded-control border border-line-strong bg-surface-raised px-4 font-semibold transition-colors duration-(--shift-duration-fast) hover:border-ink aria-pressed:text-(--market-deal)'
        }
      >
        <HeartIcon filled={saved} />
        {variant === 'text' ? (saved ? 'Guardado en favoritos' : 'Guardar en favoritos') : null}
      </button>
    </Capability>
  )
}

export function CompareButton({ productId, title, variant = 'icon' }: ActionProps) {
  const selected = useCompare((s) => s.ids.includes(productId))
  const full = useCompare((s) => s.ids.length >= MAX_COMPARE)
  return (
    <Capability name="compare">
      <button
        type="button"
        aria-pressed={selected}
        aria-label={`Comparar: ${title}`}
        title={selected ? 'Quitar de la comparación' : 'Comparar'}
        // Stays focusable when the list is full so the reason can be announced (aria-disabled, not disabled).
        aria-disabled={!selected && full ? true : undefined}
        onClick={() => {
          marketCompareStore.getState().toggle(productId)
        }}
        className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-control border font-semibold transition-colors duration-(--shift-duration-fast) ${
          selected
            ? 'border-accent bg-accent text-accent-ink'
            : 'border-line-strong bg-surface-raised text-ink hover:border-ink'
        } ${!selected && full ? 'opacity-60' : ''} ${variant === 'text' ? 'px-4' : 'size-11'}`}
      >
        <CompareIcon className="size-5" />
        {variant === 'text' ? (selected ? 'En comparador' : 'Comparar') : null}
      </button>
    </Capability>
  )
}

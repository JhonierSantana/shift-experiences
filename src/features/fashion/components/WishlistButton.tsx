import { Capability } from '@/engine'
import { useWishlist } from '../wishlist/store'
import { HeartIcon } from './Icons'
import { buttonOutline } from './styles'

interface WishlistButtonProps {
  readonly productId: string
  readonly title: string
  /** `icon` floats over a card image; `text` sits in the product detail. */
  readonly variant?: 'icon' | 'text'
}

export function WishlistButton({ productId, title, variant = 'icon' }: WishlistButtonProps) {
  const saved = useWishlist((s) => s.ids.includes(productId))
  const toggle = useWishlist((s) => s.toggle)

  return (
    <Capability name="wishlist">
      {variant === 'icon' ? (
        <button
          type="button"
          aria-pressed={saved}
          aria-label={`Guardar en favoritos: ${title}`}
          onClick={() => {
            toggle(productId)
          }}
          className="grid size-11 place-items-center bg-surface/80 text-ink backdrop-blur-sm transition-colors duration-(--shift-duration-base) ease-brand hover:bg-surface"
        >
          <HeartIcon filled={saved} className="size-5" />
        </button>
      ) : (
        <button
          type="button"
          aria-pressed={saved}
          onClick={() => {
            toggle(productId)
          }}
          className={buttonOutline}
        >
          <HeartIcon filled={saved} className="size-5" />
          {saved ? 'Guardado en favoritos' : 'Guardar en favoritos'}
        </button>
      )}
    </Capability>
  )
}

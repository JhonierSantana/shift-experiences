import { useState } from 'react'
import { Link } from 'react-router'
import { formatMoney, type FashionCollection, type FashionProduct } from '@/core/domain'
import { Capability } from '@/engine'
import { fashionCart } from '../domain'
import { FIT_LABELS } from '../domain/sizeGuide'
import {
  chooseColor,
  colorOptions,
  defaultColorId,
  sizeOptions,
  stockNote,
  variantFor,
  type VariantChoice,
} from '../domain/variants'
import { useCartDrawer } from '../shell/drawerState'
import { Gallery } from './Gallery'
import { SizeGuideDialog } from './SizeGuideDialog'
import { WishlistButton } from './WishlistButton'
import { buttonPrimary, eyebrow, textLink } from './styles'

interface ProductDetailProps {
  readonly product: FashionProduct
  readonly collection?: FashionCollection | undefined
}

type Feedback = { readonly kind: 'success' | 'error'; readonly message: string } | null

const optionBase =
  'grid min-h-12 min-w-12 place-items-center border px-3 text-sm transition-colors duration-(--shift-duration-base) ease-brand'

export function ProductDetail({ product, collection }: ProductDetailProps) {
  const [choice, setChoice] = useState<VariantChoice>({
    size: undefined,
    colorId: defaultColorId(product),
  })
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [guideOpen, setGuideOpen] = useState(false)
  const showCart = useCartDrawer((s) => s.show)

  const variant = variantFor(product, choice.size, choice.colorId)
  const color = product.colors.find((c) => c.id === choice.colorId)
  const price = variant?.price ?? product.price
  const sizes = sizeOptions(product, choice.colorId)
  const colors = colorOptions(product, undefined)
  const soldOut = product.variants.every((v) => v.stock <= 0)
  const note = variant ? stockNote(variant.stock) : null

  const pick = (next: VariantChoice) => {
    setChoice(next)
    setFeedback(null)
  }

  const addToBag = () => {
    if (!variant) {
      setFeedback({ kind: 'error', message: 'Elige una talla para añadir la pieza a tu bolsa.' })
      return
    }
    const result = fashionCart.store.getState().add(product, { kind: 'fashion', sku: variant.sku })
    setFeedback(
      result.ok
        ? {
            kind: 'success',
            message: `${product.title}, talla ${variant.size}, ${color?.name ?? ''}: añadido a tu bolsa.`,
          }
        : { kind: 'error', message: result.issues[0].message },
    )
  }

  return (
    <div className="grid gap-10 px-gutter pb-section lg:grid-cols-12 lg:gap-16">
      <div className="lg:col-span-7">
        <Gallery media={product.media} title={product.title} />
      </div>

      <div className="grid content-start gap-8 lg:sticky lg:top-24 lg:col-span-5 lg:self-start">
        <header className="grid gap-4">
          <nav aria-label="Ruta de navegación" className={`${eyebrow} text-ink-muted`}>
            <Link to="/fashion/catalogo" className="hover:text-ink">
              Colección
            </Link>
            {collection ? (
              <>
                <span aria-hidden="true"> / </span>
                <Link
                  to={`/fashion/catalogo?coleccion=${collection.id}`}
                  className="hover:text-ink"
                >
                  {collection.name}
                </Link>
              </>
            ) : null}
          </nav>
          <h1 className="font-display text-5xl leading-[0.95] sm:text-6xl">{product.title}</h1>
          <p className="text-xl tabular-nums">{formatMoney(price)}</p>
          <p className="max-w-prose text-ink-muted">{product.description}</p>
        </header>

        <fieldset className="grid gap-3">
          <legend className={`${eyebrow} mb-3`}>
            Color <span className="text-ink-muted">· {color?.name}</span>
          </legend>
          <div className="flex flex-wrap gap-3">
            {colors.map(({ color: option, available }) => (
              <label key={option.id} className="relative">
                <input
                  type="radio"
                  name="color"
                  value={option.id}
                  checked={choice.colorId === option.id}
                  onChange={() => {
                    pick(chooseColor(product, choice, option.id))
                  }}
                  className="peer sr-only"
                />
                <span
                  aria-hidden="true"
                  className="grid size-12 place-items-center border border-line-strong peer-checked:border-ink peer-focus-visible:outline-3 peer-focus-visible:outline-offset-4"
                >
                  <span
                    className={`size-8 rounded-full border border-line ${available ? '' : 'opacity-40'}`}
                    style={{ backgroundColor: option.swatch }}
                  />
                </span>
                <span className="sr-only">
                  {option.name}
                  {available ? '' : ', agotado'}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="grid gap-3" aria-describedby="size-help">
          <legend className="mb-3 flex w-full items-baseline justify-between">
            <span className={eyebrow}>Talla</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {sizes.map(({ size, available }) => (
              <label key={size} className="relative">
                <input
                  type="radio"
                  name="size"
                  value={size}
                  disabled={!available}
                  checked={choice.size === size}
                  onChange={() => {
                    pick({ ...choice, size })
                  }}
                  className="peer sr-only"
                />
                <span
                  className={`${optionBase} peer-checked:border-ink peer-checked:bg-ink peer-checked:text-surface peer-focus-visible:outline-3 peer-focus-visible:outline-offset-4 ${
                    available
                      ? 'border-line-strong hover:border-ink'
                      : 'cursor-not-allowed border-line text-ink-muted line-through decoration-1'
                  }`}
                >
                  {size}
                  {available ? null : <span className="sr-only"> (agotada en este color)</span>}
                </span>
              </label>
            ))}
          </div>
          <p id="size-help" className="min-h-5 text-sm text-ink-muted">
            {note ??
              (soldOut
                ? 'Esta pieza está agotada por ahora.'
                : 'Las tallas tachadas están agotadas en este color.')}
          </p>
          <Capability name="sizeGuide">
            <button
              type="button"
              onClick={() => {
                setGuideOpen(true)
              }}
              className={`${textLink} justify-self-start`}
            >
              Guía de tallas
            </button>
          </Capability>
        </fieldset>

        <div className="grid gap-4">
          <button type="button" onClick={addToBag} disabled={soldOut} className={buttonPrimary}>
            {soldOut ? 'Agotado' : 'Añadir a la bolsa'}
          </button>
          <WishlistButton productId={product.id} title={product.title} variant="text" />
          <div className="min-h-6">
            <p role="status" className="text-sm">
              {feedback?.kind === 'success' ? feedback.message : ''}
            </p>
            <p role="alert" className="text-sm text-accent">
              {feedback?.kind === 'error' ? feedback.message : ''}
            </p>
            {feedback?.kind === 'success' ? (
              <button type="button" onClick={showCart} className={`${textLink} mt-3`}>
                Ver bolsa
              </button>
            ) : null}
          </div>
        </div>

        <div className="border-t border-line">
          <details className="vela-details border-b border-line py-5">
            <summary className={`${eyebrow} cursor-pointer`}>Ajuste y composición</summary>
            <div className="mt-4 grid gap-2 text-ink-muted">
              <p>{FIT_LABELS[product.fit]}</p>
              <p>{product.composition}</p>
            </div>
          </details>
          <details className="vela-details border-b border-line py-5">
            <summary className={`${eyebrow} cursor-pointer`}>Cuidados</summary>
            <ul className="mt-4 grid gap-2 text-ink-muted">
              {product.care.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </details>
        </div>
      </div>

      <SizeGuideDialog
        product={product}
        open={guideOpen}
        onClose={() => {
          setGuideOpen(false)
        }}
      />
    </div>
  )
}

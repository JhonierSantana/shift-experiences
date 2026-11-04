import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { selectItemCount } from '@/core/cart'
import {
  Capability,
  MAIN_CONTENT_ID,
  SwitchLink,
  useExperienceSwitch,
  type ShellProps,
} from '@/engine'
import { FashionLogo } from '../brand/FashionLogo'
import { BagIcon, HeartIcon } from '../components/Icons'
import { fashionCart } from '../domain'
import '../fashion.css'
import { useWishlist } from '../wishlist/store'
import { CartDrawer } from './CartDrawer'
import { useCartDrawer } from './drawerState'

const sections = [
  { to: '/fashion/catalogo?orden=newest', label: 'Novedades' },
  { to: '/fashion/catalogo', label: 'Colección' },
  { to: '/fashion/favoritos', label: 'Favoritos' },
]

const eyebrow = 'text-[0.7rem] uppercase tracking-[0.28em]'

/** Editorial shell: centered wordmark, near-invisible chrome, full-screen overlay menu. */
export function FashionShell({ children }: ShellProps) {
  const menuRef = useRef<HTMLDialogElement>(null)
  const { experiences, current } = useExperienceSwitch()
  const close = () => {
    menuRef.current?.close()
  }
  const itemCount = fashionCart.useCart(selectItemCount)
  const savedCount = useWishlist((state) => state.ids.length)
  const showCart = useCartDrawer((state) => state.show)
  const [compact, setCompact] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setCompact(window.scrollY > 48)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <div className="flex min-h-dvh flex-col">
      <header
        className={`sticky top-0 z-(--shift-z-header) grid grid-cols-[1fr_auto_1fr] items-center border-b border-line bg-surface/90 px-gutter backdrop-blur-sm transition-[padding] duration-(--shift-duration-base) ease-brand ${compact ? 'py-1' : 'py-4'}`}
      >
        <button
          type="button"
          aria-haspopup="dialog"
          className={`${eyebrow} min-h-11 justify-self-start py-2`}
          onClick={() => menuRef.current?.showModal()}
        >
          Menú
        </button>
        <Link to="/fashion" aria-label="Maison Vela, inicio">
          <FashionLogo />
        </Link>
        <div className="flex items-center justify-self-end">
          <Capability name="wishlist">
            <Link
              to="/fashion/favoritos"
              aria-label={`Favoritos, ${String(savedCount)} ${savedCount === 1 ? 'pieza' : 'piezas'}`}
              className="relative grid size-11 place-items-center"
            >
              <HeartIcon />
              {savedCount > 0 ? (
                <span
                  aria-hidden="true"
                  className="absolute top-1.5 right-0.5 min-w-4 bg-ink px-1 text-center text-[0.65rem] leading-4 text-surface"
                >
                  {savedCount}
                </span>
              ) : null}
            </Link>
          </Capability>
          <button
            type="button"
            onClick={showCart}
            aria-haspopup="dialog"
            aria-label={`Bolsa, ${String(itemCount)} ${itemCount === 1 ? 'artículo' : 'artículos'}`}
            className="relative grid size-11 place-items-center"
          >
            <BagIcon />
            {itemCount > 0 ? (
              <span
                aria-hidden="true"
                className="absolute top-1.5 right-0.5 min-w-4 bg-ink px-1 text-center text-[0.65rem] leading-4 text-surface"
              >
                {itemCount}
              </span>
            ) : null}
          </button>
        </div>
      </header>

      <dialog
        ref={menuRef}
        aria-label="Menú"
        className="m-0 h-dvh max-h-none w-full max-w-none bg-surface text-ink backdrop:bg-ink/40"
      >
        <div className="mx-auto flex min-h-full max-w-6xl flex-col gap-12 px-gutter py-6">
          <div className="flex items-center justify-between">
            <FashionLogo />
            <button type="button" className={`${eyebrow} min-h-11 py-2`} onClick={close}>
              Cerrar
            </button>
          </div>
          <nav aria-label="Secciones">
            <ul className="grid gap-2">
              {sections.map((section) => (
                <li key={section.to}>
                  <Link
                    to={section.to}
                    onClick={close}
                    className="font-display text-5xl italic transition-colors duration-(--shift-duration-fast) ease-brand hover:text-accent sm:text-7xl"
                  >
                    {section.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-labelledby="fashion-switch-title" className="mt-auto border-t border-line pt-6">
            <h2 id="fashion-switch-title" className={`${eyebrow} text-ink-muted`}>
              Otras casas de SHIFT
            </h2>
            <ul className="mt-4 flex flex-wrap gap-x-10 gap-y-3">
              {experiences
                .filter((experience) => experience.id !== current)
                .map((experience) => (
                  <li key={experience.id}>
                    <SwitchLink to={experience.id} className="font-display text-3xl">
                      {experience.name}{' '}
                      <span className={`${eyebrow} text-ink-muted`}>{experience.sector}</span>
                    </SwitchLink>
                  </li>
                ))}
              <li>
                <SwitchLink to="selector" className="font-display text-3xl">
                  Todas las experiencias
                </SwitchLink>
              </li>
            </ul>
          </nav>
        </div>
      </dialog>

      <CartDrawer />

      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="flex-1">
        {children}
      </main>

      <footer className="flex flex-col gap-2 border-t border-line px-gutter py-10 sm:flex-row sm:justify-between">
        <p className={eyebrow}>Maison Vela — París · Bogotá</p>
        <p className={`${eyebrow} text-ink-muted`}>Una experiencia de SHIFT</p>
      </footer>
    </div>
  )
}

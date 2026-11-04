import { Link, NavLink } from 'react-router'
import { selectItemCount } from '@/core/cart'
import {
  Capability,
  MAIN_CONTENT_ID,
  SwitchLink,
  useExperienceSwitch,
  type ShellProps,
} from '@/engine'
import { MarketLogo } from '../brand/MarketLogo'
import { CartIcon, HeartIcon } from '../components/Icons'
import { CompareTray } from '../components/CompareTray'
import { MegaMenu } from '../components/MegaMenu'
import { SearchBox } from '../components/SearchBox'
import { marketCart } from '../domain'
import { useDepartments } from '../lib/useCatalog'
import { useWishlist } from '../wishlist/store'
import { CartDrawer } from './CartDrawer'
import { useCartDrawer } from './uiState'
import '../market.css'

const navLink =
  'inline-flex min-h-10 items-center border-b-2 border-transparent px-2 font-medium whitespace-nowrap hover:border-accent hover:text-accent aria-[current=page]:border-accent aria-[current=page]:text-accent'

/** Dense retail shell: promo/utility strip, prominent search, mega-menu, department bar, compare tray. */
export function MarketShell({ children }: ShellProps) {
  const { experiences, current } = useExperienceSwitch()
  const itemCount = marketCart.useCart(selectItemCount)
  const savedCount = useWishlist((s) => s.ids.length)
  const showCart = useCartDrawer((s) => s.show)
  const { departments } = useDepartments()

  return (
    <div className="flex min-h-dvh flex-col text-sm">
      <div className="bg-(--market-promo) text-ink">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-gutter py-1.5">
          <p className="font-semibold">Envío gratis desde $150.000</p>
          <nav aria-label="Cambiar experiencia" className="flex items-center gap-3">
            <span className="hidden text-ink/80 sm:inline">Experiencias:</span>
            <ul className="flex gap-3">
              {experiences
                .filter((experience) => experience.id !== current)
                .map((experience) => (
                  <li key={experience.id}>
                    <SwitchLink
                      to={experience.id}
                      className="inline-flex min-h-6 items-center font-semibold underline underline-offset-2"
                    >
                      {experience.name}
                    </SwitchLink>
                  </li>
                ))}
              <li>
                <SwitchLink
                  to="selector"
                  className="inline-flex min-h-6 items-center font-semibold underline underline-offset-2"
                >
                  SHIFT
                </SwitchLink>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <header className="sticky top-0 z-(--shift-z-header) border-b border-line bg-surface-raised">
        <div className="relative mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-2 px-gutter py-2 sm:gap-x-5">
          <MegaMenu />
          <Link to="/market" aria-label="Plaza, inicio" className="rounded-control">
            <MarketLogo />
          </Link>
          <SearchBox />
          <div className="ml-auto flex items-center sm:ml-0">
            <Capability name="wishlist">
              <Link
                to="/market/favoritos"
                aria-label={`Favoritos, ${String(savedCount)} ${savedCount === 1 ? 'producto' : 'productos'}`}
                className="relative grid size-11 place-items-center"
              >
                <HeartIcon className="size-6" />
                {savedCount > 0 ? (
                  <span
                    aria-hidden="true"
                    className="absolute top-1 right-0.5 min-w-4 rounded-full bg-(--market-deal) px-1 text-center font-mono text-[0.65rem] leading-4 font-bold text-white"
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
              aria-label={`Carrito, ${String(itemCount)} ${itemCount === 1 ? 'producto' : 'productos'}`}
              className="relative grid size-11 place-items-center"
            >
              <CartIcon />
              {itemCount > 0 ? (
                <span
                  aria-hidden="true"
                  className="absolute top-1 right-0 min-w-4 rounded-full bg-(--market-promo) px-1 text-center font-mono text-[0.65rem] leading-4 font-bold text-ink"
                >
                  {itemCount}
                </span>
              ) : null}
            </button>
          </div>
        </div>
        <nav aria-label="Departamentos" className="hidden border-t border-line lg:block">
          <ul className="plaza-scroller mx-auto flex max-w-7xl gap-1 overflow-x-auto px-gutter">
            <li className="shrink-0">
              <NavLink
                to="/market/buscar?sale=1&sort=discount"
                className={`${navLink} text-(--market-deal) font-bold`}
              >
                Ofertas
              </NavLink>
            </li>
            {departments.map((department) => (
              <li key={department.id} className="shrink-0">
                <NavLink to={`/market/departamento/${department.id}`} className={navLink}>
                  {department.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main
        id={MAIN_CONTENT_ID}
        tabIndex={-1}
        className="mx-auto w-full max-w-7xl flex-1 pb-20 lg:pb-0"
      >
        {children}
      </main>

      <footer className="border-t border-line bg-surface-raised">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-gutter py-8 text-ink-muted sm:grid-cols-4">
          <p className="col-span-2 sm:col-span-1">
            <MarketLogo className="text-ink" />
          </p>
          <p>Ayuda y devoluciones</p>
          <p>Vende en Plaza</p>
          <p>Una experiencia de SHIFT</p>
        </div>
      </footer>

      <CompareTray />
      <CartDrawer />
    </div>
  )
}

import { lazy, Suspense, useRef } from 'react'
import { Link, NavLink, useLocation, useSearchParams } from 'react-router'
import { selectItemCount } from '@/core/cart'
import { MAIN_CONTENT_ID, SwitchLink, useExperienceSwitch, type ShellProps } from '@/engine'
import { FoodLogo } from '../brand/FoodLogo'
import { BagIcon, HomeIcon, MenuIcon, SwapIcon } from '../components/Icons'
import { OrderBar } from '../components/OrderBar'
import { Sheet } from '../components/Sheet'
import { foodCart } from '../domain'
import { DISH_PARAM } from '../domain/dish'
import '../food.css'
import { useOrderUi } from '../state/orderUi'

// Sheets are lazy: their code (forms, option groups) only loads when first opened.
const OrderPanel = lazy(async () => ({
  default: (await import('../components/OrderPanel')).OrderPanel,
}))
const DishSheet = lazy(async () => ({
  default: (await import('../components/DishSheet')).DishSheet,
}))

const pill =
  'min-h-11 items-center gap-2 rounded-control px-4 font-semibold transition-transform duration-(--shift-duration-fast) ease-brand active:scale-95'

const tab =
  'grid min-h-16 w-full place-items-center content-center gap-0.5 py-2 text-xs font-semibold aria-[current=page]:text-accent'

/** Routes where the sticky order bar would only get in the way of the form. */
const HIDE_BAR = /^\/food\/(checkout|pedido)/

/** App-like shell: sticky top bar, mobile tab bar with order tab, sticky order bar, bottom sheets. */
export function FoodShell({ children }: ShellProps) {
  const switchRef = useRef<HTMLDialogElement>(null)
  const { experiences, current } = useExperienceSwitch()
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  const dishId = params.get(DISH_PARAM)
  const count = foodCart.useCart(selectItemCount)
  const { drawerOpen, openDrawer, closeDrawer, announcement } = useOrderUi()
  const openSwitch = () => switchRef.current?.showModal()

  return (
    <div className="flex min-h-dvh flex-col pb-20 md:pb-0">
      <header className="sticky top-0 z-(--shift-z-header) border-b border-line bg-surface/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-gutter">
          <Link to="/food" aria-label="Brasa & Co., inicio" className="rounded-control">
            <FoodLogo />
          </Link>
          <nav aria-label="Principal" className="hidden items-center gap-2 md:flex">
            <NavLink
              to="/food"
              end
              className={`${pill} inline-flex aria-[current=page]:bg-ink aria-[current=page]:text-surface`}
            >
              Inicio
            </NavLink>
            <NavLink
              to="/food/menu"
              className={`${pill} inline-flex aria-[current=page]:bg-ink aria-[current=page]:text-surface`}
            >
              Menú
            </NavLink>
            <button
              type="button"
              onClick={openDrawer}
              aria-haspopup="dialog"
              className={`${pill} inline-flex bg-accent text-accent-ink`}
            >
              <BagIcon /> Pedido{count > 0 ? ` (${String(count)})` : ''}
            </button>
            <button
              type="button"
              aria-haspopup="dialog"
              onClick={openSwitch}
              className={`${pill} inline-flex border-2 border-ink`}
            >
              Cambiar experiencia
            </button>
          </nav>
        </div>
      </header>

      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="mx-auto w-full min-w-0 max-w-6xl flex-1">
        {children}
      </main>

      <footer className="mx-auto w-full max-w-6xl px-gutter py-8 pb-24 text-sm text-ink-muted md:pb-8">
        Brasa &amp; Co. · Cocina de fuego · Una experiencia de SHIFT
      </footer>

      {HIDE_BAR.test(pathname) ? null : <OrderBar />}
      <p role="status" className="sr-only">
        {announcement}
      </p>

      <nav
        aria-label="Navegación móvil"
        className="fixed inset-x-0 bottom-0 z-(--shift-z-header) border-t border-line bg-surface-raised/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm md:hidden"
      >
        <ul className="grid grid-cols-4">
          <li>
            <NavLink to="/food" end className={tab}>
              <HomeIcon width="1.5em" height="1.5em" />
              Inicio
            </NavLink>
          </li>
          <li>
            <NavLink to="/food/menu" className={tab}>
              <MenuIcon width="1.5em" height="1.5em" />
              Menú
            </NavLink>
          </li>
          <li>
            <button type="button" aria-haspopup="dialog" onClick={openDrawer} className={tab}>
              <span className="relative">
                <BagIcon width="1.5em" height="1.5em" />
                {count > 0 ? (
                  <span
                    aria-hidden="true"
                    className="absolute -top-1.5 -right-2.5 grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[0.65rem] font-bold text-accent-ink"
                  >
                    {count}
                  </span>
                ) : null}
              </span>
              Pedido{count > 0 ? <span className="sr-only">, {count} platos</span> : null}
            </button>
          </li>
          <li>
            <button type="button" aria-haspopup="dialog" onClick={openSwitch} className={tab}>
              <SwapIcon width="1.5em" height="1.5em" />
              Cambiar
            </button>
          </li>
        </ul>
      </nav>

      <Sheet open={drawerOpen} onClose={closeDrawer} label="Tu pedido" variant="drawer">
        <Suspense
          fallback={
            <p role="status" className="p-gutter">
              Cargando tu pedido…
            </p>
          }
        >
          <OrderPanel onNavigate={closeDrawer} onClose={closeDrawer} />
        </Suspense>
      </Sheet>

      {dishId ? (
        <Suspense fallback={null}>
          <DishSheet key={dishId} id={dishId} />
        </Suspense>
      ) : null}

      {/* Bottom sheet on mobile, centered card on desktop. */}
      <dialog
        ref={switchRef}
        aria-labelledby="food-switch-title"
        className="mx-0 mt-auto mb-0 w-full max-w-none rounded-t-card bg-surface-raised p-6 text-ink shadow-(--food-shadow) backdrop:bg-ink/50 md:m-auto md:max-w-md md:rounded-card"
      >
        <div
          className="mx-auto mb-4 h-1.5 w-12 rounded-control bg-line md:hidden"
          aria-hidden="true"
        />
        <h2 id="food-switch-title" className="font-display text-2xl font-extrabold">
          ¿Antojo de otra cosa?
        </h2>
        <ul className="mt-4 grid gap-2">
          {experiences
            .filter((experience) => experience.id !== current)
            .map((experience) => (
              <li key={experience.id}>
                <SwitchLink
                  to={experience.id}
                  className="flex items-center justify-between rounded-card border border-line px-5 py-4 hover:border-accent"
                >
                  <span className="font-display text-xl font-bold">{experience.name}</span>
                  <span className="text-sm text-ink-muted">{experience.sector}</span>
                </SwitchLink>
              </li>
            ))}
          <li>
            <SwitchLink
              to="selector"
              className="flex items-center justify-between rounded-card border border-line px-5 py-4 hover:border-accent"
            >
              <span className="font-display text-xl font-bold">Todas las experiencias</span>
              <span className="text-sm text-ink-muted">SHIFT</span>
            </SwitchLink>
          </li>
        </ul>
        <form method="dialog" className="mt-4">
          <button
            type="submit"
            className={`${pill} flex w-full justify-center bg-accent text-accent-ink`}
          >
            Seguir aquí
          </button>
        </form>
      </dialog>
    </div>
  )
}

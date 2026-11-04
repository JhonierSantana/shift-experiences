import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useMediaQuery } from '../lib/useMediaQuery'
import { useDepartments, type Department } from '../lib/useCatalog'
import { ChevronIcon, CloseIcon, MenuIcon } from './Icons'
import { Modal } from './Modal'

function DepartmentColumns({
  departments,
  onNavigate,
  layout,
}: {
  readonly departments: readonly Department[]
  readonly onNavigate: () => void
  readonly layout: 'mega' | 'list'
}) {
  return (
    <ul
      className={
        layout === 'mega'
          ? 'grid grid-cols-4 gap-x-6 gap-y-5'
          : 'divide-y divide-line border-y border-line'
      }
    >
      {departments.map((department) => (
        <li key={department.id} className={layout === 'list' ? 'py-3' : ''}>
          <Link
            to={`/market/departamento/${department.id}`}
            onClick={onNavigate}
            className="flex min-h-11 items-center justify-between font-display font-extrabold hover:text-accent"
          >
            {department.label}
            <span className="font-mono text-xs font-normal text-ink-muted">{department.count}</span>
          </Link>
          <ul className="grid gap-0.5">
            {department.brands.slice(0, 4).map((brand) => (
              <li key={brand}>
                <Link
                  to={`/market/departamento/${department.id}?brand=${encodeURIComponent(brand)}`}
                  onClick={onNavigate}
                  className="inline-flex min-h-8 items-center text-ink-muted hover:text-accent hover:underline"
                >
                  {brand}
                </Link>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  )
}

/** Department mega-menu: a panel under the header on desktop, a left drawer on mobile. */
export function MegaMenu() {
  const isDesktop = useMediaQuery('(min-width: 64rem)')
  const [open, setOpen] = useState(false)
  const { departments, isPending } = useDepartments()
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Desktop panel: Escape and outside click close it (the mobile drawer is a native dialog).
  useEffect(() => {
    if (!open || !isDesktop) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    const onPointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open, isDesktop])

  const close = () => {
    setOpen(false)
  }

  return (
    <div ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-haspopup={isDesktop ? undefined : 'dialog'}
        aria-controls={isDesktop ? 'market-mega' : undefined}
        onClick={() => {
          setOpen((o) => !o)
        }}
        className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-control px-2 font-semibold hover:bg-surface"
      >
        <MenuIcon />
        <span className="hidden sm:inline">Departamentos</span>
        <span className="sr-only sm:hidden">Departamentos</span>
        <ChevronIcon direction="down" className="hidden size-4 lg:block" />
      </button>

      {isDesktop ? (
        open ? (
          <div
            id="market-mega"
            className="plaza-drop absolute inset-x-0 top-full z-(--shift-z-overlay) border-b border-line bg-surface-raised shadow-lg"
          >
            <div className="mx-auto max-w-7xl px-gutter py-5">
              {isPending ? (
                <p className="text-ink-muted">Cargando departamentos…</p>
              ) : (
                <DepartmentColumns departments={departments} onNavigate={close} layout="mega" />
              )}
            </div>
          </div>
        ) : null
      ) : (
        <Modal open={open} onClose={close} label="Departamentos" placement="left">
          <div className="flex items-center justify-between border-b border-line px-gutter py-2">
            <h2 className="font-display text-xl font-extrabold">Departamentos</h2>
            <button
              type="button"
              onClick={close}
              aria-label="Cerrar departamentos"
              className="grid size-11 place-items-center"
            >
              <CloseIcon />
            </button>
          </div>
          <nav aria-label="Departamentos" className="px-gutter py-2">
            <DepartmentColumns departments={departments} onNavigate={close} layout="list" />
          </nav>
        </Modal>
      )}
    </div>
  )
}

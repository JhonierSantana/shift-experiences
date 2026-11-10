import { useEffect, useRef, type ReactNode } from 'react'

type Variant = 'sheet' | 'drawer'

interface SheetProps {
  readonly open: boolean
  readonly onClose: () => void
  /** Accessible name. */
  readonly label: string
  /** sheet: bottom on mobile, centered card from md up. drawer: bottom on mobile, right panel from md up. */
  readonly variant?: Variant
  readonly children: ReactNode
}

const variants: Record<Variant, string> = {
  sheet:
    'food-sheet m-0 mt-auto w-full max-w-none max-h-[92dvh] rounded-t-[2rem] md:m-auto md:w-[min(92vw,44rem)] md:rounded-card',
  drawer:
    'food-sheet m-0 mt-auto w-full max-w-none max-h-[92dvh] rounded-t-[2rem] md:mt-0 md:ml-auto md:h-dvh md:max-h-none md:w-[26rem] md:rounded-l-[2rem] md:rounded-tr-none food-sheet-drawer',
}

/**
 * Native <dialog>: focus trap, Escape, inert background and focus restore come from the platform.
 * On mobile it is a bottom sheet with a grab handle; children mount only while open.
 */
export function Sheet({ open, onClose, label, variant = 'sheet', children }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal()
      else dialog.setAttribute('open', '')
    } else if (!open && dialog.open) {
      if (typeof dialog.close === 'function') dialog.close()
      else dialog.removeAttribute('open')
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const { overflow } = document.documentElement.style
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = overflow
    }
  }, [open])

  return (
    // Backdrop clicks land on the dialog element itself; Escape is handled natively (onClose).
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events
    <dialog
      ref={ref}
      aria-label={label}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      className={`${variants[variant]} overflow-hidden bg-surface p-0 text-ink shadow-(--food-shadow) backdrop:bg-ink/55`}
    >
      {open ? (
        <>
          <div
            aria-hidden="true"
            className="mx-auto mt-2.5 h-1.5 w-12 rounded-full bg-line md:hidden"
          />
          {children}
        </>
      ) : null}
    </dialog>
  )
}

import { useEffect, useRef, type ReactNode } from 'react'

type Placement = 'center' | 'right' | 'bottom' | 'full'

interface ModalProps {
  readonly open: boolean
  readonly onClose: () => void
  /** Accessible name (visible headings inside are still recommended). */
  readonly label: string
  readonly placement?: Placement
  readonly children: ReactNode
}

const placements: Record<Placement, string> = {
  center: 'vela-modal-center m-auto w-[min(92vw,44rem)] max-h-[88dvh]',
  right: 'vela-modal-right m-0 ml-auto h-dvh max-h-none w-full max-w-md',
  bottom: 'vela-modal-bottom m-0 mt-auto max-h-[90dvh] w-full max-w-none',
  full: 'vela-modal-center m-0 h-dvh max-h-none w-full max-w-none',
}

/**
 * Native <dialog>: focus trap, Escape, inert background and focus restore come from the platform.
 * Children mount only while open, so closed sheets cost nothing.
 */
export function Modal({ open, onClose, label, placement = 'center', children }: ModalProps) {
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
    // Escape already closes natively, so the click handler needs no key twin.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events
    <dialog
      ref={ref}
      aria-label={label}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      className={`${placements[placement]} overflow-y-auto bg-surface p-0 text-ink backdrop:bg-ink/50`}
    >
      {open ? children : null}
    </dialog>
  )
}

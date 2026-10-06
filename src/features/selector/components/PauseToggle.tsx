interface PauseToggleProps {
  readonly stopped: boolean
  readonly onToggle: () => void
}

/**
 * Small icon button that stops or resumes the spotlight rotation. Content that moves on its own
 * for more than 5 s needs a pause control (WCAG 2.2.2); the label lives in `aria-label`/`title`.
 */
export function PauseToggle({ stopped, onToggle }: PauseToggleProps) {
  const label = stopped ? 'Reanudar animación' : 'Pausar animación'
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      title={label}
      className="grid size-11 place-items-center rounded-full text-ink-muted transition-colors duration-(--shift-duration-base) ease-brand hover:text-ink"
    >
      <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5 fill-current">
        {stopped ? <path d="M4 2.5v11l9-5.5z" /> : <path d="M4 2.5h3v11H4zm5 0h3v11H9z" />}
      </svg>
    </button>
  )
}

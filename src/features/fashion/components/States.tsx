import type { ReactNode } from 'react'
import { isRepositoryError } from '@/core/repositories'
import { buttonOutline, buttonPrimary } from './styles'

export function ProductGridSkeleton({ count = 8 }: { readonly count?: number }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4"
    >
      <span className="sr-only">Cargando piezas…</span>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} aria-hidden="true" className="animate-pulse">
          <div className="aspect-[4/5] bg-surface-raised" />
          <div className="mt-4 h-5 w-3/4 bg-surface-raised" />
          <div className="mt-2 h-3 w-1/3 bg-surface-raised" />
        </div>
      ))}
    </div>
  )
}

interface ErrorStateProps {
  readonly error: unknown
  readonly onRetry?: () => void
  readonly title?: string
}

/** Retryable failures offer "Reintentar"; answers like not-found do not. */
export function ErrorState({
  error,
  onRetry,
  title = 'No pudimos cargar esta sección',
}: ErrorStateProps) {
  const message = isRepositoryError(error)
    ? error.message
    : 'Algo salió mal. Inténtalo de nuevo en un momento.'
  const canRetry = onRetry && (!isRepositoryError(error) || error.retryable)
  return (
    <div role="alert" className="grid justify-items-start gap-5 border-y border-line py-12">
      <h2 className="font-display text-3xl sm:text-4xl">{title}</h2>
      <p className="max-w-prose text-ink-muted">{message}</p>
      {canRetry ? (
        <button type="button" onClick={onRetry} className={buttonPrimary}>
          Reintentar
        </button>
      ) : null}
    </div>
  )
}

interface EmptyStateProps {
  readonly title: string
  readonly children?: ReactNode
  readonly actionLabel?: string
  readonly onAction?: () => void
}

export function EmptyState({ title, children, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="grid justify-items-start gap-5 border-y border-line py-12">
      <h2 className="font-display text-3xl sm:text-4xl">{title}</h2>
      {children ? <div className="max-w-prose text-ink-muted">{children}</div> : null}
      {actionLabel && onAction ? (
        <button type="button" onClick={onAction} className={buttonOutline}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}

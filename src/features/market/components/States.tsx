import type { ReactNode } from 'react'
import { isRepositoryError } from '@/core/repositories'
import { buttonOutline, buttonPrimary } from './styles'

export function ProductGridSkeleton({ count = 8 }: { readonly count?: number }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4"
    >
      <span className="sr-only">Cargando productos…</span>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          aria-hidden="true"
          className="grid animate-pulse gap-2 rounded-card border border-line bg-surface-raised p-3"
        >
          <div className="aspect-square rounded-control bg-surface" />
          <div className="h-3 w-1/3 rounded-control bg-surface" />
          <div className="h-4 w-full rounded-control bg-surface" />
          <div className="h-5 w-1/2 rounded-control bg-surface" />
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
    <div
      role="alert"
      className="grid justify-items-start gap-3 rounded-card border border-line bg-surface-raised p-6"
    >
      <h2 className="font-display text-xl font-extrabold">{title}</h2>
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
    <div className="grid justify-items-start gap-3 rounded-card border border-dashed border-line bg-surface-raised p-6">
      <h2 className="font-display text-xl font-extrabold">{title}</h2>
      {children ? <div className="max-w-prose text-ink-muted">{children}</div> : null}
      {actionLabel && onAction ? (
        <button type="button" onClick={onAction} className={buttonOutline}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}

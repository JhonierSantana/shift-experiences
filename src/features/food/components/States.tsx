import type { ReactNode } from 'react'
import { isRepositoryError } from '@/core/repositories'
import { btnOutline, btnPrimary } from './styles'

export function DishGridSkeleton({ count = 6 }: { readonly count?: number }) {
  return (
    <div role="status" aria-live="polite" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <span className="sr-only">Cargando el menú…</span>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          aria-hidden="true"
          className="flex animate-pulse gap-4 rounded-card bg-surface-raised p-4 sm:grid"
        >
          <div className="size-24 shrink-0 rounded-3xl bg-(--food-cream-deep) sm:aspect-[4/3] sm:size-auto" />
          <div className="grid flex-1 content-center gap-2 sm:content-start">
            <div className="h-5 w-3/4 rounded-full bg-(--food-cream-deep)" />
            <div className="h-3 w-full rounded-full bg-(--food-cream-deep)" />
            <div className="h-4 w-1/3 rounded-full bg-(--food-cream-deep)" />
          </div>
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
  title = 'Se nos quemó algo en la cocina',
}: ErrorStateProps) {
  const message = isRepositoryError(error)
    ? error.message
    : 'Algo salió mal. Inténtalo de nuevo en un momento.'
  const canRetry = onRetry && (!isRepositoryError(error) || error.retryable)
  return (
    <div
      role="alert"
      className="grid justify-items-start gap-4 rounded-card border-2 border-accent bg-surface-raised p-6"
    >
      <h2 className="font-display text-2xl font-extrabold">{title}</h2>
      <p className="max-w-prose text-ink-muted">{message}</p>
      {canRetry ? (
        <button type="button" onClick={onRetry} className={btnPrimary}>
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
    <div className="grid justify-items-start gap-4 rounded-card bg-surface-raised p-6 shadow-(--food-shadow)">
      <h2 className="font-display text-2xl font-extrabold">{title}</h2>
      {children ? <div className="max-w-prose text-ink-muted">{children}</div> : null}
      {actionLabel && onAction ? (
        <button type="button" onClick={onAction} className={btnOutline}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}

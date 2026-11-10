/** Class recipes: pill controls, big radii, springy press feedback (tokens do the theming). */
const btn =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-control px-6 font-semibold transition-[transform,background-color,color] duration-(--shift-duration-fast) ease-brand active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100'

export const btnPrimary = `${btn} bg-accent text-accent-ink hover:bg-(--food-ember-deep)`
export const btnDark = `${btn} bg-ink text-surface hover:bg-(--food-ember-deep)`
export const btnOutline = `${btn} border-2 border-ink text-ink hover:bg-ink hover:text-surface`

/** Round icon button, 44px minimum touch target. */
export const iconBtn =
  'grid size-11 shrink-0 place-items-center rounded-full transition-[transform,background-color] duration-(--shift-duration-fast) ease-brand hover:bg-(--food-cream-deep) active:scale-90'

export const chip =
  'inline-flex min-h-11 shrink-0 items-center gap-2 rounded-control border-2 border-line-strong bg-surface-raised px-4 text-sm font-semibold transition-[transform,background-color,border-color] duration-(--shift-duration-fast) ease-brand hover:border-accent active:scale-95 aria-[current=true]:border-ink aria-[current=true]:bg-ink aria-[current=true]:text-surface aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-surface'

export const inputBase =
  'min-h-12 w-full rounded-2xl border-2 border-ink-muted bg-surface-raised px-4 text-base placeholder:text-ink-muted aria-[invalid=true]:border-accent'

export const eyebrow = 'text-xs font-bold uppercase tracking-wider text-ink-muted'

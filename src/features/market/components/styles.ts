/** Shared class recipes: dense, bordered, fast. Tokens do the theming. */
const buttonBase =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-control px-5 font-semibold transition-colors duration-(--shift-duration-fast) ease-brand disabled:cursor-not-allowed disabled:opacity-50'

export const buttonPrimary = `${buttonBase} bg-accent text-accent-ink hover:bg-ink`
export const buttonPromo = `${buttonBase} bg-(--market-promo) text-ink hover:brightness-95`
export const buttonOutline = `${buttonBase} border border-line-strong bg-surface-raised text-ink hover:border-ink`

export const inputBase =
  'min-h-11 w-full rounded-control border border-line-strong bg-surface-raised px-3 text-base placeholder:text-ink-muted hover:border-ink'

export const stepButton =
  'grid size-11 place-items-center border border-line-strong bg-surface-raised font-mono text-lg transition-colors duration-(--shift-duration-fast) hover:border-ink disabled:cursor-not-allowed disabled:opacity-40'

export const sectionTitle = 'font-display text-xl font-extrabold tracking-tight'

/** Small uppercase mono label. */
export const tag = 'font-mono text-[0.7rem] font-semibold tracking-wide uppercase'

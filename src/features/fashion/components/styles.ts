/** Shared class recipes so the editorial voice stays consistent (tokens do the theming). */
export const eyebrow = 'text-[0.7rem] uppercase tracking-[0.28em]'

const buttonBase =
  'inline-flex min-h-12 items-center justify-center gap-3 px-8 text-[0.7rem] uppercase tracking-[0.28em] transition-colors duration-(--shift-duration-base) ease-brand disabled:cursor-not-allowed disabled:opacity-50'

export const buttonPrimary = `${buttonBase} bg-ink text-surface hover:bg-accent hover:text-accent-ink`
export const buttonOutline = `${buttonBase} border border-ink text-ink hover:bg-ink hover:text-surface`

export const textLink =
  'border-b border-current pb-1 text-[0.7rem] uppercase tracking-[0.28em] transition-colors duration-(--shift-duration-base) ease-brand hover:text-accent'

export const inputBase =
  'w-full border-0 border-b border-ink bg-transparent px-0 py-3 text-base outline-offset-4 placeholder:text-ink-muted'

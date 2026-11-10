import type { LogoProps } from '@/engine'

export function FoodLogo({ className }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ''}`}>
      {/* Ember mark: a flame inside a coin. */}
      <svg viewBox="0 0 32 32" className="size-9" aria-hidden="true" focusable="false">
        <circle cx="16" cy="16" r="16" fill="var(--shift-accent)" />
        <path
          d="M16 7c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-4 2-7 2 1 3 3 3 5 1-2 1-6 1-10Z"
          fill="var(--food-butter)"
        />
      </svg>
      <span className="font-display text-2xl leading-none font-extrabold tracking-tight">
        Brasa <span className="text-accent">&amp;</span> Co.
      </span>
    </span>
  )
}

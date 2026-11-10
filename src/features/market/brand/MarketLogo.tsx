import type { LogoProps } from '@/engine'

export function MarketLogo({ className }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ''}`}>
      {/* Four-tile "square" mark: a plaza seen from above. */}
      <svg viewBox="0 0 24 24" className="size-7" aria-hidden="true" focusable="false">
        <rect x="1" y="1" width="10" height="10" rx="2" fill="var(--shift-accent)" />
        <rect x="13" y="1" width="10" height="10" rx="2" fill="var(--market-promo)" />
        <rect x="1" y="13" width="10" height="10" rx="2" fill="var(--market-promo)" />
        <rect x="13" y="13" width="10" height="10" rx="2" fill="var(--shift-accent)" />
      </svg>
      <span className="font-display text-2xl leading-none font-extrabold tracking-tight lowercase">
        plaza
      </span>
    </span>
  )
}

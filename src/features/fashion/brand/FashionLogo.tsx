import type { LogoProps } from '@/engine'

export function FashionLogo({ className }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-3 ${className ?? ''}`}>
      {/* Sail mark: a single stroke, echoing the "Vela" name. */}
      <svg viewBox="0 0 24 32" className="h-7 w-auto" aria-hidden="true" focusable="false">
        <path
          d="M4 28 L12 3 L20 28 M12 3 V28"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
        />
      </svg>
      <span className="font-display text-2xl leading-none tracking-[0.18em] uppercase">
        Maison <span className="italic normal-case tracking-normal">Vela</span>
      </span>
    </span>
  )
}

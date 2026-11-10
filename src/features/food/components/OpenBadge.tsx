import { Capability } from '@/engine'
import { openStatus } from '../domain/hours'
import { useNow } from '../lib/useNow'

/** Open-now / closed indicator driven by the opening-hours mock. Gated by the openingHours capability. */
export function OpenBadge({ className = '' }: { readonly className?: string }) {
  const status = openStatus(useNow())
  return (
    <Capability name="openingHours">
      <p
        className={`inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 text-sm font-semibold text-ink ${className}`}
      >
        <span
          aria-hidden="true"
          className={`size-2.5 rounded-full ${status.open ? 'bg-(--food-leaf)' : 'bg-accent'}`}
        />
        {status.open
          ? `Abierto · cierra a las ${status.closesAt}`
          : `Cerrado · abrimos ${status.opensTomorrow ? 'mañana ' : ''}a las ${status.opensAt}`}
      </p>
    </Capability>
  )
}

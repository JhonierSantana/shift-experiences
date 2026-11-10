import { useId } from 'react'
import { Capability } from '@/engine'
import { estimateLabel, PICKUP_ADDRESS, type FulfillmentMode } from '../domain/pricing'
import { foodCart } from '../domain'
import { useOrderUi } from '../state/orderUi'
import { BikeIcon, StoreIcon } from './Icons'

const OPTIONS = [
  { mode: 'delivery', label: 'Domicilio', Icon: BikeIcon },
  { mode: 'pickup', label: 'Recoger', Icon: StoreIcon },
] as const satisfies readonly { mode: FulfillmentMode; label: string; Icon: typeof BikeIcon }[]

/** Delivery-vs-pickup segmented control with the delivery estimate. Gated by the fulfillmentMode capability. */
export function FulfillmentToggle({ className = '' }: { readonly className?: string }) {
  const mode = useOrderUi((s) => s.mode)
  const setMode = useOrderUi((s) => s.setMode)
  const lines = foodCart.useCart((s) => s.lines)
  const name = useId()

  return (
    <Capability name="fulfillmentMode">
      <fieldset className={`grid gap-2 ${className}`}>
        <legend className="sr-only">Cómo quieres recibir tu pedido</legend>
        <div className="grid grid-cols-2 gap-1 rounded-full bg-(--food-cream-deep) p-1">
          {OPTIONS.map(({ mode: value, label, Icon }) => (
            <label
              key={value}
              className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full font-semibold transition-[background-color,transform] duration-(--shift-duration-fast) ease-brand has-[:checked]:bg-ink has-[:checked]:text-surface has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-(--shift-focus)"
            >
              <input
                type="radio"
                name={name}
                value={value}
                checked={mode === value}
                onChange={() => {
                  setMode(value)
                }}
                className="sr-only"
              />
              <Icon />
              {label}
            </label>
          ))}
        </div>
        <p className="text-sm text-ink-muted" aria-live="polite">
          {estimateLabel(mode, lines)}
          {mode === 'pickup' ? ` · ${PICKUP_ADDRESS}` : ''}
        </p>
      </fieldset>
    </Capability>
  )
}

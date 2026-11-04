import { MinusIcon, PlusIcon } from './Icons'

interface QuantityStepperProps {
  readonly value: number
  readonly min: number
  readonly max: number
  /** Dish name, used in the accessible button labels. */
  readonly label: string
  readonly onChange: (value: number) => void
}

const stepBtn =
  'grid size-11 place-items-center rounded-full bg-surface-raised text-ink transition-[transform,background-color] duration-(--shift-duration-fast) ease-brand hover:bg-(--food-butter) active:scale-90 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100'

export function QuantityStepper({ value, min, max, label, onChange }: QuantityStepperProps) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border-2 border-line-strong bg-(--food-cream-deep) p-0.5">
      <button
        type="button"
        aria-label={`Quitar una unidad de ${label}`}
        disabled={value <= min}
        onClick={() => {
          onChange(value - 1)
        }}
        className={stepBtn}
      >
        <MinusIcon />
      </button>
      <span
        aria-live="polite"
        aria-label={`Cantidad: ${String(value)}`}
        className="min-w-8 text-center font-bold tabular-nums"
      >
        {value}
      </span>
      <button
        type="button"
        aria-label={`Añadir una unidad de ${label}`}
        disabled={value >= max}
        onClick={() => {
          onChange(value + 1)
        }}
        className={stepBtn}
      >
        <PlusIcon />
      </button>
    </div>
  )
}

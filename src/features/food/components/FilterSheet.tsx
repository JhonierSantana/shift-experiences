import { useState } from 'react'
import {
  ALLERGENS,
  ALLERGEN_LABELS,
  DIETS,
  SPICE_LABELS,
  clearSheetFilters,
  type MenuFilters,
} from '../domain/menuFilters'
import { CloseIcon } from './Icons'
import { Sheet } from './Sheet'
import { btnOutline, btnPrimary, chip, eyebrow, iconBtn } from './styles'

interface FilterSheetProps {
  readonly open: boolean
  readonly filters: MenuFilters
  readonly onApply: (next: MenuFilters) => void
  readonly onClose: () => void
}

const SPICES = [0, 1, 2] as const

function Body({ filters, onApply, onClose }: Omit<FilterSheetProps, 'open'>) {
  // The draft lives only while the sheet is open; Apply commits it to the URL.
  const [draft, setDraft] = useState(filters)
  const toggleAllergen = (allergen: (typeof ALLERGENS)[number]) => {
    setDraft((d) => ({
      ...d,
      excludeAllergens: d.excludeAllergens.includes(allergen)
        ? d.excludeAllergens.filter((a) => a !== allergen)
        : [...d.excludeAllergens, allergen],
    }))
  }
  return (
    <div className="flex max-h-[calc(92dvh-1.5rem)] flex-col md:max-h-[88dvh]">
      <div className="flex items-center justify-between px-gutter pt-3 pb-2">
        <h2 className="font-display text-2xl font-extrabold">Filtros</h2>
        <button type="button" onClick={onClose} aria-label="Cerrar filtros" className={iconBtn}>
          <CloseIcon />
        </button>
      </div>
      <div className="grid min-h-0 flex-1 gap-6 overflow-y-auto overscroll-contain px-gutter py-3">
        <fieldset className="grid gap-2">
          <legend className={`${eyebrow} mb-1`}>Sin alérgenos</legend>
          <div className="flex flex-wrap gap-2">
            {ALLERGENS.map((allergen) => (
              <button
                key={allergen}
                type="button"
                aria-pressed={draft.excludeAllergens.includes(allergen)}
                onClick={() => {
                  toggleAllergen(allergen)
                }}
                className={chip}
              >
                {ALLERGEN_LABELS[allergen]}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="grid gap-2">
          <legend className={`${eyebrow} mb-1`}>Dieta</legend>
          <div className="flex flex-wrap gap-2">
            {DIETS.map((diet) => (
              <button
                key={diet}
                type="button"
                aria-pressed={draft.diet === diet}
                onClick={() => {
                  setDraft((d) => {
                    const { diet: current, ...rest } = d
                    return current === diet ? rest : { ...rest, diet }
                  })
                }}
                className={chip}
              >
                {diet}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="grid gap-2">
          <legend className={`${eyebrow} mb-1`}>Nivel de picante</legend>
          <div className="flex flex-wrap gap-2">
            {SPICES.map((level) => (
              <button
                key={level}
                type="button"
                aria-pressed={draft.maxSpice === level}
                onClick={() => {
                  setDraft((d) => {
                    const { maxSpice, ...rest } = d
                    return maxSpice === level ? rest : { ...rest, maxSpice: level }
                  })
                }}
                className={chip}
              >
                {level === 0 ? SPICE_LABELS[0] : `Hasta ${SPICE_LABELS[level].toLowerCase()}`}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="flex min-h-11 cursor-pointer items-center gap-3 font-semibold">
          <input
            type="checkbox"
            checked={draft.availableOnly}
            onChange={(event) => {
              setDraft((d) => ({ ...d, availableOnly: event.target.checked }))
            }}
            className="size-5 accent-(--food-leaf)"
          />
          Ocultar platos agotados
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3 border-t border-line bg-surface-raised px-gutter py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          className={btnOutline}
          onClick={() => {
            setDraft(clearSheetFilters(draft))
          }}
        >
          Limpiar
        </button>
        <button
          type="button"
          className={btnPrimary}
          onClick={() => {
            onApply(draft)
            onClose()
          }}
        >
          Aplicar
        </button>
      </div>
    </div>
  )
}

export function FilterSheet({ open, ...rest }: FilterSheetProps) {
  return (
    <Sheet open={open} onClose={rest.onClose} label="Filtrar el menú">
      <Body {...rest} />
    </Sheet>
  )
}

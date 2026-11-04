import { useState } from 'react'
import {
  DISCOUNT_STEPS,
  RATING_STEPS,
  type ListingFacets,
  type ListingState,
} from '../domain/catalogFilters'
import { specFacetsFor } from '../domain/specFacets'
import { inputBase } from './styles'

interface FilterPanelProps {
  readonly state: ListingState
  readonly onChange: (next: ListingState) => void
  readonly facets: ListingFacets
  readonly departmentId: string | undefined
  /** Unique per instance: the sidebar and the mobile drawer never share ids. */
  readonly idPrefix: string
}

const legend = 'mb-1.5 font-display text-sm font-extrabold'
const row =
  'flex min-h-11 cursor-pointer items-center gap-2.5 rounded-control px-1.5 hover:bg-surface has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-(--shift-focus)'
const check = 'size-4 shrink-0 accent-(--shift-accent)'

function toggle<T>(list: readonly T[], item: T): T[] {
  return list.includes(item) ? list.filter((i) => i !== item) : [...list, item]
}

function parsePeso(raw: string): number | undefined {
  const digits = raw.replace(/\D/g, '')
  const n = Number(digits)
  return digits && n > 0 ? n : undefined
}

function PriceRange({
  state,
  onChange,
  idPrefix,
  range,
}: Pick<FilterPanelProps, 'state' | 'onChange' | 'idPrefix'> & {
  readonly range: ListingFacets['priceRange']
}) {
  // Typing is local; the range commits on blur/Enter so the list does not refetch per keystroke.
  const [draft, setDraft] = useState({
    min: state.minPrice === undefined ? '' : String(state.minPrice),
    max: state.maxPrice === undefined ? '' : String(state.maxPrice),
  })
  const commit = () => {
    const minPrice = parsePeso(draft.min)
    const maxPrice = parsePeso(draft.max)
    if (minPrice !== state.minPrice || maxPrice !== state.maxPrice) {
      onChange({ ...state, minPrice, maxPrice })
    }
  }
  const field = (name: 'min' | 'max', label: string, placeholder: string) => (
    <div className="grid gap-0.5">
      <label htmlFor={`${idPrefix}-${name}`} className="text-xs text-ink-muted">
        {label}
      </label>
      <input
        id={`${idPrefix}-${name}`}
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder}
        value={draft[name]}
        onChange={(event) => {
          setDraft({ ...draft, [name]: event.target.value })
        }}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            commit()
          }
        }}
        className={`${inputBase} font-mono`}
      />
    </div>
  )
  return (
    <fieldset>
      <legend className={legend}>Precio (COP)</legend>
      <div className="grid grid-cols-2 gap-2">
        {field('min', 'Mínimo', range ? String(range.min) : '0')}
        {field('max', 'Máximo', range ? String(range.max) : '')}
      </div>
    </fieldset>
  )
}

/** Faceted filters. Desktop applies each change live; the mobile drawer edits a draft and applies once. */
export function FilterPanel({ state, onChange, facets, departmentId, idPrefix }: FilterPanelProps) {
  const specFacets = specFacetsFor(departmentId)
  return (
    <div className="grid gap-5">
      {facets.brands.length > 1 ? (
        <fieldset>
          <legend className={legend}>Marca</legend>
          <ul>
            {facets.brands.map((brand) => (
              <li key={brand.name}>
                <label className={row}>
                  <input
                    type="checkbox"
                    className={check}
                    checked={state.brands.includes(brand.name)}
                    onChange={() => {
                      onChange({ ...state, brands: toggle(state.brands, brand.name) })
                    }}
                  />
                  <span className="flex-1">{brand.name}</span>
                  <span className="font-mono text-xs text-ink-muted">{brand.count}</span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      ) : null}

      {/* The key remounts the local draft when the URL changes the range from outside (chip, clear). */}
      <PriceRange
        key={`${String(state.minPrice)}-${String(state.maxPrice)}`}
        state={state}
        onChange={onChange}
        idPrefix={idPrefix}
        range={facets.priceRange}
      />

      <fieldset>
        <legend className={legend}>Calificación</legend>
        <ul>
          {RATING_STEPS.map((stars) => (
            <li key={stars}>
              <label className={row}>
                <input
                  type="radio"
                  name={`${idPrefix}-rating`}
                  className={check}
                  checked={state.minRating === stars}
                  onChange={() => {
                    onChange({ ...state, minRating: stars })
                  }}
                />
                <span aria-hidden="true" className="text-(--market-star)">
                  {'★'.repeat(stars)}
                </span>
                <span>{stars} estrellas o más</span>
              </label>
            </li>
          ))}
          <li>
            <label className={row}>
              <input
                type="radio"
                name={`${idPrefix}-rating`}
                className={check}
                checked={state.minRating === undefined}
                onChange={() => {
                  onChange({ ...state, minRating: undefined })
                }}
              />
              <span>Todas</span>
            </label>
          </li>
        </ul>
      </fieldset>

      <fieldset>
        <legend className={legend}>Descuento</legend>
        <ul>
          {DISCOUNT_STEPS.map((percent) => (
            <li key={percent}>
              <label className={row}>
                <input
                  type="radio"
                  name={`${idPrefix}-discount`}
                  className={check}
                  checked={state.minDiscount === percent}
                  onChange={() => {
                    onChange({ ...state, minDiscount: percent })
                  }}
                />
                <span>{percent} % o más</span>
              </label>
            </li>
          ))}
          <li>
            <label className={row}>
              <input
                type="radio"
                name={`${idPrefix}-discount`}
                className={check}
                checked={state.minDiscount === undefined}
                onChange={() => {
                  onChange({ ...state, minDiscount: undefined })
                }}
              />
              <span>Cualquiera</span>
            </label>
          </li>
        </ul>
      </fieldset>

      <fieldset>
        <legend className={legend}>Disponibilidad y envío</legend>
        <ul>
          <li>
            <label className={row}>
              <input
                type="checkbox"
                className={check}
                checked={state.inStockOnly}
                onChange={() => {
                  onChange({ ...state, inStockOnly: !state.inStockOnly })
                }}
              />
              Solo disponibles
            </label>
          </li>
          <li>
            <label className={row}>
              <input
                type="checkbox"
                className={check}
                checked={state.onSale}
                onChange={() => {
                  onChange({ ...state, onSale: !state.onSale })
                }}
              />
              En oferta
            </label>
          </li>
          <li>
            <label className={row}>
              <input
                type="checkbox"
                className={check}
                checked={state.freeShipping}
                onChange={() => {
                  onChange({ ...state, freeShipping: !state.freeShipping })
                }}
              />
              Envío gratis
            </label>
          </li>
        </ul>
      </fieldset>

      {specFacets.map((facet) => (
        <fieldset key={facet.id}>
          <legend className={legend}>{facet.label}</legend>
          <ul>
            {facet.options.map((option) => {
              const id = `${facet.id}.${option.id}`
              return (
                <li key={id}>
                  <label className={row}>
                    <input
                      type="checkbox"
                      className={check}
                      checked={state.specs.includes(id)}
                      onChange={() => {
                        onChange({ ...state, specs: toggle(state.specs, id) })
                      }}
                    />
                    {option.label}
                  </label>
                </li>
              )
            })}
          </ul>
        </fieldset>
      ))}
    </div>
  )
}

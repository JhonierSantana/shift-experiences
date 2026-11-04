import type { FashionCollection, FashionColor } from '@/core/domain'
import { PRICE_BANDS, toggleIn, withFilters, type CatalogFilters } from '../domain/catalogFilters'
import { eyebrow } from './styles'

interface FilterPanelProps {
  readonly filters: CatalogFilters
  readonly onChange: (next: CatalogFilters) => void
  readonly collections: readonly FashionCollection[]
  readonly sizes: readonly string[]
  readonly colors: readonly FashionColor[]
  /** Unique per instance so labels never collide if two panels exist. */
  readonly idPrefix: string
}

const chip =
  'grid min-h-11 min-w-11 place-items-center border border-line px-3 text-sm transition-colors duration-(--shift-duration-base) ease-brand peer-checked:border-ink peer-checked:bg-ink peer-checked:text-surface peer-focus-visible:outline-3 peer-focus-visible:outline-offset-4 hover:border-ink'

const row =
  'flex min-h-11 cursor-pointer items-center gap-3 py-1 text-[0.95rem] has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2'

/** Filters as native fieldsets: the same panel serves the desktop sidebar (live) and the mobile sheet (draft + Apply). */
export function FilterPanel({
  filters,
  onChange,
  collections,
  sizes,
  colors,
  idPrefix,
}: FilterPanelProps) {
  return (
    <div className="grid gap-9">
      <fieldset>
        <legend className={`${eyebrow} mb-3`}>Colección</legend>
        <label className={row}>
          <input
            type="radio"
            name={`${idPrefix}-coleccion`}
            checked={filters.collectionId === undefined}
            onChange={() => {
              onChange(withFilters(filters, { collectionId: undefined }))
            }}
            className="size-4 accent-ink"
          />
          Todas
        </label>
        {collections.map((collection) => (
          <label key={collection.id} className={row}>
            <input
              type="radio"
              name={`${idPrefix}-coleccion`}
              checked={filters.collectionId === collection.id}
              onChange={() => {
                onChange(withFilters(filters, { collectionId: collection.id }))
              }}
              className="size-4 accent-ink"
            />
            {collection.name}
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend className={`${eyebrow} mb-3`}>Talla</legend>
        <div className="flex flex-wrap gap-2">
          {sizes.map((size) => (
            <label key={size} className="relative">
              <input
                type="checkbox"
                checked={filters.sizes.includes(size)}
                onChange={() => {
                  onChange(withFilters(filters, { sizes: toggleIn(filters.sizes, size) }))
                }}
                className="peer sr-only"
              />
              <span className={chip}>{size}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className={`${eyebrow} mb-3`}>Color</legend>
        {colors.map((color) => (
          <label key={color.id} className={row}>
            <input
              type="checkbox"
              checked={filters.colorIds.includes(color.id)}
              onChange={() => {
                onChange(withFilters(filters, { colorIds: toggleIn(filters.colorIds, color.id) }))
              }}
              className="size-4 accent-ink"
            />
            <span
              aria-hidden="true"
              className="size-4 rounded-full border border-line"
              style={{ backgroundColor: color.swatch }}
            />
            {color.name}
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend className={`${eyebrow} mb-3`}>Precio</legend>
        <label className={row}>
          <input
            type="radio"
            name={`${idPrefix}-precio`}
            checked={filters.priceBandId === undefined}
            onChange={() => {
              onChange(withFilters(filters, { priceBandId: undefined }))
            }}
            className="size-4 accent-ink"
          />
          Cualquier precio
        </label>
        {PRICE_BANDS.map((band) => (
          <label key={band.id} className={row}>
            <input
              type="radio"
              name={`${idPrefix}-precio`}
              checked={filters.priceBandId === band.id}
              onChange={() => {
                onChange(withFilters(filters, { priceBandId: band.id }))
              }}
              className="size-4 accent-ink"
            />
            {band.label}
          </label>
        ))}
      </fieldset>
    </div>
  )
}

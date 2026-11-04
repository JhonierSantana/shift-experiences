import type { Allergen, Category, FoodItem } from '@/core/domain'
import type { FoodFilters, ProductQuery } from '@/core/repositories'

export const ALLERGEN_LABELS: Record<Allergen, string> = {
  gluten: 'Gluten',
  dairy: 'Lácteos',
  egg: 'Huevo',
  nuts: 'Frutos secos',
  peanuts: 'Maní',
  soy: 'Soya',
  fish: 'Pescado',
  shellfish: 'Mariscos',
  sesame: 'Ajonjolí',
  mustard: 'Mostaza',
  celery: 'Apio',
  sulphites: 'Sulfitos',
}

export const ALLERGENS = Object.keys(ALLERGEN_LABELS) as Allergen[]

export const DIETS = ['vegano', 'vegetariano', 'sin gluten'] as const
export type Diet = (typeof DIETS)[number]

export const SPICE_LABELS = [
  'Sin picante',
  'Picante suave',
  'Picante medio',
  'Muy picante',
] as const
type Spice = 0 | 1 | 2 | 3

export interface MenuFilters {
  readonly categoryId?: string
  readonly search: string
  readonly excludeAllergens: readonly Allergen[]
  readonly diet?: Diet
  readonly maxSpice?: Spice
  readonly availableOnly: boolean
}

export const EMPTY_FILTERS: MenuFilters = { search: '', excludeAllergens: [], availableOnly: false }

const isAllergen = (value: string): value is Allergen => Object.hasOwn(ALLERGEN_LABELS, value)
const isDiet = (value: string | null): value is Diet => DIETS.some((d) => d === value)
const asSpice = (value: string | null): Spice | undefined =>
  value === '0' ? 0 : value === '1' ? 1 : value === '2' ? 2 : undefined

/** The URL is the source of truth so filtered menus are shareable and back/forward work. */
export function parseFilters(params: URLSearchParams): MenuFilters {
  const category = params.get('cat')
  const diet = params.get('dieta')
  const maxSpice = asSpice(params.get('picante'))
  return {
    ...(category ? { categoryId: category } : {}),
    search: params.get('q')?.trim() ?? '',
    excludeAllergens: [...new Set(params.getAll('sin').filter(isAllergen))],
    ...(isDiet(diet) ? { diet } : {}),
    ...(maxSpice === undefined ? {} : { maxSpice }),
    availableOnly: params.get('disp') === '1',
  }
}

export function serializeFilters(filters: MenuFilters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.categoryId) params.set('cat', filters.categoryId)
  if (filters.search) params.set('q', filters.search)
  for (const allergen of filters.excludeAllergens) params.append('sin', allergen)
  if (filters.diet) params.set('dieta', filters.diet)
  if (filters.maxSpice !== undefined) params.set('picante', String(filters.maxSpice))
  if (filters.availableOnly) params.set('disp', '1')
  return params
}

export function toProductQuery(filters: MenuFilters): ProductQuery<FoodFilters> {
  const facets: FoodFilters = {
    ...(filters.excludeAllergens.length ? { excludeAllergens: filters.excludeAllergens } : {}),
    ...(filters.maxSpice === undefined ? {} : { maxSpiceLevel: filters.maxSpice }),
    ...(filters.availableOnly ? { availableOnly: true } : {}),
  }
  return {
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.search ? { search: filters.search } : {}),
    ...(filters.diet ? { tag: filters.diet } : {}),
    pageSize: 60,
    filters: facets,
  }
}

export interface FilterChip {
  readonly key: string
  readonly label: string
  readonly without: MenuFilters
}

/** Filters set from the sheet (category and search have their own controls). */
export function activeChips(filters: MenuFilters): FilterChip[] {
  const chips: FilterChip[] = []
  for (const allergen of filters.excludeAllergens) {
    chips.push({
      key: `sin:${allergen}`,
      label: `Sin ${ALLERGEN_LABELS[allergen].toLowerCase()}`,
      without: {
        ...filters,
        excludeAllergens: filters.excludeAllergens.filter((a) => a !== allergen),
      },
    })
  }
  if (filters.diet) {
    const { diet, ...rest } = filters
    chips.push({ key: 'dieta', label: diet, without: rest })
  }
  if (filters.maxSpice !== undefined) {
    const { maxSpice, ...rest } = filters
    chips.push({ key: 'picante', label: SPICE_LABELS[maxSpice], without: rest })
  }
  if (filters.availableOnly) {
    chips.push({
      key: 'disp',
      label: 'Solo disponibles',
      without: { ...filters, availableOnly: false },
    })
  }
  return chips
}

/** Keeps category and search, drops the sheet filters. */
export function clearSheetFilters(filters: MenuFilters): MenuFilters {
  return {
    ...EMPTY_FILTERS,
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    search: filters.search,
  }
}

/** Items grouped in the order the categories are listed; empty categories are dropped. */
export function groupByCategory(
  items: readonly FoodItem[],
  categories: readonly Category[],
): { readonly category: Category; readonly items: readonly FoodItem[] }[] {
  return categories
    .map((category) => ({ category, items: items.filter((i) => i.categoryId === category.id) }))
    .filter((group) => group.items.length > 0)
}

/** Selects a category (or all of them when `categoryId` is undefined), keeping the other filters. */
export function withCategory(filters: MenuFilters, categoryId: string | undefined): MenuFilters {
  return {
    search: filters.search,
    excludeAllergens: filters.excludeAllergens,
    ...(filters.diet ? { diet: filters.diet } : {}),
    ...(filters.maxSpice === undefined ? {} : { maxSpice: filters.maxSpice }),
    availableOnly: filters.availableOnly,
    ...(categoryId ? { categoryId } : {}),
  }
}

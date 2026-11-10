import { categories, products } from '../data/catalog'
import {
  activeChips,
  clearSheetFilters,
  groupByCategory,
  parseFilters,
  serializeFilters,
  toProductQuery,
  withCategory,
} from './menuFilters'

const parse = (query: string) => parseFilters(new URLSearchParams(query))

describe('menu filters (URL is the source of truth)', () => {
  it('round-trips through the URL', () => {
    const filters = parse('cat=bowls&q=quinoa&sin=dairy&sin=gluten&dieta=vegano&picante=1&disp=1')
    expect(filters).toEqual({
      categoryId: 'bowls',
      search: 'quinoa',
      excludeAllergens: ['dairy', 'gluten'],
      diet: 'vegano',
      maxSpice: 1,
      availableOnly: true,
    })
    expect(parseFilters(serializeFilters(filters))).toEqual(filters)
  })

  it('drops unknown allergens, diets and spice levels instead of trusting the URL', () => {
    expect(parse('sin=lava&sin=egg&dieta=carnivoro&picante=9')).toEqual({
      search: '',
      excludeAllergens: ['egg'],
      availableOnly: false,
    })
  })

  it('maps to the repository query with only what is set', () => {
    expect(toProductQuery(parse(''))).toEqual({ pageSize: 60, filters: {} })
    expect(toProductQuery(parse('cat=postres&sin=nuts&picante=0&dieta=vegano&q=choc'))).toEqual({
      categoryId: 'postres',
      search: 'choc',
      tag: 'vegano',
      pageSize: 60,
      filters: { excludeAllergens: ['nuts'], maxSpiceLevel: 0 },
    })
  })

  it('builds removable chips and clears only the sheet filters', () => {
    const filters = parse('cat=bowls&q=a&sin=soy&dieta=vegano&picante=2&disp=1')
    const chips = activeChips(filters)
    expect(chips.map((c) => c.label)).toEqual([
      'Sin soya',
      'vegano',
      'Picante medio',
      'Solo disponibles',
    ])
    expect(chips[1]?.without.diet).toBeUndefined()
    expect(chips[0]?.without.excludeAllergens).toEqual([])
    expect(clearSheetFilters(filters)).toEqual({
      categoryId: 'bowls',
      search: 'a',
      excludeAllergens: [],
      availableOnly: false,
    })
    expect(withCategory(filters, undefined).categoryId).toBeUndefined()
  })

  it('groups dishes in category order and skips empty categories', () => {
    const groups = groupByCategory(products, categories)
    expect(groups.map((g) => g.category.id)).toEqual(categories.map((c) => c.id))
    expect(
      groupByCategory(
        products.filter((p) => p.categoryId === 'postres'),
        categories,
      ),
    ).toHaveLength(1)
  })
})

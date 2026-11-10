import { money, type CartLineOf, type FoodItem, type FoodSelection } from '@/core/domain'
import { categories, products } from '../data/catalog'
import { foodRules, matchesFoodFilters, selectionAllergens } from './rules'

function byId(id: string): FoodItem {
  const item = products.find((p) => p.id === id)
  if (!item) throw new Error(`fixture ${id} missing`)
  return item
}

const choice = (groupId: string, optionId: string) => ({ groupId, optionId })

function line(
  product: FoodItem,
  selection: Omit<FoodSelection, 'kind'>,
  quantity = 1,
): CartLineOf<'food'> {
  return {
    id: 'l',
    product,
    selection: { kind: 'food', ...selection },
    quantity,
    addedAt: '2026-09-24',
  }
}

describe('food catalog integrity', () => {
  it('has a coherent, sizeable menu', () => {
    expect(products.length).toBeGreaterThanOrEqual(20)
    expect(products.length).toBeLessThanOrEqual(30)
    expect(new Set(products.map((p) => p.id)).size).toBe(products.length)
    for (const item of products) {
      expect(categories.some((c) => c.id === item.categoryId)).toBe(true)
      for (const group of item.optionGroups) {
        expect(group.min).toBeLessThanOrEqual(group.max)
        expect(group.max).toBeLessThanOrEqual(group.options.length)
      }
    }
  })
})

describe('food rules', () => {
  const burger = byId('bc-hamburguesa-brasa')

  it('adds option deltas to the unit price', () => {
    const selection = {
      options: [
        choice('termino', 'medio'),
        choice('pan', 'brioche'),
        choice('extras', 'queso'),
        choice('extras', 'tocineta'),
      ],
    }
    // 34.900 + 4.000 + 5.500
    expect(foodRules.priceLine(line(burger, selection, 2))).toEqual({
      unit: money(44_400, 'COP'),
      total: money(88_800, 'COP'),
    })
  })

  it('normalizes choices so equivalent selections are identical', () => {
    const a = foodRules.validateSelection(
      burger,
      {
        kind: 'food',
        options: [choice('extras', 'huevo'), choice('pan', 'brioche'), choice('termino', 'medio')],
        note: '  sin cebolla ',
      },
      1,
    )
    const b = foodRules.validateSelection(
      burger,
      {
        kind: 'food',
        options: [
          choice('termino', 'medio'),
          choice('pan', 'brioche'),
          choice('extras', 'huevo'),
          choice('extras', 'huevo'),
        ],
        note: 'sin cebolla',
      },
      1,
    )
    expect(a).toEqual(b)
    expect(a).toMatchObject({
      ok: true,
      selection: {
        note: 'sin cebolla',
        options: [{ groupId: 'termino' }, { groupId: 'pan' }, { groupId: 'extras' }],
      },
    })
  })

  it('enforces required groups, limits, known options and availability', () => {
    const check = (item: FoodItem, options: FoodSelection['options']) =>
      foodRules.validateSelection(item, { kind: 'food', options }, 1)

    expect(check(burger, [choice('pan', 'brioche')])).toMatchObject({
      ok: false,
      issues: [{ code: 'option-count', message: 'Elige 1 opción en «Término de la carne».' }],
    })
    expect(
      check(burger, [
        choice('termino', 'medio'),
        choice('pan', 'brioche'),
        choice('extras', 'queso'),
        choice('extras', 'tocineta'),
        choice('extras', 'aguacate'),
        choice('extras', 'huevo'),
      ]),
    ).toMatchObject({ ok: false, issues: [{ code: 'option-count' }] })
    expect(check(burger, [choice('termino', 'crudo')])).toMatchObject({
      ok: false,
      issues: expect.arrayContaining([
        expect.objectContaining({ code: 'unknown-option' }),
      ]) as unknown,
    })
    expect(check(byId('bc-pesca-dia'), [choice('acompanante', 'papas')])).toMatchObject({
      ok: false,
      issues: [{ code: 'unavailable' }],
    })
  })

  it('describes choices per group and the kitchen note', () => {
    const d = foodRules.describeLine(
      line(burger, {
        options: [
          choice('termino', 'tres-cuartos'),
          choice('pan', 'masa-madre'),
          choice('extras', 'aguacate'),
        ],
        note: 'bien tostado',
      }),
    )
    expect(d.details).toEqual([
      'Término de la carne: Tres cuartos',
      'Pan: Masa madre',
      'Extras: Aguacate',
      'Nota: «bien tostado»',
    ])
  })

  it('merges option allergens and filters by allergen', () => {
    const juice = byId('bc-jugo-lulo')
    expect(
      selectionAllergens(juice, { kind: 'food', options: [choice('preparacion', 'leche')] }),
    ).toEqual(['dairy'])
    expect(matchesFoodFilters(burger, { excludeAllergens: ['dairy'] })).toBe(false)
    expect(matchesFoodFilters(juice, { excludeAllergens: ['dairy'] })).toBe(true)
  })
})

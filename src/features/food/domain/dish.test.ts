import { money, type FoodItem } from '@/core/domain'
import { products } from '../data/catalog'
import {
  canQuickAdd,
  checkSelection,
  groupState,
  picksToSelection,
  previewTotal,
  selectionToPicks,
  togglePick,
} from './dish'

function byId(id: string): FoodItem {
  const item = products.find((p) => p.id === id)
  if (!item) throw new Error(`fixture ${id} missing`)
  return item
}

const burger = byId('bc-hamburguesa-brasa')
const group = (id: string) => {
  const found = burger.optionGroups.find((g) => g.id === id)
  if (!found) throw new Error(`group ${id} missing`)
  return found
}

describe('dish option picks', () => {
  it('replaces in single-choice groups and toggles in multi-choice groups', () => {
    const pan = group('pan')
    let picks = togglePick(pan, {}, 'brioche')
    picks = togglePick(pan, picks, 'masa-madre')
    expect(picks.pan).toEqual(['masa-madre'])

    const extras = group('extras')
    picks = togglePick(extras, picks, 'queso')
    picks = togglePick(extras, picks, 'huevo')
    picks = togglePick(extras, picks, 'queso')
    expect(picks.extras).toEqual(['huevo'])
  })

  it('never exceeds the group maximum', () => {
    const extras = group('extras')
    let picks = {}
    for (const id of ['queso', 'tocineta', 'aguacate', 'huevo'])
      picks = togglePick(extras, picks, id)
    expect(picks).toEqual({ extras: ['queso', 'tocineta', 'aguacate'] })
  })

  it('classifies groups against min and max', () => {
    expect(groupState(group('pan'), 0)).toBe('missing')
    expect(groupState(group('pan'), 1)).toBe('ok')
    expect(groupState(group('extras'), 0)).toBe('ok')
    expect(groupState(group('extras'), 4)).toBe('too-many')
  })

  it('converts picks to a selection and back', () => {
    const picks = { termino: ['medio'], pan: ['brioche'], extras: ['queso'] }
    const selection = picksToSelection(burger, picks, '  sin cebolla ')
    expect(selection.note).toBe('sin cebolla')
    expect(selectionToPicks(selection)).toEqual(picks)
  })
})

describe('dish price and validation', () => {
  it('live total is (price + option deltas) x quantity', () => {
    const selection = picksToSelection(
      burger,
      { termino: ['medio'], pan: ['brioche'], extras: ['queso', 'tocineta'] },
      '',
    )
    // (34.900 + 4.000 + 5.500) x 3
    expect(previewTotal(burger, selection, 3)).toEqual(money(133_200, 'COP'))
  })

  it('reports each unmet required group through the adapter', () => {
    const issues = checkSelection(burger, picksToSelection(burger, {}, ''), 1)
    expect(issues.map((i) => i.message)).toEqual([
      'Elige 1 opción en «Término de la carne».',
      'Elige 1 opción en «Pan».',
    ])
  })

  it('quick add only for available dishes with nothing required', () => {
    expect(canQuickAdd(burger)).toBe(false)
    expect(canQuickAdd(byId('bc-pesca-dia'))).toBe(false) // sold out
    const quick = products.find((p) => p.available && p.optionGroups.every((g) => g.min === 0))
    if (!quick) throw new Error('fixture missing')
    expect(canQuickAdd(quick)).toBe(true)
  })
})

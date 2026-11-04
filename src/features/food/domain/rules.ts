import {
  add,
  multiply,
  type Allergen,
  type DomainAdapter,
  type FoodItem,
  type FoodOptionChoice,
  type FoodSelection,
  type SelectionIssue,
} from '@/core/domain'
import type { FoodFilters } from '@/core/repositories'

type Rules = Omit<DomainAdapter<'food'>, 'repositories'>

export const MAX_NOTE_LENGTH = 140

function chosenOptions(item: FoodItem, selection: FoodSelection) {
  return selection.options.flatMap(({ groupId, optionId }) => {
    const group = item.optionGroups.find((g) => g.id === groupId)
    const option = group?.options.find((o) => o.id === optionId)
    return group && option ? [{ group, option }] : []
  })
}

/** Allergens of the dish plus those added by the chosen options. */
export function selectionAllergens(item: FoodItem, selection: FoodSelection): readonly Allergen[] {
  const extra = chosenOptions(item, selection).flatMap(({ option }) => option.allergens ?? [])
  return [...new Set([...item.allergens, ...extra])]
}

function countLabel(min: number, max: number, group: string): string {
  if (min === max) return `Elige ${String(min)} ${min === 1 ? 'opción' : 'opciones'} en «${group}».`
  if (min === 0) return `Puedes elegir hasta ${String(max)} en «${group}».`
  return `Elige entre ${String(min)} y ${String(max)} en «${group}».`
}

export const foodRules: Rules = {
  kind: 'food',
  currency: 'COP',

  priceLine({ product, selection, quantity }) {
    const unit = chosenOptions(product, selection).reduce(
      (price, { option }) => add(price, option.priceDelta),
      product.price,
    )
    return { unit, total: multiply(unit, quantity) }
  },

  describeLine({ product, selection }) {
    const details = product.optionGroups.flatMap((group) => {
      const labels = chosenOptions(product, selection)
        .filter((choice) => choice.group.id === group.id)
        .map((choice) => choice.option.label)
      return labels.length > 0 ? [`${group.label}: ${labels.join(', ')}`] : []
    })
    if (selection.note) details.push(`Nota: «${selection.note}»`)
    return { title: product.title, details }
  },

  validateSelection(product, selection, quantity) {
    if (!product.available) {
      return {
        ok: false,
        issues: [{ code: 'unavailable', message: 'Este plato no está disponible hoy.' }],
      }
    }
    const issues: SelectionIssue[] = []
    const seen = new Set<string>()
    const normalized: { choice: FoodOptionChoice; order: number }[] = []

    for (const choice of selection.options) {
      const groupIndex = product.optionGroups.findIndex((g) => g.id === choice.groupId)
      const group = product.optionGroups[groupIndex]
      const optionIndex = group ? group.options.findIndex((o) => o.id === choice.optionId) : -1
      const key = `${choice.groupId}/${choice.optionId}`
      if (!group || optionIndex < 0) {
        issues.push({
          code: 'unknown-option',
          message: 'Una de las opciones elegidas ya no existe.',
        })
      } else if (!seen.has(key)) {
        seen.add(key)
        normalized.push({
          choice: { groupId: group.id, optionId: choice.optionId },
          order: groupIndex * 1000 + optionIndex,
        })
      }
    }

    for (const group of product.optionGroups) {
      const count = normalized.filter(({ choice }) => choice.groupId === group.id).length
      if (count < group.min || count > group.max) {
        issues.push({
          code: 'option-count',
          message: countLabel(group.min, group.max, group.label),
        })
      }
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      issues.push({ code: 'invalid-quantity', message: 'La cantidad debe ser al menos 1.' })
    }

    const [first, ...rest] = issues
    if (first) return { ok: false, issues: [first, ...rest] }

    const note = selection.note?.trim().slice(0, MAX_NOTE_LENGTH)
    const options = normalized.sort((a, b) => a.order - b.order).map(({ choice }) => choice)
    return {
      ok: true,
      selection: note ? { kind: 'food', options, note } : { kind: 'food', options },
    }
  },
}

export function matchesFoodFilters(item: FoodItem, filters: FoodFilters): boolean {
  const { excludeAllergens, maxSpiceLevel, availableOnly } = filters
  if (availableOnly && !item.available) return false
  if (maxSpiceLevel !== undefined && item.spiceLevel > maxSpiceLevel) return false
  if (excludeAllergens?.some((a) => item.allergens.includes(a))) return false
  return true
}

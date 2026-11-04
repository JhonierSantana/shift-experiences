import type { FoodItem, FoodOptionGroup, FoodSelection, Money, SelectionIssue } from '@/core/domain'
import { foodRules } from './rules'

/** Search params that open the dish sheet from any food page (URL-driven, so Back closes it). */
export const DISH_PARAM = 'plato'
/** Id of the order line being edited. */
export const EDIT_PARAM = 'editar'

/** Chosen option ids per group id (what the form holds before it becomes a FoodSelection). */
export type Picks = Readonly<Record<string, readonly string[]>>

export function picksToSelection(item: FoodItem, picks: Picks, note: string): FoodSelection {
  const options = item.optionGroups.flatMap((group) =>
    (picks[group.id] ?? []).map((optionId) => ({ groupId: group.id, optionId })),
  )
  const trimmed = note.trim()
  return trimmed ? { kind: 'food', options, note: trimmed } : { kind: 'food', options }
}

export function selectionToPicks(selection: FoodSelection): Picks {
  const picks: Record<string, string[]> = {}
  for (const { groupId, optionId } of selection.options) (picks[groupId] ??= []).push(optionId)
  return picks
}

/** Single-choice groups replace; multi-choice toggle, capped at `max`. */
export function togglePick(group: FoodOptionGroup, picks: Picks, optionId: string): Picks {
  const current = picks[group.id] ?? []
  if (group.max === 1) return { ...picks, [group.id]: [optionId] }
  if (current.includes(optionId)) {
    return { ...picks, [group.id]: current.filter((id) => id !== optionId) }
  }
  if (current.length >= group.max) return picks
  return { ...picks, [group.id]: [...current, optionId] }
}

export type GroupState = 'ok' | 'missing' | 'too-many'

export function groupState(group: FoodOptionGroup, count: number): GroupState {
  return count < group.min ? 'missing' : count > group.max ? 'too-many' : 'ok'
}

export function groupHint(group: FoodOptionGroup): string {
  if (group.min === 1 && group.max === 1) return 'Elige 1'
  if (group.min === 0) return `Opcional · hasta ${String(group.max)}`
  return `Elige de ${String(group.min)} a ${String(group.max)}`
}

export const hasRequiredGroups = (item: FoodItem): boolean =>
  item.optionGroups.some((g) => g.min > 0)

/** One tap adds the dish as-is when nothing has to be chosen. */
export const canQuickAdd = (item: FoodItem): boolean => item.available && !hasRequiredGroups(item)

/** Live total for the dish detail: the same pure rules the cart uses. */
export function previewTotal(item: FoodItem, selection: FoodSelection, quantity: number): Money {
  return foodRules.priceLine({
    id: 'preview',
    product: item,
    selection,
    quantity,
    addedAt: '',
  }).total
}

export function checkSelection(
  item: FoodItem,
  selection: FoodSelection,
  quantity: number,
): readonly SelectionIssue[] {
  const result = foodRules.validateSelection(item, selection, quantity)
  return result.ok ? [] : result.issues
}

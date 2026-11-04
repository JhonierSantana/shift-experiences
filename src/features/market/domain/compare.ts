import { formatMoney, type MarketProduct } from '@/core/domain'
import { priceDisplay } from './pricing'
import { stockLabel } from './stock'

export interface CompareCell {
  readonly text: string
  /** True for the winning value of a row (only when products actually differ). */
  readonly best: boolean
}

export interface CompareRow {
  readonly id: string
  readonly label: string
  readonly group: string
  readonly cells: readonly CompareCell[]
  readonly differs: boolean
}

function ranked(
  id: string,
  label: string,
  products: readonly MarketProduct[],
  value: (p: MarketProduct) => number,
  text: (p: MarketProduct) => string,
  better: 'lower' | 'higher',
): CompareRow {
  const values = products.map(value)
  const target = better === 'lower' ? Math.min(...values) : Math.max(...values)
  const differs = new Set(values).size > 1
  return {
    id,
    label,
    group: 'Resumen',
    differs,
    cells: products.map((p, i) => ({ text: text(p), best: differs && values[i] === target })),
  }
}

/**
 * Rows for the side-by-side table: a summary block (price, rating, discount, shipping,
 * stock) with the best value marked, then the union of every product's specs.
 */
export function buildCompareRows(products: readonly MarketProduct[]): CompareRow[] {
  if (products.length === 0) return []
  const rows: CompareRow[] = [
    ranked(
      'price',
      'Precio',
      products,
      (p) => priceDisplay(p).current.amount,
      (p) => formatMoney(priceDisplay(p).current),
      'lower',
    ),
    ranked(
      'rating',
      'Calificación',
      products,
      (p) => p.rating.average,
      (p) => `${p.rating.average.toFixed(1)} de 5 (${String(p.rating.count)})`,
      'higher',
    ),
    ranked(
      'discount',
      'Descuento',
      products,
      (p) => p.discount?.percent ?? 0,
      (p) => (p.discount ? `${String(p.discount.percent)} %` : 'Sin descuento'),
      'higher',
    ),
    ranked(
      'shipping',
      'Envío',
      products,
      (p) => (p.freeShipping ? 1 : 0),
      (p) => (p.freeShipping ? 'Gratis' : 'Con costo'),
      'higher',
    ),
    ranked(
      'stock',
      'Disponibilidad',
      products,
      (p) => (p.stock > 0 ? 1 : 0),
      (p) => stockLabel(p.stock),
      'higher',
    ),
  ]
  const seen = new Set<string>()
  const specKeys: { group: string; label: string }[] = []
  for (const p of products) {
    for (const s of p.specs) {
      const key = `${s.group}|${s.label}`
      if (!seen.has(key)) {
        seen.add(key)
        specKeys.push({ group: s.group, label: s.label })
      }
    }
  }
  for (const { group, label } of specKeys) {
    const texts = products.map(
      (p) => p.specs.find((s) => s.group === group && s.label === label)?.value ?? '—',
    )
    rows.push({
      id: `spec:${group}|${label}`,
      label,
      group,
      differs: new Set(texts).size > 1,
      cells: texts.map((text) => ({ text, best: false })),
    })
  }
  return rows
}

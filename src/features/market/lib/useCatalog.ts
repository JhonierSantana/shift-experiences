import { useMemo } from 'react'
import type { MarketProduct } from '@/core/domain'
import { useCategories, useProductList } from '@/infra/query'
import { marketData } from '../domain'

const ALL = { pageSize: 60 } as const

export interface Department {
  readonly id: string
  readonly label: string
  readonly count: number
  readonly brands: readonly string[]
  /** First product of the department: its art paints the department tile. */
  readonly cover: MarketProduct | undefined
}

/** The whole (small, cached) catalog; home, mega-menu, related and facets all read this one query. */
export function useCatalog() {
  return useProductList(marketData, ALL)
}

/** Departments from the repository's taxonomy, with counts and top brands from the catalog. */
export function useDepartments() {
  const categories = useCategories(marketData)
  const catalog = useCatalog()
  const departments = useMemo<Department[]>(() => {
    const items = catalog.data?.items ?? []
    return (categories.data ?? []).map((category) => {
      const inside = items.filter((p) => p.categoryId === category.id)
      const brandCounts = new Map<string, number>()
      for (const p of inside) brandCounts.set(p.brand, (brandCounts.get(p.brand) ?? 0) + 1)
      return {
        id: category.id,
        label: category.label,
        count: inside.length,
        brands: [...brandCounts].sort((a, b) => b[1] - a[1]).map(([name]) => name),
        cover: inside[0],
      }
    })
  }, [categories.data, catalog.data])
  return { departments, isPending: categories.isPending || catalog.isPending }
}

// Domain fixtures for tests of experience-agnostic layers (engine, core, infra).
// Experiences test their own adapters against their real catalogs.
import { money, multiply, type DomainAdapter, type MarketProduct } from '@/core/domain'
import type { RepositoriesOf } from '@/core/repositories'

export function testProduct(overrides: Partial<MarketProduct> = {}): MarketProduct {
  return {
    kind: 'market',
    id: 'p-1',
    slug: 'producto-de-prueba',
    title: 'Producto de prueba',
    description: 'Descripción de prueba.',
    price: money(10_000, 'COP'),
    media: [
      { alt: 'Producto', width: 100, height: 100, fallback: { kind: 'color', value: '#ccc' } },
    ],
    categoryId: 'general',
    tags: [],
    createdAt: '2026-01-01',
    brand: 'Marca',
    specs: [],
    rating: { average: 5, count: 1, distribution: [0, 0, 0, 0, 1] },
    stock: 10,
    seller: { id: 's', name: 'Tienda', rating: 5, official: true },
    freeShipping: false,
    ...overrides,
  }
}

const unused = (): Promise<never> =>
  Promise.reject(new Error('Repository not available in this test'))

const stubRepositories: RepositoriesOf<'market'> = {
  products: { list: unused, getById: unused, getMany: unused, listCategories: unused },
  reviews: { listByProduct: unused },
  orders: { place: unused, getById: unused, list: unused },
}

/** Minimal market-like adapter: price x quantity, stock-limited. */
export const testAdapter: DomainAdapter<'market'> = {
  kind: 'market',
  currency: 'COP',
  priceLine: ({ product, quantity }) => ({
    unit: product.price,
    total: multiply(product.price, quantity),
  }),
  describeLine: ({ product }) => ({ title: product.title, details: [] }),
  validateSelection: (product, _selection, quantity) =>
    product.stock >= quantity
      ? { ok: true, selection: { kind: 'market' } }
      : { ok: false, issues: [{ code: 'insufficient-stock', message: 'Sin stock suficiente.' }] },
  repositories: stubRepositories,
}

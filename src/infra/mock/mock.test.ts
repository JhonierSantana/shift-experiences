import { money, type MarketProduct } from '@/core/domain'
import { RepositoryError, type MarketFilters } from '@/core/repositories'
import { testAdapter, testProduct } from '@/test/factories'
import { MockBackend } from './backend'
import { createMockOrderRepository } from './orders'
import { createMockProductRepository } from './products'

const catalog: readonly MarketProduct[] = [
  testProduct({
    id: 'cafe',
    title: 'Café de origen',
    price: money(42_900, 'COP'),
    categoryId: 'mercado',
    createdAt: '2026-01-05',
  }),
  testProduct({
    id: 'cafetera',
    title: 'Cafetera espresso',
    price: money(899_900, 'COP'),
    categoryId: 'hogar',
    createdAt: '2026-06-28',
  }),
  testProduct({
    id: 'sarten',
    title: 'Sartén de cerámica',
    description: 'Ideal para café de olla',
    price: money(99_900, 'COP'),
    categoryId: 'hogar',
    stock: 0,
    createdAt: '2026-03-08',
  }),
]

function setup(backend = new MockBackend()) {
  const products = createMockProductRepository<MarketProduct, MarketFilters>({
    backend,
    load: () =>
      Promise.resolve({ products: catalog, categories: [{ id: 'hogar', label: 'Hogar' }] }),
    matchesFilters: (p, f) => !f.inStockOnly || p.stock > 0,
  })
  return { backend, products }
}

describe('mock product repository', () => {
  it('searches accent-insensitively, ranking title hits first', async () => {
    const { products } = setup()
    const page = await products.list({ search: 'CAFE' })
    expect(page.items.map((p) => p.id)).toEqual(['cafe', 'cafetera', 'sarten'])
  })

  it('filters, sorts and paginates', async () => {
    const { products } = setup()
    const hogar = await products.list({ categoryId: 'hogar', filters: { inStockOnly: true } })
    expect(hogar.items.map((p) => p.id)).toEqual(['cafetera'])

    const cheapest = await products.list({ sort: 'price-asc', pageSize: 2, page: 2 })
    expect(cheapest).toMatchObject({ page: 2, pageSize: 2, total: 3, pageCount: 2 })
    expect(cheapest.items.map((p) => p.id)).toEqual(['cafetera'])

    const newest = await products.list({ sort: 'newest' })
    expect(newest.items[0]?.id).toBe('cafetera')
  })

  it('rejects unknown ids with a non-retryable not-found error', async () => {
    const { products } = setup()
    const error: unknown = await products.getById('nope').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(RepositoryError)
    expect(error).toMatchObject({ code: 'not-found', retryable: false })
    expect((await products.getMany(['cafe', 'nope'])).map((p) => p.id)).toEqual(['cafe'])
  })
})

describe('mock backend fault injection', () => {
  it('fails the next N matching operations, then recovers', async () => {
    const { backend, products } = setup()
    backend.failNext('server', { operation: 'products.list', times: 2 })

    // Other operations are unaffected.
    await expect(products.listCategories()).resolves.toHaveLength(1)
    await expect(products.list()).rejects.toMatchObject({ code: 'server', retryable: true })
    await expect(products.list()).rejects.toMatchObject({ code: 'server' })
    await expect(products.list()).resolves.toMatchObject({ total: 3 })
  })

  it('fails randomly at the configured rate', async () => {
    const rolls = [0.05, 0.95]
    const backend = new MockBackend({ failureRate: 0.1, random: () => rolls.shift() ?? 1 })
    const { products } = setup(backend)
    await expect(products.list()).rejects.toMatchObject({ code: 'network' })
    await expect(products.list()).resolves.toBeDefined()
  })

  it('simulates latency and honors abort signals', async () => {
    vi.useFakeTimers()
    try {
      const { products } = setup(new MockBackend({ latency: 500 }))
      let settled = false
      const pending = products.getById('cafe').then(() => (settled = true))
      await vi.advanceTimersByTimeAsync(499)
      expect(settled).toBe(false)
      await vi.advanceTimersByTimeAsync(1)
      await pending
      expect(settled).toBe(true)

      const controller = new AbortController()
      const aborted = products.list({}, { signal: controller.signal })
      controller.abort()
      await expect(aborted).rejects.toMatchObject({ name: 'AbortError' })
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('mock order repository', () => {
  it('re-prices lines server-side, adds fees and rejects stale stock', async () => {
    const backend = new MockBackend()
    const orders = createMockOrderRepository({ backend, kind: 'market', pricing: testAdapter })
    const address = {
      id: 'a1',
      label: 'Casa',
      recipient: 'Ana Gómez',
      line1: 'Calle 10 # 5-20',
      city: 'Bogotá',
      region: 'Cundinamarca',
      country: 'CO',
      phone: '+57 300 000 0000',
    }
    const product = testProduct({ price: money(10_000, 'COP'), stock: 3 })
    const line = {
      id: 'l1',
      product,
      selection: { kind: 'market' as const },
      quantity: 2,
      addedAt: '2026-09-24',
    }

    const order = await orders.place({
      lines: [line],
      address,
      contactEmail: 'ana@example.com',
      fees: [{ label: 'Envío', amount: money(8_000, 'COP') }],
    })
    expect(order.totals.subtotal).toEqual(money(20_000, 'COP'))
    expect(order.totals.total).toEqual(money(28_000, 'COP'))
    await expect(orders.getById(order.id)).resolves.toBe(order)
    await expect(orders.list()).resolves.toEqual([order])

    await expect(
      orders.place({ lines: [{ ...line, quantity: 5 }], address, contactEmail: 'ana@example.com' }),
    ).rejects.toMatchObject({ code: 'conflict' })
  })
})

import type { StateStorage } from 'zustand/middleware'
import { money } from '@/core/domain'
import { testAdapter, testProduct } from '@/test/factories'
import {
  CART_STORAGE_VERSION,
  MAX_LINE_QUANTITY,
  cartStorageKey,
  createCartStore,
  createSummarySelector,
  selectItemCount,
} from '.'

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial))
  const storage: StateStorage = {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value)
    },
    removeItem: (key) => {
      data.delete(key)
    },
  }
  return { storage, data }
}

const fixedNow = () => new Date('2026-09-24T12:00:00.000Z')
const market = { kind: 'market' } as const

function makeStore(storage: StateStorage, scope = 'market') {
  return createCartStore({ scope, adapter: testAdapter, storage, now: fixedNow })
}

describe('cart store', () => {
  const shirt = testProduct({ id: 'shirt', price: money(50_000, 'COP'), stock: 5 })
  const mug = testProduct({ id: 'mug', price: money(12_000, 'COP'), stock: 2 })

  it('adds lines and merges repeated selections into one line', () => {
    const cart = makeStore(memoryStorage().storage)
    const first = cart.getState().add(shirt, market, 2)
    expect(first.ok).toBe(true)
    cart.getState().add(shirt, market, 1)
    cart.getState().add(mug, market)

    const { lines, updatedAt } = cart.getState()
    expect(lines.map((l) => [l.product.id, l.quantity])).toEqual([
      ['shirt', 3],
      ['mug', 1],
    ])
    expect(updatedAt).toBe('2026-09-24T12:00:00.000Z')
    expect(selectItemCount(cart.getState())).toBe(4)
  })

  it('rejects invalid quantities and selections the adapter refuses, leaving state untouched', () => {
    const cart = makeStore(memoryStorage().storage)
    expect(cart.getState().add(mug, market, 0).ok).toBe(false)
    expect(cart.getState().add(mug, market, MAX_LINE_QUANTITY + 1).ok).toBe(false)
    expect(cart.getState().add(mug, market, 3)).toMatchObject({
      ok: false,
      issues: [{ code: 'insufficient-stock' }],
    })

    cart.getState().add(mug, market, 2)
    const before = cart.getState().lines
    // Merging would exceed stock: the whole add is refused.
    expect(cart.getState().add(mug, market, 1).ok).toBe(false)
    expect(cart.getState().lines).toBe(before)
  })

  it('updates, removes and clears', () => {
    const cart = makeStore(memoryStorage().storage)
    const added = cart.getState().add(shirt, market)
    if (!added.ok) throw new Error('setup failed')

    expect(cart.getState().setQuantity(added.lineId, 4).ok).toBe(true)
    expect(cart.getState().lines[0]?.quantity).toBe(4)
    expect(cart.getState().setQuantity(added.lineId, 6).ok).toBe(false) // stock 5
    expect(cart.getState().setQuantity('missing', 1).ok).toBe(false)

    expect(cart.getState().setQuantity(added.lineId, 0).ok).toBe(true)
    expect(cart.getState().lines).toHaveLength(0)

    cart.getState().add(shirt, market)
    cart.getState().add(mug, market)
    cart.getState().remove(added.lineId)
    expect(cart.getState().lines.map((l) => l.product.id)).toEqual(['mug'])
    cart.getState().clear()
    expect(cart.getState().lines).toHaveLength(0)
  })

  it('persists per scope and rehydrates on creation', () => {
    const { storage, data } = memoryStorage()
    makeStore(storage).getState().add(shirt, market, 2)

    const raw = data.get(cartStorageKey('market'))
    expect(raw).toBeDefined()
    expect(JSON.parse(raw ?? '{}')).toMatchObject({ version: CART_STORAGE_VERSION })

    const reloaded = makeStore(storage)
    const [restored] = reloaded.getState().lines
    expect(reloaded.getState().lines).toHaveLength(1)
    expect(restored?.quantity).toBe(2)
    expect(restored?.product.id).toBe('shirt')
  })

  it('keeps carts of different experiences isolated', () => {
    const { storage, data } = memoryStorage()
    const fashion = makeStore(storage, 'fashion')
    const food = makeStore(storage, 'food')

    fashion.getState().add(shirt, market)
    expect(food.getState().lines).toHaveLength(0)
    food.getState().add(mug, market)
    food.getState().clear()

    expect(makeStore(storage, 'fashion').getState().lines).toHaveLength(1)
    expect([...data.keys()].sort()).toEqual([cartStorageKey('fashion'), cartStorageKey('food')])
  })

  it('falls back to an empty cart on corrupt JSON and drops the bad payload', () => {
    const key = cartStorageKey('market')
    const { storage, data } = memoryStorage({ [key]: '{not json' })
    const cart = makeStore(storage)
    expect(cart.getState().lines).toEqual([])
    expect(data.has(key)).toBe(false)
    // Still fully usable afterwards.
    expect(cart.getState().add(shirt, market).ok).toBe(true)
  })

  it('drops malformed, foreign or no-longer-valid lines but keeps the good ones', () => {
    const { storage: seed } = memoryStorage()
    const good = makeStore(seed)
    good.getState().add(shirt, market)
    const [validLine] = good.getState().lines

    const payload = {
      version: CART_STORAGE_VERSION,
      state: {
        updatedAt: '2026-09-01T00:00:00.000Z',
        lines: [
          validLine,
          { ...validLine, quantity: -1 },
          { ...validLine, product: { ...shirt, kind: 'food' } },
          { ...validLine, product: { ...mug, stock: 0 } }, // sold out since it was saved
          { ...validLine, product: { ...mug, price: 'free' } }, // pricing would throw
          'garbage',
          null,
        ],
      },
    }
    const key = cartStorageKey('market')
    const { storage } = memoryStorage({ [key]: JSON.stringify(payload) })
    const cart = makeStore(storage)
    expect(cart.getState().lines).toHaveLength(1)
    expect(cart.getState().lines[0]?.product.id).toBe('shirt')

    const { storage: wrongShape } = memoryStorage({
      [key]: JSON.stringify({ state: { lines: 'nope' } }),
    })
    expect(makeStore(wrongShape).getState().lines).toEqual([])
  })

  it('discards payloads from an unknown storage version', () => {
    const { storage: seed, data } = memoryStorage()
    makeStore(seed).getState().add(shirt, market)
    const stored = JSON.parse(data.get(cartStorageKey('market')) ?? '{}') as Record<string, unknown>

    const key = cartStorageKey('market')
    const { storage } = memoryStorage({ [key]: JSON.stringify({ ...stored, version: 99 }) })
    expect(makeStore(storage).getState().lines).toEqual([])
  })

  it('keeps working in memory when storage writes fail', () => {
    const storage: StateStorage = {
      getItem: () => null,
      setItem: () => {
        throw new DOMException('Quota exceeded', 'QuotaExceededError')
      },
      removeItem: () => undefined,
    }
    const cart = makeStore(storage)
    expect(cart.getState().add(shirt, market).ok).toBe(true)
    expect(cart.getState().lines).toHaveLength(1)
  })

  it('uses window.localStorage by default', () => {
    localStorage.clear()
    createCartStore({ scope: 'default-storage', adapter: testAdapter }).getState().add(mug, market)
    expect(localStorage.getItem(cartStorageKey('default-storage'))).toContain('"mug"')
    localStorage.clear()
  })
})

describe('cart summary selector', () => {
  it('prices through the adapter and is referentially stable while lines are unchanged', () => {
    const cart = makeStore(memoryStorage().storage)
    const selectSummary = createSummarySelector(testAdapter)
    const empty = selectSummary(cart.getState())
    expect(empty.subtotal).toEqual(money(0, 'COP'))

    cart.getState().add(testProduct({ id: 'a', price: money(1_000, 'COP') }), market, 3)
    cart.getState().add(testProduct({ id: 'b', price: money(2_500, 'COP') }), market)
    const summary = selectSummary(cart.getState())
    expect(summary.subtotal).toEqual(money(5_500, 'COP'))
    expect(summary.itemCount).toBe(4)
    expect(summary.lineCount).toBe(2)
    expect(summary.savings).toEqual(money(0, 'COP'))
    expect(selectSummary(cart.getState())).toBe(summary)
  })
})

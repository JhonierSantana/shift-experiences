import { createWishlistStore, wishlistStorageKey } from './store'

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(initial))
  return {
    get length() {
      return data.size
    },
    clear: () => {
      data.clear()
    },
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => {
      data.delete(key)
    },
    setItem: (key, value) => {
      data.set(key, value)
    },
  }
}

describe('wishlist store', () => {
  it('toggles ids, newest first', () => {
    const store = createWishlistStore('t', memoryStorage())
    store.getState().toggle('a')
    store.getState().toggle('b')
    expect(store.getState().ids).toEqual(['b', 'a'])
    store.getState().toggle('b')
    expect(store.getState().ids).toEqual(['a'])
  })

  it('persists per scope and rehydrates', async () => {
    const storage = memoryStorage()
    createWishlistStore('fashion', storage).getState().toggle('a')
    expect(storage.getItem(wishlistStorageKey('fashion'))).toContain('"a"')
    expect(storage.getItem(wishlistStorageKey('food'))).toBeNull()

    const reopened = createWishlistStore('fashion', storage)
    await reopened.persist.rehydrate()
    expect(reopened.getState().ids).toEqual(['a'])
  })

  it('sanitizes malformed payloads and survives corrupt JSON', async () => {
    const storage = memoryStorage({
      [wishlistStorageKey('x')]: JSON.stringify({
        state: { ids: ['ok', 3, null, 'ok'] },
        version: 1,
      }),
      [wishlistStorageKey('y')]: '{not json',
    })
    const x = createWishlistStore('x', storage)
    await x.persist.rehydrate()
    expect(x.getState().ids).toEqual(['ok'])
    const y = createWishlistStore('y', storage)
    await y.persist.rehydrate()
    expect(y.getState().ids).toEqual([])
  })
})

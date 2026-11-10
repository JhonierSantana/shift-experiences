import { MAX_COMPARE, compareStorageKey, createCompareStore } from './store'

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

describe('compare store', () => {
  it('adds and removes by toggling', () => {
    const store = createCompareStore('t', memoryStorage())
    expect(store.getState().toggle('a')).toBe('added')
    expect(store.getState().toggle('b')).toBe('added')
    expect(store.getState().toggle('a')).toBe('removed')
    expect(store.getState().ids).toEqual(['b'])
  })

  it(`refuses a product past ${String(MAX_COMPARE)} and says why`, () => {
    const store = createCompareStore('t', memoryStorage())
    for (let i = 0; i < MAX_COMPARE; i += 1) store.getState().toggle(`p${String(i)}`)
    expect(store.getState().toggle('extra')).toBe('full')
    expect(store.getState().ids).toHaveLength(MAX_COMPARE)
    expect(store.getState().notice).toMatch(/hasta 4 productos/)
    // Removing frees a slot and clears the notice.
    store.getState().remove('p0')
    expect(store.getState().notice).toBeNull()
    expect(store.getState().toggle('extra')).toBe('added')
  })

  it('persists ids per scope but never the transient notice', () => {
    const storage = memoryStorage()
    const first = createCompareStore('market', storage)
    first.getState().toggle('a')
    first.getState().toggle('b')
    const reloaded = createCompareStore('market', storage)
    expect(reloaded.getState().ids).toEqual(['a', 'b'])
    expect(reloaded.getState().notice).toBeNull()
    expect(createCompareStore('other', storage).getState().ids).toEqual([])
  })

  it('starts empty on corrupt payloads and caps oversized ones', () => {
    const corrupt = memoryStorage({ [compareStorageKey('t')]: '{not json' })
    expect(createCompareStore('t', corrupt).getState().ids).toEqual([])
    const oversized = memoryStorage({
      [compareStorageKey('t')]: JSON.stringify({
        state: { ids: ['a', 'b', 'c', 'd', 'e', 'f', 7, 'a'] },
        version: 1,
      }),
    })
    expect(createCompareStore('t', oversized).getState().ids).toEqual(['a', 'b', 'c', 'd'])
  })
})

import { act, renderHook } from '@testing-library/react'
import { useSpotlight } from '../../hooks'
import { CYCLE_MS } from '../../model'

async function tick(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })
}

describe('useSpotlight', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('moves to the next brand every cycle and wraps around', async () => {
    const { result } = renderHook(() => useSpotlight(3, true))
    expect(result.current[0]).toBe(0)
    await tick(CYCLE_MS)
    expect(result.current[0]).toBe(1)
    await tick(CYCLE_MS)
    expect(result.current[0]).toBe(2)
    await tick(CYCLE_MS)
    expect(result.current[0]).toBe(0)
  })

  it('holds still while inactive and resumes from the same brand', async () => {
    const { result, rerender } = renderHook(({ active }) => useSpotlight(3, active), {
      initialProps: { active: true },
    })
    await tick(CYCLE_MS)
    rerender({ active: false })
    await tick(CYCLE_MS * 5)
    expect(result.current[0]).toBe(1)
    rerender({ active: true })
    await tick(CYCLE_MS)
    expect(result.current[0]).toBe(2)
  })

  it('restarts the clock when a brand is picked by hand', async () => {
    const { result } = renderHook(() => useSpotlight(3, true))
    await tick(CYCLE_MS - 100)
    act(() => {
      result.current[1](2)
    })
    await tick(CYCLE_MS - 100)
    expect(result.current[0]).toBe(2)
    await tick(100)
    expect(result.current[0]).toBe(0)
  })

  it('never schedules anything without brands', async () => {
    const { result } = renderHook(() => useSpotlight(0, true))
    await tick(CYCLE_MS * 3)
    expect(result.current[0]).toBe(0)
    expect(vi.getTimerCount()).toBe(0)
  })
})

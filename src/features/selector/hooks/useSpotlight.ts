import { useEffect, useState } from 'react'
import { CYCLE_MS } from '../model'

/**
 * Which of `count` brands is in the spotlight. While `active`, it moves to the next one every
 * CYCLE_MS and wraps around; picking one by hand (`setIndex`) restarts the clock from there.
 */
export function useSpotlight(count: number, active: boolean) {
  const [index, setIndex] = useState(0)
  const current = count > 0 ? index % count : 0

  useEffect(() => {
    if (!active || count === 0) return
    const timer = window.setTimeout(() => {
      setIndex((value) => (value + 1) % count)
    }, CYCLE_MS)
    return () => {
      window.clearTimeout(timer)
    }
  }, [active, count, current])

  return [current, setIndex] as const
}

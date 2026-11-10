import { useEffect, useState } from 'react'

/** Current time, refreshed every `intervalMs` (opening hours, order timer). Pass null to stop ticking. */
export function useNow(intervalMs: number | null = 60_000): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    if (intervalMs === null) return
    const id = setInterval(() => {
      setNow(new Date())
    }, intervalMs)
    return () => {
      clearInterval(id)
    }
  }, [intervalMs])
  return now
}

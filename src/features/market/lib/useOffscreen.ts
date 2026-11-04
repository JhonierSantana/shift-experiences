import { useEffect, useState, type RefObject } from 'react'

/** True while `ref`'s element is outside the viewport. Stays false where IntersectionObserver is missing. */
export function useOffscreen(ref: RefObject<Element | null>): boolean {
  const [offscreen, setOffscreen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry) setOffscreen(!entry.isIntersecting)
    })
    observer.observe(el)
    return () => {
      observer.disconnect()
    }
  }, [ref])
  return offscreen
}

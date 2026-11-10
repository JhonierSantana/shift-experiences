import '@testing-library/jest-dom/vitest'
import { configure } from '@testing-library/react'

// Lazy experience chunks resolve slowly when 30+ jsdom workers run in parallel; the 1s default flakes.
configure({ asyncUtilTimeout: 5000 })

// jsdom does not implement scrolling; <ScrollRestoration> calls it on every navigation.
window.scrollTo = () => undefined

// jsdom has no IntersectionObserver; motion's `whileInView` needs one. Report everything as visible.
class VisibleIntersectionObserver {
  private readonly callback: IntersectionObserverCallback

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
  }

  observe(target: Element) {
    const entry = { isIntersecting: true, target, intersectionRatio: 1 }
    this.callback([entry as IntersectionObserverEntry], this as unknown as IntersectionObserver)
  }
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}
window.IntersectionObserver = VisibleIntersectionObserver as unknown as typeof IntersectionObserver

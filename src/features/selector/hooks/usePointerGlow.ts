import { useCallback, type PointerEvent } from 'react'

/**
 * Pointer handler that feeds a "light follows the cursor" effect. It writes `--mx` / `--my`
 * (pointer position inside the element, in px) straight to the element's style: no React state,
 * so moving the mouse never re-renders anything. CSS reads the variables (see `.door-glow`).
 * With `enabled` false (reduced motion) the light simply stays where CSS puts it by default.
 */
export function usePointerGlow(enabled: boolean) {
  return useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (!enabled) return
      const element = event.currentTarget
      const box = element.getBoundingClientRect()
      element.style.setProperty('--mx', `${String(event.clientX - box.left)}px`)
      element.style.setProperty('--my', `${String(event.clientY - box.top)}px`)
    },
    [enabled],
  )
}

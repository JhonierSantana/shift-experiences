import { preinit, preload } from 'react-dom'
import type { FontSpec } from './types'

/**
 * Inserts font stylesheets into <head> without suspending rendering
 * (text shows with fallback stacks, fonts swap in via display=swap).
 * React dedupes by href, so calling this on every render is cheap.
 */
export function useFonts(fonts: readonly FontSpec[]) {
  for (const font of fonts) {
    preinit(font.href, { as: 'style', precedence: 'fonts' })
  }
}

/** Warms the HTTP cache (e.g. on hover of a switch link) without applying styles. */
export function prefetchFonts(fonts: readonly FontSpec[]) {
  for (const font of fonts) {
    preload(font.href, { as: 'style' })
  }
}

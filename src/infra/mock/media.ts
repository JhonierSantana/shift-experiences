import type { Media } from '@/core/domain'

/**
 * Asset-free media for mock catalogs: an art-directed gradient with real
 * dimensions and alt text. A later milestone can add `src` without touching UI.
 */
export function placeholderMedia(
  alt: string,
  colors: readonly [string, string, ...string[]],
  {
    width = 1200,
    height = 1500,
    angle = 160,
  }: { width?: number; height?: number; angle?: number } = {},
): Media {
  return {
    alt,
    width,
    height,
    fallback: {
      kind: 'gradient',
      value: `linear-gradient(${String(angle)}deg, ${colors.join(', ')})`,
    },
  }
}
